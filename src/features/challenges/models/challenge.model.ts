export interface ReadingChallenge {
    id: string;
    title: string;
    description: string;
    createdBy: string;
    clubId?: string;
    type: ChallengeType;
    difficulty: ChallengeDifficulty;
    goal: number;
    startDate: Date;
    endDate: Date;
    rules: string[];
    rewards: ChallengeReward[];
    participants: string[];
    completedBy: string[];
    tags: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ChallengeProgress {
    id: string;
    userId: string;
    challengeId: string;
    currentProgress: number;
    milestones: ChallengeMilestone[];
    status: ChallengeStatus;
    startedAt: Date;
    completedAt?: Date;
    lastUpdated: Date;
}

export interface ChallengeMilestone {
    id: string;
    title: string;
    description: string;
    targetProgress: number;
    reward?: ChallengeReward;
    isCompleted: boolean;
    completedAt?: Date;
}

export interface ChallengeReward {
    id: string;
    type: RewardType;
    title: string;
    description: string;
    iconUrl?: string;
    value: number; // Points, XP, etc.
}

export enum ChallengeType {
    BooksRead = 'booksRead',
    PagesRead = 'pagesRead',
    GenresExplored = 'genresExplored',
    AuthorsDiscovered = 'authorsDiscovered',
    ReadingStreak = 'readingStreak',
    ReadingTime = 'readingTime',
    ReviewsWritten = 'reviewsWritten',
    DiscussionsParticipated = 'discussionsParticipated',
    Custom = 'custom'
}

export enum ChallengeStatus {
    NotStarted = 'notStarted',
    InProgress = 'inProgress',
    Completed = 'completed',
    Failed = 'failed',
    Abandoned = 'abandoned'
}

export enum RewardType {
    Badge = 'badge',
    Points = 'points',
    Achievement = 'achievement',
    Title = 'title',
    CustomReward = 'customReward'
}

export interface ChallengeStats {
    totalParticipants: number;
    completionRate: number;
    averageProgress: number;
    topPerformers: {
        userId: string;
        progress: number;
        completedAt?: Date;
    }[];
}

export interface ChallengeFilters {
    type?: ChallengeType;
    status?: ChallengeStatus;
    clubId?: string;
    isActive?: boolean;
    startDateRange?: {
        start: Date;
        end: Date;
    };
    difficulty?: ChallengeDifficulty;
}

export enum ChallengeDifficulty {
    Easy = 'easy',
    Medium = 'medium',
    Hard = 'hard',
    Expert = 'expert'
}

export interface ChallengeActivity {
    id: string;
    challengeId: string;
    userId: string;
    type: ChallengeActivityType;
    details: {
        bookId?: string;
        pageCount?: number;
        reviewId?: string;
        discussionId?: string;
        progressUpdate?: number;
        milestoneId?: string;
    };
    timestamp: Date;
}

export enum ChallengeActivityType {
    Started = 'started',
    BookCompleted = 'bookCompleted',
    ProgressUpdate = 'progressUpdate',
    MilestoneReached = 'milestoneReached',
    ReviewPosted = 'reviewPosted',
    DiscussionParticipated = 'discussionParticipated',
    Completed = 'completed',
    Abandoned = 'abandoned'
}

export interface ChallengeLeaderboard {
    challengeId: string;
    entries: ChallengeLeaderboardEntry[];
    lastUpdated: Date;
}

export interface ChallengeLeaderboardEntry {
    userId: string;
    rank: number;
    progress: number;
    completedMilestones: number;
    totalPoints: number;
    completionTime?: number; // In milliseconds, if completed
}

export interface ChallengeNotification {
    id: string;
    challengeId: string;
    userId: string;
    type: ChallengeNotificationType;
    message: string;
    data?: {
        milestoneId?: string;
        progress?: number;
        reward?: ChallengeReward;
    };
    isRead: boolean;
    createdAt: Date;
}

export enum ChallengeNotificationType {
    Started = 'started',
    MilestoneReached = 'milestoneReached',
    NearMilestone = 'nearMilestone',
    Completed = 'completed',
    NewParticipant = 'newParticipant',
    RankChanged = 'rankChanged',
    Reminder = 'reminder',
    EndingSoon = 'endingSoon'
}
