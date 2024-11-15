export interface User {
    id: string;
    email: string;
    displayName: string;
    photoUri?: string;  // Using photoUri consistently across the app
    createdAt: Date;
    lastLoginAt: Date;
    preferences: UserPreferences;
}

export interface UserPreferences {
    theme: 'light' | 'dark';
    notifications: NotificationPreferences;
    privacy: PrivacySettings;
}

export interface NotificationPreferences {
    pushEnabled: boolean;
    emailEnabled: boolean;
    bookClubUpdates: boolean;
    reviewResponses: boolean;
    newFollowers: boolean;
}

export interface PrivacySettings {
    profileVisibility: 'public' | 'private' | 'friends';
    showReadingProgress: boolean;
    showReviews: boolean;
    allowMessages: boolean;
}

export interface UserCredentials {
    email: string;
    password: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    error: string | null;
}

// Firebase specific types
export interface NativeScriptFirebaseUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoUri: string | null;
    metadata: {
        creationDate: Date;
        lastSignInDate: Date;
    };
}

export interface UserProfileUpdate {
    displayName?: string;
    photoUri?: string;
}
