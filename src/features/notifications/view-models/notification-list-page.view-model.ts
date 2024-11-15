import { Observable } from '@nativescript/core';
import { NotificationService } from '../services/notification.service';
import { NavigationService } from '../../../core/services/navigation.service';
import {
    PushNotification,
    NotificationType,
    NotificationPreferences,
    NotificationFilter
} from '../models/notification.model';

export class NotificationListPageViewModel extends Observable {
    private notificationService: NotificationService;
    private _notifications: PushNotification[] = [];
    private _selectedNotification: PushNotification | null = null;
    private _isLoading: boolean = false;
    private _selectedTabIndex: number = 0;
    private _isShowingActions: boolean = false;
    private _isShowingSettings: boolean = false;
    private _preferences: NotificationPreferences | null = null;
    private _notificationTypes: { name: string; type: NotificationType; enabled: boolean; }[] = [];

    constructor() {
        super();
        this.notificationService = NotificationService.getInstance();
        this.initializeNotificationTypes();
        this.loadNotifications();
        this.setupSubscriptions();
    }

    // Getters and Setters
    get notifications(): PushNotification[] {
        return this._notifications;
    }

    set notifications(value: PushNotification[]) {
        if (this._notifications !== value) {
            this._notifications = value;
            this.notifyPropertyChange('notifications', value);
            this.updateCounts();
        }
    }

    get selectedNotification(): PushNotification | null {
        return this._selectedNotification;
    }

    set selectedNotification(value: PushNotification | null) {
        if (this._selectedNotification !== value) {
            this._selectedNotification = value;
            this.notifyPropertyChange('selectedNotification', value);
        }
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    set isLoading(value: boolean) {
        if (this._isLoading !== value) {
            this._isLoading = value;
            this.notifyPropertyChange('isLoading', value);
        }
    }

    get selectedTabIndex(): number {
        return this._selectedTabIndex;
    }

    set selectedTabIndex(value: number) {
        if (this._selectedTabIndex !== value) {
            this._selectedTabIndex = value;
            this.notifyPropertyChange('selectedTabIndex', value);
            this.filterNotifications();
        }
    }

    get isShowingActions(): boolean {
        return this._isShowingActions;
    }

    set isShowingActions(value: boolean) {
        if (this._isShowingActions !== value) {
            this._isShowingActions = value;
            this.notifyPropertyChange('isShowingActions', value);
        }
    }

    get isShowingSettings(): boolean {
        return this._isShowingSettings;
    }

    set isShowingSettings(value: boolean) {
        if (this._isShowingSettings !== value) {
            this._isShowingSettings = value;
            this.notifyPropertyChange('isShowingSettings', value);
        }
    }

    get preferences(): NotificationPreferences | null {
        return this._preferences;
    }

    set preferences(value: NotificationPreferences | null) {
        if (this._preferences !== value) {
            this._preferences = value;
            this.notifyPropertyChange('preferences', value);
            this.updateNotificationTypes();
        }
    }

    get notificationTypes(): { name: string; type: NotificationType; enabled: boolean; }[] {
        return this._notificationTypes;
    }

    // Event Handlers
    public onShowActions(args: any): void {
        const notification = args.object.bindingContext as PushNotification;
        this.selectedNotification = notification;
        this.isShowingActions = true;
    }

    public onHideActions(): void {
        this.isShowingActions = false;
        this.selectedNotification = null;
    }

    public onShowSettings(): void {
        this.isShowingSettings = true;
    }

    public onHideSettings(): void {
        this.isShowingSettings = false;
    }

    public async onMarkAsRead(): Promise<void> {
        if (!this.selectedNotification) return;

        await this.notificationService.markAsRead(this.selectedNotification.id);
        this.isShowingActions = false;
        this.selectedNotification = null;
    }

    public async onMarkAsUnread(): Promise<void> {
        if (!this.selectedNotification) return;

        await this.notificationService.markAsRead(this.selectedNotification.id);
        this.isShowingActions = false;
        this.selectedNotification = null;
    }

    public async onDelete(): Promise<void> {
        if (!this.selectedNotification) return;

        await this.notificationService.deleteNotification(this.selectedNotification.id);
        this.isShowingActions = false;
        this.selectedNotification = null;
    }

    public async onClearAll(): Promise<void> {
        await this.notificationService.clearAll();
    }

    public async onSaveSettings(): Promise<void> {
        if (!this.preferences) return;

        // Update preferences with notification type settings
        this.notificationTypes.forEach(type => {
            if (this.preferences?.types) {
                this.preferences.types[type.type] = type.enabled;
            }
        });

        await this.notificationService.updatePreferences(this.preferences);
        this.isShowingSettings = false;
    }

    public onNotificationTap(args: any): void {
        const notification = args.view.bindingContext as PushNotification;
        if (notification.actionUrl) {
            NavigationService.navigate(notification.actionUrl);
        }
    }

    // Private Methods
    private async loadNotifications(): Promise<void> {
        this.isLoading = true;
        try {
            const notifications = await this.notificationService.getNotifications();
            this.notifications = notifications;
            this.filterNotifications();
        } catch (error) {
            console.error('Error loading notifications:', error);
            // TODO: Show error message to user
        } finally {
            this.isLoading = false;
        }
    }

    private filterNotifications(): void {
        const filter: NotificationFilter = {};

        switch (this.selectedTabIndex) {
            case 1: // Unread
                filter.isRead = false;
                break;
            case 2: // Social
                filter.types = [
                    NotificationType.NewFollower,
                    NotificationType.ActivityLike,
                    NotificationType.ActivityComment,
                    NotificationType.MentionedInComment
                ];
                break;
            case 3: // Book Clubs
                filter.types = [
                    NotificationType.ClubInvite,
                    NotificationType.NewDiscussion,
                    NotificationType.NewEvent,
                    NotificationType.EventReminder
                ];
                break;
            case 4: // Challenges
                filter.types = [
                    NotificationType.ChallengeInvite,
                    NotificationType.ChallengeStarted,
                    NotificationType.ChallengeCompleted,
                    NotificationType.MilestoneReached
                ];
                break;
        }

        this.notificationService.getNotifications(filter)
            .then(notifications => {
                this.notifications = notifications;
            });
    }

    private updateCounts(): void {
        const totalCount = this.notifications.length;
        const unreadCount = this.notifications.filter(n => !n.isRead).length;
        const socialCount = this.notifications.filter(n => 
            [NotificationType.NewFollower, NotificationType.ActivityLike, 
             NotificationType.ActivityComment, NotificationType.MentionedInComment].includes(n.type)
        ).length;
        const clubCount = this.notifications.filter(n => 
            [NotificationType.ClubInvite, NotificationType.NewDiscussion, 
             NotificationType.NewEvent, NotificationType.EventReminder].includes(n.type)
        ).length;
        const challengeCount = this.notifications.filter(n => 
            [NotificationType.ChallengeInvite, NotificationType.ChallengeStarted,
             NotificationType.ChallengeCompleted, NotificationType.MilestoneReached].includes(n.type)
        ).length;

        this.notifyPropertyChange('totalCount', totalCount);
        this.notifyPropertyChange('unreadCount', unreadCount);
        this.notifyPropertyChange('socialCount', socialCount);
        this.notifyPropertyChange('clubCount', clubCount);
        this.notifyPropertyChange('challengeCount', challengeCount);
    }

    private initializeNotificationTypes(): void {
        this._notificationTypes = [
            { name: 'Social', type: NotificationType.NewFollower, enabled: true },
            { name: 'Activity Likes', type: NotificationType.ActivityLike, enabled: true },
            { name: 'Comments', type: NotificationType.ActivityComment, enabled: true },
            { name: 'Book Clubs', type: NotificationType.ClubInvite, enabled: true },
            { name: 'Events', type: NotificationType.NewEvent, enabled: true },
            { name: 'Challenges', type: NotificationType.ChallengeInvite, enabled: true },
            { name: 'Achievements', type: NotificationType.BadgeEarned, enabled: true },
            { name: 'System', type: NotificationType.SystemAnnouncement, enabled: true }
        ];
    }

    private updateNotificationTypes(): void {
        if (!this.preferences?.types) return;

        this._notificationTypes.forEach(type => {
            type.enabled = this.preferences?.types[type.type] || false;
        });
        this.notifyPropertyChange('notificationTypes', this._notificationTypes);
    }

    private setupSubscriptions(): void {
        // Subscribe to notification updates
        this.notificationService.notifications$.subscribe(notifications => {
            this.notifications = notifications;
        });

        // Subscribe to unread count updates
        this.notificationService.unreadCount$.subscribe(count => {
            this.notifyPropertyChange('unreadCount', count);
        });
    }
}
