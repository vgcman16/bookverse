import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import {
  BookClub,
  ClubDiscussion,
  ClubEvent,
  ReadingChallenge,
  ClubMembership,
  DiscussionReply,
} from '../models/club.model';

interface DiscussionUpdate {
  title?: string;
  content?: string;
  isPinned?: boolean;
  isLocked?: boolean;
}

interface EventComment {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
}

export class ClubService {
  private static instance: ClubService;
  private authService: AuthService;
  private clubs: Map<string, BookClub> = new Map();
  private discussions: Map<string, Map<string, ClubDiscussion>> = new Map(); // clubId -> discussionId -> discussion
  private events: Map<string, Map<string, ClubEvent>> = new Map(); // clubId -> eventId -> event
  private eventComments: Map<string, EventComment[]> = new Map(); // eventId -> comments
  private challenges: Map<string, ReadingChallenge> = new Map();
  private memberships: Map<string, ClubMembership[]> = new Map(); // userId -> memberships
  private userClubsSubject: BehaviorSubject<BookClub[]>;
  private discussionLikes: Set<string> = new Set(); // discussionId-userId
  private replyLikes: Set<string> = new Set(); // replyId-userId

  private constructor() {
    this.authService = AuthService.getInstance();
    this.userClubsSubject = new BehaviorSubject<BookClub[]>([]);
  }

  public static getInstance(): ClubService {
    if (!ClubService.instance) {
      ClubService.instance = new ClubService();
    }
    return ClubService.instance;
  }

  // Club Management
  public async createClub(
    name: string,
    description: string,
    isPublic: boolean = true
  ): Promise<BookClub> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to create a club');
    }

    const club: BookClub = {
      id: Date.now().toString(), // TODO: Use proper ID generation
      name,
      description,
      createdBy: user.id,
      admins: [user.id],
      members: [user.id],
      isPublic,
      tags: [],
      membershipRequests: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        totalMembers: 1,
        booksRead: 0,
        activeDiscussions: 0,
        upcomingEvents: 0,
        completedChallenges: 0,
      },
    };

    await this.saveClub(club);
    await this.createMembership(user.id, club.id);
    await this.updateUserClubs();
    return club;
  }

  public async updateClub(clubId: string, updates: Partial<BookClub>): Promise<BookClub> {
    const club = await this.getClub(clubId);
    if (!club) {
      throw new Error('Club not found');
    }

    await this.validatePermission(clubId);

    const updatedClub: BookClub = {
      ...club,
      ...updates,
      updatedAt: new Date(),
    };

    await this.saveClub(updatedClub);
    await this.updateUserClubs();
    return updatedClub;
  }

  public async deleteClub(clubId: string): Promise<void> {
    const club = await this.getClub(clubId);
    if (!club) {
      throw new Error('Club not found');
    }

    const user = this.authService.getCurrentUser();
    if (!user || club.createdBy !== user.id) {
      throw new Error('Only the club creator can delete the club');
    }

    this.clubs.delete(clubId);
    // TODO: Clean up all related data (discussions, events, etc.)
    await this.updateUserClubs();
  }

  public async getClub(clubId: string): Promise<BookClub | null> {
    // TODO: Implement backend/database fetch
    return this.clubs.get(clubId) || null;
  }

  public async searchClubs(query: string): Promise<BookClub[]> {
    const clubs = Array.from(this.clubs.values());
    if (!query.trim()) {
      return clubs.filter(club => club.isPublic);
    }

    const searchTerm = query.toLowerCase();
    return clubs.filter(
      club =>
        club.isPublic &&
        (club.name.toLowerCase().includes(searchTerm) ||
          club.description.toLowerCase().includes(searchTerm) ||
          club.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
  }

  // Membership Management
  public async joinClub(clubId: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to join a club');
    }

    const club = await this.getClub(clubId);
    if (!club) {
      throw new Error('Club not found');
    }

    if (!club.isPublic) {
      club.membershipRequests.push(user.id);
    } else {
      club.members.push(user.id);
      club.stats.totalMembers++;
      await this.createMembership(user.id, clubId);
    }

    await this.saveClub(club);
    await this.updateUserClubs();
  }

  public async leaveClub(clubId: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to leave a club');
    }

    const club = await this.getClub(clubId);
    if (!club) {
      throw new Error('Club not found');
    }

    if (club.createdBy === user.id) {
      throw new Error('Club creator cannot leave the club');
    }

    club.members = club.members.filter(id => id !== user.id);
    club.admins = club.admins.filter(id => id !== user.id);
    club.stats.totalMembers--;

    await this.saveClub(club);
    await this.deleteMembership(user.id, clubId);
    await this.updateUserClubs();
  }

  // Discussion Management
  public async createDiscussion(
    clubId: string,
    title: string,
    content: string,
    bookId?: string
  ): Promise<ClubDiscussion> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to create discussions');
    }

    const discussion: ClubDiscussion = {
      id: Date.now().toString(), // TODO: Use proper ID generation
      clubId,
      title,
      content,
      createdBy: user.id,
      bookId,
      tags: [],
      likes: 0,
      replies: [],
      isPinned: false,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let clubDiscussions = this.discussions.get(clubId);
    if (!clubDiscussions) {
      clubDiscussions = new Map();
      this.discussions.set(clubId, clubDiscussions);
    }
    clubDiscussions.set(discussion.id, discussion);

    return discussion;
  }

  public async getDiscussion(clubId: string, discussionId: string): Promise<ClubDiscussion | null> {
    const clubDiscussions = this.discussions.get(clubId);
    return clubDiscussions?.get(discussionId) || null;
  }

  public async updateDiscussion(
    clubId: string,
    discussionId: string,
    updates: DiscussionUpdate
  ): Promise<ClubDiscussion> {
    const discussion = await this.getDiscussion(clubId, discussionId);
    if (!discussion) {
      throw new Error('Discussion not found');
    }

    const updatedDiscussion: ClubDiscussion = {
      ...discussion,
      ...updates,
      updatedAt: new Date(),
    };

    const clubDiscussions = this.discussions.get(clubId);
    clubDiscussions?.set(discussionId, updatedDiscussion);

    return updatedDiscussion;
  }

  public async deleteDiscussion(clubId: string, discussionId: string): Promise<void> {
    const clubDiscussions = this.discussions.get(clubId);
    if (!clubDiscussions) return;

    clubDiscussions.delete(discussionId);
    if (clubDiscussions.size === 0) {
      this.discussions.delete(clubId);
    }
  }

  public async addDiscussionReply(
    clubId: string,
    discussionId: string,
    content: string,
    parentReplyId?: string
  ): Promise<DiscussionReply> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to reply');
    }

    const discussion = await this.getDiscussion(clubId, discussionId);
    if (!discussion) {
      throw new Error('Discussion not found');
    }

    if (discussion.isLocked) {
      throw new Error('Discussion is locked');
    }

    const reply: DiscussionReply = {
      id: Date.now().toString(),
      discussionId,
      content,
      createdBy: user.id,
      likes: 0,
      parentReplyId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    discussion.replies.push(reply);
    const clubDiscussions = this.discussions.get(clubId);
    clubDiscussions?.set(discussionId, discussion);

    return reply;
  }

  public async deleteReply(clubId: string, discussionId: string, replyId: string): Promise<void> {
    const discussion = await this.getDiscussion(clubId, discussionId);
    if (!discussion) return;

    discussion.replies = discussion.replies.filter(reply => reply.id !== replyId);
    const clubDiscussions = this.discussions.get(clubId);
    clubDiscussions?.set(discussionId, discussion);
  }

  // Event Management
  public async createEvent(
    clubId: string,
    eventData: Omit<ClubEvent, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ClubEvent> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to create events');
    }

    const newEvent: ClubEvent = {
      ...eventData,
      id: Date.now().toString(), // TODO: Use proper ID generation
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let clubEvents = this.events.get(clubId);
    if (!clubEvents) {
      clubEvents = new Map();
      this.events.set(clubId, clubEvents);
    }
    clubEvents.set(newEvent.id, newEvent);

    return newEvent;
  }

  public async getEvent(clubId: string, eventId: string): Promise<ClubEvent | null> {
    const clubEvents = this.events.get(clubId);
    return clubEvents?.get(eventId) || null;
  }

  public async updateEvent(
    clubId: string,
    eventId: string,
    updates: Partial<ClubEvent>
  ): Promise<ClubEvent> {
    const event = await this.getEvent(clubId, eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const updatedEvent: ClubEvent = {
      ...event,
      ...updates,
      updatedAt: new Date(),
    };

    const clubEvents = this.events.get(clubId);
    clubEvents?.set(eventId, updatedEvent);

    return updatedEvent;
  }

  public async deleteEvent(clubId: string, eventId: string): Promise<void> {
    const clubEvents = this.events.get(clubId);
    if (!clubEvents) return;

    clubEvents.delete(eventId);
    if (clubEvents.size === 0) {
      this.events.delete(clubId);
    }

    // Clean up comments
    this.eventComments.delete(eventId);
  }

  public async updateEventAttendance(
    clubId: string,
    eventId: string,
    status: 'going' | 'maybe' | 'notGoing'
  ): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to update attendance');
    }

    const event = await this.getEvent(clubId, eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Remove user from all attendance lists
    event.attendees.going = event.attendees.going.filter(id => id !== user.id);
    event.attendees.maybe = event.attendees.maybe.filter(id => id !== user.id);
    event.attendees.notGoing = event.attendees.notGoing.filter(id => id !== user.id);

    // Add user to selected attendance list
    event.attendees[status].push(user.id);

    const clubEvents = this.events.get(clubId);
    clubEvents?.set(eventId, event);
  }

  public async addEventComment(
    clubId: string,
    eventId: string,
    content: string
  ): Promise<EventComment> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to comment');
    }

    const event = await this.getEvent(clubId, eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const comment: EventComment = {
      id: Date.now().toString(),
      content,
      authorId: user.id,
      createdAt: new Date(),
    };

    const comments = this.eventComments.get(eventId) || [];
    comments.push(comment);
    this.eventComments.set(eventId, comments);

    return comment;
  }

  public async getEventComments(eventId: string): Promise<EventComment[]> {
    return this.eventComments.get(eventId) || [];
  }

  // Interaction Management
  public async toggleDiscussionLike(clubId: string, discussionId: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to like discussions');
    }

    const discussion = await this.getDiscussion(clubId, discussionId);
    if (!discussion) {
      throw new Error('Discussion not found');
    }

    const likeId = `${discussionId}-${user.id}`;
    const isLiked = this.discussionLikes.has(likeId);

    if (isLiked) {
      this.discussionLikes.delete(likeId);
      discussion.likes--;
    } else {
      this.discussionLikes.add(likeId);
      discussion.likes++;
    }

    const clubDiscussions = this.discussions.get(clubId);
    clubDiscussions?.set(discussionId, discussion);
  }

  public async toggleReplyLike(
    clubId: string,
    discussionId: string,
    replyId: string
  ): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to like replies');
    }

    const discussion = await this.getDiscussion(clubId, discussionId);
    if (!discussion) {
      throw new Error('Discussion not found');
    }

    const reply = discussion.replies.find(r => r.id === replyId);
    if (!reply) {
      throw new Error('Reply not found');
    }

    const likeId = `${replyId}-${user.id}`;
    const isLiked = this.replyLikes.has(likeId);

    if (isLiked) {
      this.replyLikes.delete(likeId);
      reply.likes--;
    } else {
      this.replyLikes.add(likeId);
      reply.likes++;
    }

    const clubDiscussions = this.discussions.get(clubId);
    clubDiscussions?.set(discussionId, discussion);
  }

  public isDiscussionLiked(discussionId: string): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;

    return this.discussionLikes.has(`${discussionId}-${user.id}`);
  }

  public isReplyLiked(replyId: string): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;

    return this.replyLikes.has(`${replyId}-${user.id}`);
  }

  // Observable Getters
  public get userClubs$(): Observable<BookClub[]> {
    return this.userClubsSubject.asObservable();
  }

  // Private Helper Methods
  private async saveClub(club: BookClub): Promise<void> {
    this.clubs.set(club.id, club);
    // TODO: Implement backend/database save
  }

  private async createMembership(userId: string, clubId: string): Promise<void> {
    const membership: ClubMembership = {
      userId,
      clubId,
      roles: [],
      joinedAt: new Date(),
      status: 'active',
      participation: {
        discussionsStarted: 0,
        repliesPosted: 0,
        eventsAttended: 0,
        challengesCompleted: 0,
        lastActive: new Date(),
      },
    };

    const userMemberships = this.memberships.get(userId) || [];
    userMemberships.push(membership);
    this.memberships.set(userId, userMemberships);
  }

  private async deleteMembership(userId: string, clubId: string): Promise<void> {
    const userMemberships = this.memberships.get(userId) || [];
    this.memberships.set(
      userId,
      userMemberships.filter(m => m.clubId !== clubId)
    );
  }

  private async validatePermission(clubId: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const club = await this.getClub(clubId);
    if (!club) {
      throw new Error('Club not found');
    }

    // Club creators and admins have all permissions
    if (club.createdBy === user.id || club.admins.includes(user.id)) {
      return;
    }

    // TODO: Implement role-based permission checking
    throw new Error('Insufficient permissions');
  }

  private async updateUserClubs(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.userClubsSubject.next([]);
      return;
    }

    const userMemberships = this.memberships.get(user.id) || [];
    const userClubs = await Promise.all(
      userMemberships.map(async m => {
        const club = await this.getClub(m.clubId);
        return club;
      })
    );

    this.userClubsSubject.next(userClubs.filter((club): club is BookClub => club !== null));
  }
}
