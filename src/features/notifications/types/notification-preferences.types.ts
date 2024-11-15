import { NotificationType, NotificationPriority } from '../models/notification.model';

export interface TimeWindow {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    days: string[]; // ['monday', 'tuesday', etc.]
}

export interface DeliveryPreference {
    inApp: boolean;
    push: boolean;
    email: boolean;
    emailDigest: boolean;
}

export interface CategoryPreference {
    enabled: boolean;
    priority: NotificationPriority;
    delivery: DeliveryPreference;
    timeWindows: TimeWindow[];
    sound?: string;
    vibration: boolean;
    grouping: boolean;
}

export interface CustomNotificationPreferences {
    globalEnabled: boolean;
    quietHours: TimeWindow;
    categories: {
        [key in NotificationType]: CategoryPreference;
    };
    defaultDelivery: DeliveryPreference;
    defaultTimeWindow: TimeWindow;
    deviceTokens: string[];
    emailSettings: {
        digestFrequency: 'daily' | 'weekly' | 'never';
        digestTime: string; // HH:mm format
        digestDays: string[]; // ['monday', 'friday'] for weekly
        unsubscribeToken?: string;
    };
}

export interface NotificationChannel {
    id: string;
    name: string;
    description: string;
    types: NotificationType[];
    importance: NotificationPriority;
    sound?: string;
    vibration: boolean;
    grouping: boolean;
}

export interface PreferenceUpdateResult {
    success: boolean;
    error?: string;
    updatedPreferences?: CustomNotificationPreferences;
}

export const DEFAULT_PREFERENCES: CustomNotificationPreferences = {
    globalEnabled: true,
    quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '07:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    categories: Object.values(NotificationType).reduce((acc, type) => ({
        ...acc,
        [type]: {
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
        }
    }), {} as { [key in NotificationType]: CategoryPreference }),
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
    }
};
