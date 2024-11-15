export interface UserPreferences {
    notifications: {
        pushEnabled: boolean;
        emailEnabled: boolean;
        bookClubUpdates: boolean;
        reviewResponses: boolean;
        newFollowers: boolean;
    };
    privacy: {
        profileVisibility: string;
        showReadingProgress: boolean;
        showReviews: boolean;
        allowMessages: boolean;
    };
    theme: 'light' | 'dark' | 'system';
    language: string;
}

export interface User {
    id: string;
    email: string;
    password?: string; // Optional as we don't want to expose this in most cases
    displayName: string;
    photoURL: string;
    bio?: string;
    favoriteGenres?: string[];
    favoriteAuthors?: string[];
    readingGoal?: number;
    booksRead?: number;
    createdAt: Date;
    updatedAt: Date;
    isPrivate?: boolean;
    lastActive?: Date;
    location?: string;
    website?: string;
    socialLinks?: {
        twitter?: string;
        instagram?: string;
        goodreads?: string;
    };
    preferences?: UserPreferences;
    stats?: {
        totalBooksRead: number;
        totalPagesRead: number;
        averageRating: number;
        reviewsWritten: number;
        challengesCompleted: number;
        readingStreak: number;
    };
    badges?: {
        id: string;
        name: string;
        description: string;
        imageUrl: string;
        earnedAt: Date;
    }[];
}

export interface UserCredentials {
    email: string;
    password: string;
}

export interface UserRegistration extends UserCredentials {
    displayName: string;
    photoURL?: string;
    bio?: string;
}

export interface UserUpdate {
    displayName?: string;
    photoURL?: string;
    bio?: string;
    favoriteGenres?: string[];
    favoriteAuthors?: string[];
    readingGoal?: number;
    location?: string;
    website?: string;
    socialLinks?: {
        twitter?: string;
        instagram?: string;
        goodreads?: string;
    };
    preferences?: Partial<UserPreferences>;
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

// Auth service method names for consistency
export const AUTH_METHODS = {
    SIGN_IN: 'signIn',
    SIGN_OUT: 'signOut',
    UPDATE_PROFILE: 'updateProfile',
    GET_USER_BY_ID: 'getUserById',
    IS_AUTHENTICATED: 'isAuthenticated'
} as const;
