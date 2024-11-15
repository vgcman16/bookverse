export interface UserPreferences {
    notifications: {
        pushEnabled: boolean;
        emailEnabled: boolean;
        bookClubUpdates: boolean;
        reviewResponses: boolean;
        newFollowers: boolean;
    };
    privacy: {
        profileVisibility: 'public' | 'private' | 'friends';
        showReadingProgress: boolean;
        showReviews: boolean;
        allowMessages: boolean;
    };
    theme: 'light' | 'dark' | 'system';
    language: string;
}

export interface UserStats {
    totalBooksRead: number;
    totalPagesRead: number;
    averageRating: number;
    reviewsWritten: number;
    challengesCompleted: number;
    readingStreak: number;
}

export interface User {
    id: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
    bio?: string;
    favoriteGenres?: string[];
    favoriteAuthors?: string[];
    readingGoal?: number;
    booksRead?: number;
    createdAt: Date;
    updatedAt: Date;
    preferences: UserPreferences;
    stats: UserStats;
    emailVerified?: boolean;
}

export interface UserCredentials {
    email: string;
    password: string;
}

export interface UserRegistration extends UserCredentials {
    displayName?: string;
    photoURL?: string;
    bio?: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
    notifications: {
        pushEnabled: true,
        emailEnabled: true,
        bookClubUpdates: true,
        reviewResponses: true,
        newFollowers: true
    },
    privacy: {
        profileVisibility: 'public',
        showReadingProgress: true,
        showReviews: true,
        allowMessages: true
    },
    theme: 'system',
    language: 'en'
};

export const DEFAULT_USER_STATS: UserStats = {
    totalBooksRead: 0,
    totalPagesRead: 0,
    averageRating: 0,
    reviewsWritten: 0,
    challengesCompleted: 0,
    readingStreak: 0
};
