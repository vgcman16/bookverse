export interface Following {
    id: string;
    followerId: string;
    followingId: string;
    createdAt: Date;
}

export interface UserActivity {
    id: string;
    userId: string;
    type: ActivityType;
    data: ActivityData;
    timestamp: Date;
    isPublic: boolean;
}

export enum ActivityType {
    BookStarted = 'bookStarted',
    BookFinished = 'bookFinished',
    ReviewPosted = 'reviewPosted',
    ChallengeJoined = 'challengeJoined',
    ChallengeCompleted = 'challengeCompleted',
    ClubJoined = 'clubJoined',
    ClubCreated = 'clubCreated',
    DiscussionStarted = 'discussionStarted',
    DiscussionReplied = 'discussionReplied',
    EventCreated = 'eventCreated',
    EventJoined = 'eventJoined',
    AchievementEarned = 'achievementEarned',
    MilestoneReached = 'milestoneReached'
}

export interface ActivityData {
    bookId?: string;
    bookTitle?: string;
    reviewId?: string;
    reviewRating?: number;
    challengeId?: string;
    challengeTitle?: string;
    clubId?: string;
    clubName?: string;
    discussionId?: string;
    discussionTitle?: string;
    eventId?: string;
    eventTitle?: string;
    achievementId?: string;
    achievementTitle?: string;
    milestoneId?: string;
    milestoneTitle?: string;
    progress?: number;
}

export interface NewsFeedItem extends UserActivity {
    user: {
        id: string;
        name: string;
        avatarUrl?: string;
    };
    interactions: {
        likes: number;
        comments: number;
        hasLiked: boolean;
    };
}

export interface ActivityInteraction {
    id: string;
    activityId: string;
    userId: string;
    type: InteractionType;
    timestamp: Date;
    content?: string; // For comments
}

export enum InteractionType {
    Like = 'like',
    Comment = 'comment'
}

export interface FollowSuggestion {
    userId: string;
    name: string;
    avatarUrl?: string;
    bio?: string;
    mutualFollowers: number;
    recentActivity?: UserActivity;
    commonInterests: {
        genres?: string[];
        authors?: string[];
        books?: string[];
        clubs?: string[];
    };
}

export interface FollowStats {
    followersCount: number;
    followingCount: number;
    mutualFollowersCount: number;
}

export interface ActivityFilter {
    types?: ActivityType[];
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    isPublic?: boolean;
}

export interface NewsFeedFilter {
    followingOnly?: boolean;
    types?: ActivityType[];
    startDate?: Date;
    endDate?: Date;
}

export interface ActivityNotification {
    id: string;
    userId: string;
    activityId: string;
    type: ActivityNotificationType;
    isRead: boolean;
    timestamp: Date;
}

export enum ActivityNotificationType {
    NewFollower = 'newFollower',
    ActivityLike = 'activityLike',
    ActivityComment = 'activityComment',
    MentionedInComment = 'mentionedInComment'
}

export interface FollowRequest {
    id: string;
    requesterId: string;
    targetId: string;
    status: FollowRequestStatus;
    createdAt: Date;
    updatedAt: Date;
}

export enum FollowRequestStatus {
    Pending = 'pending',
    Accepted = 'accepted',
    Rejected = 'rejected'
}

export interface PrivacySettings {
    userId: string;
    isPrivateProfile: boolean;
    requireFollowApproval: boolean;
    showReadingProgress: boolean;
    showReviews: boolean;
    showClubMembership: boolean;
    showChallenges: boolean;
    allowActivityFeedComments: boolean;
    allowDirectMessages: boolean;
}
