export interface FirebaseMessage {
    messageId: string;
    data?: {
        type?: string;
        payload?: string;
        actionUrl?: string;
        priority?: string;
        groupId?: string;
        [key: string]: string | undefined;
    };
    notification?: {
        title?: string;
        body?: string;
        android?: {
            imageUrl?: string;
            sound?: string;
            channelId?: string;
        };
        ios?: {
            imageUrl?: string;
            sound?: string;
            badge?: number;
        };
    };
    from?: string;
    priority?: string;
    category?: string;
}

export interface FirebaseMessaging {
    hasPermission(): Promise<boolean>;
    requestPermission(): Promise<boolean>;
    registerDeviceForPushNotifications(): Promise<string>;
    unregisterDeviceForPushNotifications(): Promise<void>;
    subscribeToTopic(topic: string): Promise<void>;
    unsubscribeFromTopic(topic: string): Promise<void>;
    onMessage(callback: (message: FirebaseMessage) => void): void;
    onToken(callback: (token: string) => void): void;
}

export interface LocalNotificationAction {
    id: string;
    title: string;
    launch?: boolean;
    submitLabel?: string;
    placeholder?: string;
    type?: 'button' | 'input';
    editable?: boolean;
    choices?: string[];
}

export interface LocalNotificationScheduleOptions {
    id: number;
    title: string;
    body: string;
    ticker?: string;
    at?: Date;
    badge?: number;
    sound?: string;
    interval?: number;
    icon?: string;
    image?: string;
    thumbnail?: string;
    ongoing?: boolean;
    channel?: string;
    forceShowWhenInForeground?: boolean;
    priority?: number;
    actions?: LocalNotificationAction[];
}

export interface LocalNotificationReceivedEvent {
    id: number;
    title?: string;
    body?: string;
    event?: string;
    response?: string;
    actionId?: string;
}

export interface LocalNotificationManager {
    schedule(options: LocalNotificationScheduleOptions[]): Promise<void>;
    cancel(id: number): Promise<void>;
    cancelAll(): Promise<void>;
    getScheduledIds(): Promise<number[]>;
    hasPermission(): Promise<boolean>;
    requestPermission(): Promise<boolean>;
    addOnMessageReceivedCallback(callback: (notification: LocalNotificationReceivedEvent) => void): void;
    removeOnMessageReceivedCallback(callback: (notification: LocalNotificationReceivedEvent) => void): void;
}

export interface MessagingOptions {
    showNotificationsWhenInForeground?: boolean;
    onMessageReceived?: (message: FirebaseMessage) => void;
    onTokenRefresh?: (token: string) => void;
}

export class Messaging implements FirebaseMessaging {
    constructor() {}

    async init(options: MessagingOptions): Promise<void> {
        // Implementation will be provided by the NativeScript plugin
        return Promise.resolve();
    }

    async hasPermission(): Promise<boolean> {
        return Promise.resolve(false);
    }

    async requestPermission(): Promise<boolean> {
        return Promise.resolve(false);
    }

    async registerDeviceForPushNotifications(): Promise<string> {
        return Promise.resolve('');
    }

    async unregisterDeviceForPushNotifications(): Promise<void> {
        return Promise.resolve();
    }

    async subscribeToTopic(topic: string): Promise<void> {
        return Promise.resolve();
    }

    async unsubscribeFromTopic(topic: string): Promise<void> {
        return Promise.resolve();
    }

    onMessage(callback: (message: FirebaseMessage) => void): void {}

    onToken(callback: (token: string) => void): void {}
}
