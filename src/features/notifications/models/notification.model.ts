export enum NotificationType {
    // Social Notifications
    NewFollower = 'newFollower',
    ActivityLike = 'activityLike',
    ActivityComment = 'activityComment',
    MentionedInComment = 'mentionedInComment',

    // Book Club Notifications
    ClubInvite = 'clubInvite',
    NewDiscussion = 'newDiscussion',
    DiscussionReply = 'discussionReply',
    NewEvent = 'newEvent',
    EventReminder = 'eventReminder',
    EventUpdate = 'eventUpdate',

    // Challenge Notifications
    ChallengeInvite = 'challengeInvite',
    ChallengeStarted = 'challengeStarted',
    ChallengeCompleted = 'challengeCompleted',
    MilestoneReached = 'milestoneReached',
    ChallengeUpdate = 'challengeUpdate',

    // Reading Progress Notifications
    ReadingGoalReminder = 'readingGoalReminder',
    ReadingGoalAchieved = 'readingGoalAchieved',
    ReadingStreak = 'readingStreak',
    ReadingStreakRisk = 'readingStreakRisk',

    // Review Notifications
    ReviewLike = 'reviewLike',
    ReviewComment = 'reviewComment',
    ReviewMention = 'reviewMention',

    // Achievement Notifications
    BadgeEarned = 'badgeEarned',
    LevelUp = 'levelUp',
    AchievementUnlocked = 'achievementUnlocked',

    // System Notifications
    SystemAnnouncement = 'systemAnnouncement',
    AppUpdate = 'appUpdate',
    MaintenanceAlert = 'maintenanceAlert'
}

export interface NotificationData {
    // Social Data
    userId?: string;
    userName?: string;
    userAvatar?: string;
    activityId?: string;
    activityType?: string;
    commentId?: string;
    commentText?: string;

    // Book Club Data
    clubId?: string;
    clubName?: string;
    discussionId?: string;
    discussionTitle?: string;
    eventId?: string;
    eventTitle?: string;
    eventDate?: Date;

    // Challenge Data
    challengeId?: string;
    challengeTitle?: string;
    progress?: number;
    milestoneId?: string;
    milestoneTitle?: string;

    // Reading Progress Data
    bookId?: string;
    bookTitle?: string;
    currentProgress?: number;
    goalProgress?: number;
    streakDays?: number;

    // Review Data
    reviewId?: string;
    reviewText?: string;
    rating?: number;

    // Achievement Data
    badgeId?: string;
    badgeName?: string;
    badgeImageUrl?: string;
    achievementId?: string;
    achievementTitle?: string;
    level?: number;
    points?: number;

    // System Data
    announcementId?: string;
    announcementTitle?: string;
    updateVersion?: string;
    maintenanceTime?: Date;
    maintenanceDuration?: number;
}

export interface PushNotification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    data: NotificationData;
    timestamp: Date;
    isRead: boolean;
    actionUrl?: string;
    priority: NotificationPriority;
    groupId?: string;
    icon?: string;
    sound?: string;
    vibration?: boolean;
    badge?: number;
}

export enum NotificationPriority {
    Low = 'low',
    Normal = 'normal',
    High = 'high'
}

export interface NotificationPreferences {
    enabled: boolean;
    types: {
        [key in NotificationType]: boolean;
    };
    quiet: {
        enabled: boolean;
        startTime: string; // HH:mm format
        endTime: string; // HH:mm format
    };
    grouping: {
        enabled: boolean;
        maxGroupSize: number;
    };
    sound: boolean;
    vibration: boolean;
    badge: boolean;
}

export interface NotificationGroup {
    id: string;
    type: NotificationType;
    notifications: PushNotification[];
    summary: string;
    timestamp: Date;
    isRead: boolean;
}

export interface NotificationStats {
    totalCount: number;
    unreadCount: number;
    groupedByType: {
        [key in NotificationType]: number;
    };
    lastNotification?: PushNotification;
    mostFrequentType?: NotificationType;
}

export interface NotificationFilter {
    types?: NotificationType[];
    startDate?: Date;
    endDate?: Date;
    isRead?: boolean;
    priority?: NotificationPriority;
}

export interface NotificationAction {
    id: string;
    title: string;
    icon?: string;
    callback: (notification: PushNotification) => void;
}

export interface NotificationChannel {
    id: string;
    name: string;
    description: string;
    importance: NotificationPriority;
    sound?: string;
    vibration?: boolean;
    badge?: boolean;
    groupId?: string;
}
