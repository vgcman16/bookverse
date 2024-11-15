import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import {
    BookClub,
    ClubDiscussion,
    ClubEvent,
    ReadingChallenge,
    ClubAnnouncement,
    ClubInvitation,
    ClubRole,
    ClubMembership,
    ClubPermission,
    ReadingMilestone,
    DiscussionReply
} from '../models/club.model';

export class ClubService {
    private static instance: ClubService;
    private authService: AuthService;
    private clubs: Map<string, BookClub> = new Map();
    private discussions: Map<string, ClubDiscussion> = new Map();
    private events: Map<string, ClubEvent> = new Map();
    private challenges: Map<string, ReadingChallenge> = new Map();
    private memberships: Map<string, ClubMembership[]> = new Map(); // userId -> memberships
    private userClubsSubject: BehaviorSubject<BookClub[]>;

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
    public async createClub(name: string, description: string, isPublic: boolean = true): Promise<BookClub> {
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
                completedChallenges: 0
            }
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

        await this.validatePermission(clubId, ClubPermission.UpdateClubInfo);

        const updatedClub: BookClub = {
            ...club,
            ...updates,
            updatedAt: new Date()
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
        return clubs.filter(club => 
            club.isPublic && (
                club.name.toLowerCase().includes(searchTerm) ||
                club.description.toLowerCase().includes(searchTerm) ||
                club.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            )
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
    public async createDiscussion(clubId: string, title: string, content: string, bookId?: string): Promise<ClubDiscussion> {
        await this.validatePermission(clubId, ClubPermission.ManageDiscussions);

        const user = this.authService.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated to create discussions');
        }

        const discussion: ClubDiscussion = {
            id: Date.now().toString(),
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
            updatedAt: new Date()
        };

        this.discussions.set(discussion.id, discussion);
        
        const club = await this.getClub(clubId);
        if (club) {
            club.stats.activeDiscussions++;
            await this.saveClub(club);
        }

        return discussion;
    }

    public async addDiscussionReply(discussionId: string, content: string, parentReplyId?: string): Promise<DiscussionReply> {
        const user = this.authService.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated to reply');
        }

        const discussion = this.discussions.get(discussionId);
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
            updatedAt: new Date()
        };

        discussion.replies.push(reply);
        discussion.updatedAt = new Date();
        this.discussions.set(discussionId, discussion);

        return reply;
    }

    // Event Management
    public async createEvent(clubId: string, event: Omit<ClubEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClubEvent> {
        await this.validatePermission(clubId, ClubPermission.ManageEvents);

        const newEvent: ClubEvent = {
            ...event,
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.events.set(newEvent.id, newEvent);

        const club = await this.getClub(clubId);
        if (club) {
            club.stats.upcomingEvents++;
            await this.saveClub(club);
        }

        return newEvent;
    }

    // Challenge Management
    public async createChallenge(clubId: string, challenge: Omit<ReadingChallenge, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReadingChallenge> {
        await this.validatePermission(clubId, ClubPermission.ManageChallenges);

        const newChallenge: ReadingChallenge = {
            ...challenge,
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.challenges.set(newChallenge.id, newChallenge);
        return newChallenge;
    }

    // Observables
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
                lastActive: new Date()
            }
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

    private async validatePermission(clubId: string, permission: ClubPermission): Promise<void> {
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
