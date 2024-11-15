import { Observable, BehaviorSubject } from 'rxjs';
import { Application, Utils, isAndroid, isIOS } from '@nativescript/core';
import {
    FirebaseMessage,
    FirebaseMessaging,
    Messaging,
    MessagingOptions,
    LocalNotificationManager,
    LocalNotificationScheduleOptions,
    LocalNotificationReceivedEvent
} from '../types/notification.types';
import { AuthService } from '../../auth/services/auth.service';
import { NavigationService } from '../../../core/services/navigation.service';
import {
    NotificationType,
    PushNotification,
    NotificationPreferences,
    NotificationGroup,
    NotificationStats,
    NotificationFilter,
    NotificationPriority,
    NotificationChannel,
    NotificationAction
} from '../models/notification.model';

declare const UIApplication: any;
declare const UIApplicationState: any;

export class NotificationService {
    private static instance: NotificationService;
    private authService: AuthService;
    private messaging: Messaging;
    private localNotifications: LocalNotificationManager;
    private notifications: Map<string, PushNotification> = new Map();
    private groups: Map<string, NotificationGroup> = new Map();
    private preferences: Map<string, NotificationPreferences> = new Map(); // userId -> preferences
    private channels: Map<string, NotificationChannel> = new Map();
    private notificationsSubject: BehaviorSubject<PushNotification[]>;
    private unreadCountSubject: BehaviorSubject<number>;

    private constructor() {
        this.authService = AuthService.getInstance();
        this.messaging = new Messaging();
        this.localNotifications = require('@nativescript/local-notifications');
        this.notificationsSubject = new BehaviorSubject<PushNotification[]>([]);
        this.unreadCountSubject = new BehaviorSubject<number>(0);
        this.initializeNotifications();
    }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    private async initializeNotifications(): Promise<void> {
        // Initialize Firebase Cloud Messaging
        const messagingOptions: MessagingOptions = {
            showNotificationsWhenInForeground: true,
            onMessageReceived: this.handlePushNotification.bind(this),
            onTokenRefresh: this.handleTokenRefresh.bind(this)
        };

        await this.messaging.init(messagingOptions);

        // Initialize Local Notifications
        const hasPermission = await this.localNotifications.hasPermission();
        if (!hasPermission) {
            await this.localNotifications.requestPermission();
        }

        this.localNotifications.addOnMessageReceivedCallback(
            this.handleLocalNotification.bind(this)
        );

        // Request permissions
        await this.requestPermissions();

        // Set up default channels
        this.setupDefaultChannels();

        // Load user preferences
        await this.loadUserPreferences();
    }

    private async requestPermissions(): Promise<void> {
        try {
            const hasPermission = await this.messaging.hasPermission();
            if (!hasPermission) {
                const granted = await this.messaging.requestPermission();
                if (granted) {
                    console.log('Push notification permissions granted');
                } else {
                    console.log('Push notification permissions denied');
                }
            }
        } catch (error) {
            console.error('Error requesting permissions:', error);
        }
    }

    private setupDefaultChannels(): void {
        const defaultChannels: NotificationChannel[] = [
            {
                id: 'social',
                name: 'Social',
                description: 'Notifications about followers, likes, and comments',
                importance: NotificationPriority.Normal
            },
            {
                id: 'bookClubs',
                name: 'Book Clubs',
                description: 'Updates from your book clubs and events',
                importance: NotificationPriority.High
            },
            {
                id: 'challenges',
                name: 'Challenges',
                description: 'Challenge updates and achievements',
                importance: NotificationPriority.Normal
            },
            {
                id: 'system',
                name: 'System',
                description: 'Important system announcements',
                importance: NotificationPriority.High
            }
        ];

        defaultChannels.forEach(channel => this.channels.set(channel.id, channel));
    }

    private async loadUserPreferences(): Promise<void> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) return;

        // Load from storage or use defaults
        const defaultPreferences: NotificationPreferences = {
            enabled: true,
            types: Object.values(NotificationType).reduce((acc, type) => ({
                ...acc,
                [type]: true
            }), {} as { [key in NotificationType]: boolean }),
            quiet: {
                enabled: false,
                startTime: '22:00',
                endTime: '08:00'
            },
            grouping: {
                enabled: true,
                maxGroupSize: 5
            },
            sound: true,
            vibration: true,
            badge: true
        };

        this.preferences.set(currentUser.id, defaultPreferences);
    }

    // Push Notification Handlers
    private async handlePushNotification(message: FirebaseMessage): Promise<void> {
        const notification: PushNotification = {
            id: message.messageId || Date.now().toString(),
            type: message.data?.type as NotificationType,
            title: message.notification?.title || '',
            body: message.notification?.body || '',
            data: JSON.parse(message.data?.payload || '{}'),
            timestamp: new Date(),
            isRead: false,
            actionUrl: message.data?.actionUrl,
            priority: message.data?.priority as NotificationPriority || NotificationPriority.Normal,
            groupId: message.data?.groupId,
            icon: message.notification?.android?.imageUrl || message.notification?.ios?.imageUrl,
            sound: message.notification?.android?.sound || message.notification?.ios?.sound,
            vibration: true,
            badge: message.notification?.ios?.badge
        };

        await this.processNotification(notification);
    }

    private async handleLocalNotification(event: LocalNotificationReceivedEvent): Promise<void> {
        // Handle local notification click/interaction
        if (event.actionId) {
            this.handleNotificationAction(event.id.toString(), event.actionId);
        }
    }

    private async handleTokenRefresh(token: string): Promise<void> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) return;

        try {
            // TODO: Update token on backend
            console.log('FCM Token refreshed:', token);
        } catch (error) {
            console.error('Error updating FCM token:', error);
        }
    }

    // Notification Management
    private async processNotification(notification: PushNotification): Promise<void> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) return;

        const userPrefs = this.preferences.get(currentUser.id);
        if (!userPrefs?.enabled || !userPrefs.types[notification.type]) return;

        // Check quiet hours
        if (this.isInQuietHours(userPrefs)) {
            notification.sound = undefined;
            notification.vibration = false;
        }

        // Store notification
        this.notifications.set(notification.id, notification);

        // Update groups if enabled
        if (userPrefs.grouping.enabled && notification.groupId) {
            this.updateNotificationGroup(notification);
        }

        // Show notification
        await this.showNotification(notification);

        // Update observables
        this.updateNotificationSubjects();
    }

    private async showNotification(notification: PushNotification): Promise<void> {
        const isAppActive = isAndroid ? 
            Application.android?.startActivity?.hasWindowFocus() :
            Application.ios?.window?.rootViewController !== null && 
            UIApplication.sharedApplication.applicationState === 0; // UIApplicationStateActive = 0

        if (isAppActive) {
            // App is in foreground, show in-app notification
            this.showInAppNotification(notification);
        } else {
            // App is in background, show system notification
            const options: LocalNotificationScheduleOptions = {
                id: parseInt(notification.id),
                title: notification.title,
                body: notification.body,
                icon: notification.icon,
                sound: notification.sound,
                badge: notification.badge,
                channel: this.getChannelForType(notification.type),
                at: new Date(),
                actions: [
                    {
                        id: 'view',
                        title: 'View',
                        launch: true
                    },
                    {
                        id: 'dismiss',
                        title: 'Dismiss',
                        launch: false
                    }
                ]
            };

            await this.localNotifications.schedule([options]);
        }
    }

    private showInAppNotification(notification: PushNotification): void {
        // TODO: Implement in-app notification UI
        console.log('Show in-app notification:', notification);
    }

    private updateNotificationGroup(notification: PushNotification): void {
        if (!notification.groupId) return;

        let group = this.groups.get(notification.groupId);
        if (!group) {
            group = {
                id: notification.groupId,
                type: notification.type,
                notifications: [],
                summary: '',
                timestamp: new Date(),
                isRead: false
            };
        }

        group.notifications.push(notification);
        group.timestamp = notification.timestamp;
        group.summary = this.generateGroupSummary(group);
        this.groups.set(notification.groupId, group);
    }

    private generateGroupSummary(group: NotificationGroup): string {
        const count = group.notifications.length;
        switch (group.type) {
            case NotificationType.ActivityLike:
                return `${count} people liked your activity`;
            case NotificationType.ActivityComment:
                return `${count} new comments on your activity`;
            // Add more cases for other notification types
            default:
                return `${count} new notifications`;
        }
    }

    // Public Methods
    public async getNotifications(filter?: NotificationFilter): Promise<PushNotification[]> {
        let notifications = Array.from(this.notifications.values());

        if (filter) {
            if (filter.types) {
                notifications = notifications.filter(n => filter.types!.includes(n.type));
            }
            if (filter.startDate) {
                notifications = notifications.filter(n => n.timestamp >= filter.startDate!);
            }
            if (filter.endDate) {
                notifications = notifications.filter(n => n.timestamp <= filter.endDate!);
            }
            if (filter.isRead !== undefined) {
                notifications = notifications.filter(n => n.isRead === filter.isRead);
            }
            if (filter.priority) {
                notifications = notifications.filter(n => n.priority === filter.priority);
            }
        }

        return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    public async markAsRead(notificationId: string): Promise<void> {
        const notification = this.notifications.get(notificationId);
        if (!notification) return;

        notification.isRead = true;
        this.notifications.set(notificationId, notification);

        if (notification.groupId) {
            const group = this.groups.get(notification.groupId);
            if (group) {
                group.isRead = group.notifications.every(n => n.isRead);
                this.groups.set(notification.groupId, group);
            }
        }

        this.updateNotificationSubjects();
    }

    public async markAllAsRead(): Promise<void> {
        this.notifications.forEach(notification => {
            notification.isRead = true;
        });

        this.groups.forEach(group => {
            group.isRead = true;
        });

        this.updateNotificationSubjects();
    }

    public async deleteNotification(notificationId: string): Promise<void> {
        const notification = this.notifications.get(notificationId);
        if (!notification) return;

        this.notifications.delete(notificationId);

        if (notification.groupId) {
            const group = this.groups.get(notification.groupId);
            if (group) {
                group.notifications = group.notifications.filter(n => n.id !== notificationId);
                if (group.notifications.length === 0) {
                    this.groups.delete(notification.groupId);
                } else {
                    group.summary = this.generateGroupSummary(group);
                    this.groups.set(notification.groupId, group);
                }
            }
        }

        this.updateNotificationSubjects();
    }

    public async clearAll(): Promise<void> {
        this.notifications.clear();
        this.groups.clear();
        this.updateNotificationSubjects();
        await this.localNotifications.cancelAll();
    }

    public async updatePreferences(preferences: NotificationPreferences): Promise<void> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) return;

        this.preferences.set(currentUser.id, preferences);
        // TODO: Sync with backend
    }

    // Helper Methods
    private isInQuietHours(prefs: NotificationPreferences): boolean {
        if (!prefs.quiet.enabled) return false;

        const now = new Date();
        const currentTime = `${now.getHours()}:${now.getMinutes()}`;
        return currentTime >= prefs.quiet.startTime && currentTime <= prefs.quiet.endTime;
    }

    private getChannelForType(type: NotificationType): string {
        switch (type) {
            case NotificationType.NewFollower:
            case NotificationType.ActivityLike:
            case NotificationType.ActivityComment:
            case NotificationType.MentionedInComment:
                return 'social';
            case NotificationType.ClubInvite:
            case NotificationType.NewDiscussion:
            case NotificationType.NewEvent:
                return 'bookClubs';
            case NotificationType.ChallengeInvite:
            case NotificationType.ChallengeCompleted:
            case NotificationType.MilestoneReached:
                return 'challenges';
            case NotificationType.SystemAnnouncement:
            case NotificationType.AppUpdate:
            case NotificationType.MaintenanceAlert:
                return 'system';
            default:
                return 'default';
        }
    }

    private handleNotificationAction(notificationId: string, actionId: string): void {
        const notification = this.notifications.get(notificationId);
        if (!notification) return;

        switch (actionId) {
            case 'view':
                if (notification.actionUrl) {
                    NavigationService.navigate(notification.actionUrl);
                }
                break;
            case 'dismiss':
                this.deleteNotification(notificationId);
                break;
            // Add more action handlers as needed
        }
    }

    private updateNotificationSubjects(): void {
        const notifications = Array.from(this.notifications.values());
        this.notificationsSubject.next(notifications);
        this.unreadCountSubject.next(notifications.filter(n => !n.isRead).length);
    }

    // Observable Getters
    public get notifications$(): Observable<PushNotification[]> {
        return this.notificationsSubject.asObservable();
    }

    public get unreadCount$(): Observable<number> {
        return this.unreadCountSubject.asObservable();
    }
}
