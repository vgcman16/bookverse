export interface BookClub {
    id: string;
    name: string;
    description: string;
    coverImage?: string;
    createdBy: string; // userId
    admins: string[]; // userIds
    members: string[]; // userIds
    currentlyReading?: string; // bookId
    readingSchedule?: ReadingSchedule;
    isPublic: boolean;
    tags: string[];
    membershipRequests: string[]; // userIds
    createdAt: Date;
    updatedAt: Date;
    stats: ClubStats;
}

export interface ReadingSchedule {
    bookId: string;
    startDate: Date;
    endDate: Date;
    milestones: ReadingMilestone[];
    discussionThreads: string[]; // threadIds
}

export interface ReadingMilestone {
    id: string;
    title: string;
    description?: string;
    targetDate: Date;
    targetProgress: number; // percentage or page number
    completed: boolean;
}

export interface ClubStats {
    totalMembers: number;
    booksRead: number;
    activeDiscussions: number;
    upcomingEvents: number;
    completedChallenges: number;
}

export interface ClubDiscussion {
    id: string;
    clubId: string;
    title: string;
    content: string;
    createdBy: string; // userId
    bookId?: string;
    milestone?: string; // milestoneId
    tags: string[];
    likes: number;
    replies: DiscussionReply[];
    isPinned: boolean;
    isLocked: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface DiscussionReply {
    id: string;
    discussionId: string;
    content: string;
    createdBy: string; // userId
    likes: number;
    parentReplyId?: string; // for nested replies
    createdAt: Date;
    updatedAt: Date;
}

export interface ClubEvent {
    id: string;
    clubId: string;
    title: string;
    description: string;
    type: ClubEventType;
    startDate: Date;
    endDate: Date;
    location?: {
        type: 'online' | 'physical';
        details: string; // URL for online, address for physical
    };
    attendees: {
        going: string[]; // userIds
        maybe: string[]; // userIds
        notGoing: string[]; // userIds
    };
    bookId?: string;
    createdBy: string; // userId
    createdAt: Date;
    updatedAt: Date;
}

export enum ClubEventType {
    BookDiscussion = 'book-discussion',
    AuthorQA = 'author-qa',
    ReadingMeetup = 'reading-meetup',
    BookSwap = 'book-swap',
    SocialGathering = 'social-gathering',
    Other = 'other'
}

export interface ReadingChallenge {
    id: string;
    clubId: string;
    title: string;
    description: string;
    type: Challengetype;
    startDate: Date;
    endDate: Date;
    target: number;
    participants: {
        userId: string;
        progress: number;
        completed: boolean;
        completedAt?: Date;
    }[];
    rewards?: {
        type: string;
        description: string;
        imageUrl?: string;
    };
    createdBy: string; // userId
    createdAt: Date;
    updatedAt: Date;
}

export enum Challengetype {
    BooksRead = 'books-read',
    PagesRead = 'pages-read',
    GenresExplored = 'genres-explored',
    ReadingStreak = 'reading-streak',
    TimeSpentReading = 'time-spent-reading'
}

export interface ClubAnnouncement {
    id: string;
    clubId: string;
    title: string;
    content: string;
    importance: 'low' | 'medium' | 'high';
    createdBy: string; // userId
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ClubInvitation {
    id: string;
    clubId: string;
    invitedBy: string; // userId
    invitedUser: string; // userId or email
    status: 'pending' | 'accepted' | 'declined';
    message?: string;
    createdAt: Date;
    expiresAt: Date;
}

export interface ClubRole {
    id: string;
    clubId: string;
    name: string;
    permissions: ClubPermission[];
    members: string[]; // userIds
    createdAt: Date;
    updatedAt: Date;
}

export enum ClubPermission {
    ManageMembers = 'manage-members',
    ManageRoles = 'manage-roles',
    ManageEvents = 'manage-events',
    ManageDiscussions = 'manage-discussions',
    ManageChallenges = 'manage-challenges',
    ManageAnnouncements = 'manage-announcements',
    ModerateContent = 'moderate-content',
    InviteMembers = 'invite-members',
    UpdateClubInfo = 'update-club-info'
}

export interface ClubMembership {
    userId: string;
    clubId: string;
    roles: string[]; // roleIds
    joinedAt: Date;
    status: 'active' | 'inactive' | 'banned';
    participation: {
        discussionsStarted: number;
        repliesPosted: number;
        eventsAttended: number;
        challengesCompleted: number;
        lastActive: Date;
    };
}
