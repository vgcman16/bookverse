import { Observable as NativeScriptObservable } from '@nativescript/core';
import { Observable as RxObservable } from 'rxjs';
import { NotificationPreferencesService } from '../services/notification-preferences.service';
import { NotificationType } from '../models/notification.model';
import {
    CustomNotificationPreferences,
    CategoryPreference,
    TimeWindow,
    DeliveryPreference
} from '../types/notification-preferences.types';

export class NotificationPreferencesPageViewModel extends NativeScriptObservable {
    private preferencesService: NotificationPreferencesService;
    private _preferences: CustomNotificationPreferences | null = null;

    constructor() {
        super();
        this.preferencesService = NotificationPreferencesService.getInstance();
        this.initializePreferences();
    }

    private async initializePreferences(): Promise<void> {
        this._preferences = await this.preferencesService.getCurrentPreferences();
        this.notifyPropertyChange('preferences', this._preferences);

        // Subscribe to preference changes
        this.preferencesService.getPreferencesStream().subscribe(prefs => {
            this._preferences = prefs;
            this.notifyPropertyChange('preferences', this._preferences);
        });
    }

    public async toggleGlobalEnabled(): Promise<void> {
        if (!this._preferences) return;

        const result = await this.preferencesService.updatePreferences({
            globalEnabled: !this._preferences.globalEnabled
        });

        if (!result.success) {
            console.error('Failed to toggle global notifications:', result.error);
        }
    }

    public async toggleCategoryEnabled(type: NotificationType): Promise<void> {
        if (!this._preferences) return;

        const category = this._preferences.categories[type];
        const result = await this.preferencesService.updateCategoryPreference(type, {
            enabled: !category.enabled
        });

        if (!result.success) {
            console.error(`Failed to toggle category ${type}:`, result.error);
        }
    }

    public async updateDeliveryPreference(
        type: NotificationType,
        updates: Partial<DeliveryPreference>
    ): Promise<void> {
        const result = await this.preferencesService.updateDeliveryPreference(type, updates);

        if (!result.success) {
            console.error(`Failed to update delivery preferences for ${type}:`, result.error);
        }
    }

    public async toggleQuietHours(): Promise<void> {
        if (!this._preferences) return;

        const result = await this.preferencesService.updateQuietHours({
            enabled: !this._preferences.quietHours.enabled
        });

        if (!result.success) {
            console.error('Failed to toggle quiet hours:', result.error);
        }
    }

    public async updateQuietHours(updates: Partial<TimeWindow>): Promise<void> {
        const result = await this.preferencesService.updateQuietHours(updates);

        if (!result.success) {
            console.error('Failed to update quiet hours:', result.error);
        }
    }

    public async updateEmailSettings(
        updates: Partial<CustomNotificationPreferences['emailSettings']>
    ): Promise<void> {
        const result = await this.preferencesService.updateEmailSettings(updates);

        if (!result.success) {
            console.error('Failed to update email settings:', result.error);
        }
    }

    public async addTimeWindow(type: NotificationType, timeWindow: TimeWindow): Promise<void> {
        const result = await this.preferencesService.addTimeWindow(type, timeWindow);

        if (!result.success) {
            console.error(`Failed to add time window for ${type}:`, result.error);
        }
    }

    public async removeTimeWindow(type: NotificationType, index: number): Promise<void> {
        const result = await this.preferencesService.removeTimeWindow(type, index);

        if (!result.success) {
            console.error(`Failed to remove time window for ${type}:`, result.error);
        }
    }

    get preferences(): CustomNotificationPreferences | null {
        return this._preferences;
    }

    get notificationTypes(): NotificationType[] {
        return Object.values(NotificationType);
    }

    public getCategoryPreference(type: NotificationType): CategoryPreference | null {
        return this._preferences?.categories[type] || null;
    }

    get quietHours(): TimeWindow | null {
        return this._preferences?.quietHours || null;
    }

    get emailSettings(): CustomNotificationPreferences['emailSettings'] | null {
        return this._preferences?.emailSettings || null;
    }

    get isGlobalEnabled(): boolean {
        return this._preferences?.globalEnabled || false;
    }
}
