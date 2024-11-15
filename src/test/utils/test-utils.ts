import { User, UserPreferences } from '../../features/auth/models/user.model';
import { NotificationType, NotificationPriority } from '../../features/notifications/models/notification.model';
import { CustomNotificationPreferences, CategoryPreference } from '../../features/notifications/types/notification-preferences.types';

export const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    preferences: createMockUserPreferences(),
    stats: {
        totalBooksRead: 0,
        totalPagesRead: 0,
        averageRating: 0,
        reviewsWritten: 0,
        challengesCompleted: 0,
        readingStreak: 0
    },
    ...overrides
});

export const createMockUserPreferences = (overrides: Partial<UserPreferences> = {}): UserPreferences => ({
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
    language: 'en',
    ...overrides
});

const createDefaultCategoryPreference = (): CategoryPreference => ({
    enabled: true,
    priority: NotificationPriority.Normal,
    delivery: {
        inApp: true,
        push: true,
        email: true,
        emailDigest: false
    },
    timeWindows: [],
    vibration: true,
    grouping: true
});

export const createMockNotificationPreferences = (
    overrides: Partial<CustomNotificationPreferences> = {}
): CustomNotificationPreferences => {
    const defaultCategories = Object.values(NotificationType).reduce((acc, type) => ({
        ...acc,
        [type]: createDefaultCategoryPreference()
    }), {} as Record<NotificationType, CategoryPreference>);

    return {
        globalEnabled: true,
        quietHours: {
            enabled: false,
            startTime: '22:00',
            endTime: '07:00',
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        categories: defaultCategories,
        defaultDelivery: {
            inApp: true,
            push: true,
            email: true,
            emailDigest: false
        },
        defaultTimeWindow: {
            enabled: false,
            startTime: '09:00',
            endTime: '21:00',
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        deviceTokens: [],
        emailSettings: {
            digestFrequency: 'daily',
            digestTime: '09:00',
            digestDays: ['monday', 'wednesday', 'friday']
        },
        ...overrides
    };
};

export const waitFor = async (callback: () => boolean | Promise<boolean>, timeout = 5000): Promise<void> => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        if (await callback()) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('Timeout waiting for condition');
};

export const mockPromise = <T>(): {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason?: any) => void;
} => {
    let resolve!: (value: T) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

export const createAsyncIterator = <T>(items: T[]): AsyncIterator<T> => {
    let index = 0;
    return {
        next: async () => {
            if (index >= items.length) {
                return { done: true, value: undefined };
            }
            return { done: false, value: items[index++] };
        }
    };
};

export const mockConsoleError = (): jest.SpyInstance => {
    const originalError = console.error;
    const mockFn = jest.fn();
    console.error = mockFn;
    return {
        ...jest.spyOn(console, 'error'),
        mockRestore: () => {
            console.error = originalError;
        }
    };
};

export const createMockEvent = (type: string, detail?: any): Event => {
    return {
        type,
        detail,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
    } as unknown as Event;
};
