import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { User } from '../../auth/models/user.model';
import { NotificationType } from '../models/notification.model';
import {
    CustomNotificationPreferences,
    PreferenceUpdateResult,
    DEFAULT_PREFERENCES,
    TimeWindow,
    CategoryPreference,
    DeliveryPreference
} from '../types/notification-preferences.types';

export class NotificationPreferencesService {
    private static instance: NotificationPreferencesService;
    private preferences: Map<string, CustomNotificationPreferences> = new Map();
    private preferencesSubject: BehaviorSubject<CustomNotificationPreferences | null>;
    private authService: AuthService;

    private constructor() {
        this.authService = AuthService.getInstance();
        this.preferencesSubject = new BehaviorSubject<CustomNotificationPreferences | null>(null);
        this.initializeService();
    }

    public static getInstance(): NotificationPreferencesService {
        if (!NotificationPreferencesService.instance) {
            NotificationPreferencesService.instance = new NotificationPreferencesService();
        }
        return NotificationPreferencesService.instance;
    }

    private async initializeService(): Promise<void> {
        const currentUser = await this.authService.getCurrentUser();
        if (currentUser) {
            await this.loadUserPreferences(currentUser.id);
        }

        // Subscribe to auth state changes
        this.authService.authState$.subscribe(async (authState) => {
            if (authState.user) {
                await this.loadUserPreferences(authState.user.id);
            } else {
                this.preferencesSubject.next(null);
            }
        });
    }

    private async loadUserPreferences(userId: string): Promise<void> {
        let userPrefs = this.preferences.get(userId);
        
        if (!userPrefs) {
            // In a real app, this would load from backend/storage
            userPrefs = { ...DEFAULT_PREFERENCES };
            this.preferences.set(userId, userPrefs);
        }

        this.preferencesSubject.next(userPrefs);
    }

    public async updatePreferences(
        updates: Partial<CustomNotificationPreferences>
    ): Promise<PreferenceUpdateResult> {
        try {
            const currentUser = await this.authService.getCurrentUser();
            if (!currentUser) {
                throw new Error('No authenticated user');
            }

            const currentPrefs = this.preferences.get(currentUser.id);
            if (!currentPrefs) {
                throw new Error('No preferences found for user');
            }

            const updatedPrefs = this.mergePreferences(currentPrefs, updates);
            
            // Validate the updated preferences
            if (!this.validatePreferences(updatedPrefs)) {
                throw new Error('Invalid preference update');
            }

            // In a real app, this would save to backend/storage
            this.preferences.set(currentUser.id, updatedPrefs);
            this.preferencesSubject.next(updatedPrefs);

            return {
                success: true,
                updatedPreferences: updatedPrefs
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unknown error occurred'
            };
        }
    }

    public async updateCategoryPreference(
        type: NotificationType,
        updates: Partial<CategoryPreference>
    ): Promise<PreferenceUpdateResult> {
        const currentUser = await this.authService.getCurrentUser();
        if (!currentUser) {
            return {
                success: false,
                error: 'No authenticated user'
            };
        }

        const currentPrefs = this.preferences.get(currentUser.id);
        if (!currentPrefs) {
            return {
                success: false,
                error: 'No preferences found for user'
            };
        }

        const updatedCategories = {
            ...currentPrefs.categories,
            [type]: {
                ...currentPrefs.categories[type],
                ...updates
            }
        };

        return this.updatePreferences({ categories: updatedCategories });
    }

    public async updateDeliveryPreference(
        type: NotificationType,
        updates: Partial<DeliveryPreference>
    ): Promise<PreferenceUpdateResult> {
        const currentPrefs = await this.getCurrentPreferences();
        if (!currentPrefs) {
            return {
                success: false,
                error: 'No preferences found'
            };
        }

        const updatedDelivery = {
            ...currentPrefs.categories[type].delivery,
            ...updates
        };

        return this.updateCategoryPreference(type, { delivery: updatedDelivery });
    }

    public async addTimeWindow(
        type: NotificationType,
        timeWindow: TimeWindow
    ): Promise<PreferenceUpdateResult> {
        const currentPrefs = await this.getCurrentPreferences();
        if (!currentPrefs) {
            return {
                success: false,
                error: 'No preferences found'
            };
        }

        const currentWindows = currentPrefs.categories[type].timeWindows || [];
        const updatedWindows = [...currentWindows, timeWindow];

        return this.updateCategoryPreference(type, { timeWindows: updatedWindows });
    }

    public async removeTimeWindow(
        type: NotificationType,
        index: number
    ): Promise<PreferenceUpdateResult> {
        const currentPrefs = await this.getCurrentPreferences();
        if (!currentPrefs) {
            return {
                success: false,
                error: 'No preferences found'
            };
        }

        const currentWindows = currentPrefs.categories[type].timeWindows || [];
        const updatedWindows = currentWindows.filter((_, i) => i !== index);

        return this.updateCategoryPreference(type, { timeWindows: updatedWindows });
    }

    public async updateQuietHours(
        updates: Partial<TimeWindow>
    ): Promise<PreferenceUpdateResult> {
        return this.updatePreferences({
            quietHours: {
                ...DEFAULT_PREFERENCES.quietHours,
                ...updates
            }
        });
    }

    public async updateEmailSettings(
        updates: Partial<CustomNotificationPreferences['emailSettings']>
    ): Promise<PreferenceUpdateResult> {
        return this.updatePreferences({
            emailSettings: {
                ...DEFAULT_PREFERENCES.emailSettings,
                ...updates
            }
        });
    }

    public async registerDeviceToken(token: string): Promise<PreferenceUpdateResult> {
        const currentPrefs = await this.getCurrentPreferences();
        if (!currentPrefs) {
            return {
                success: false,
                error: 'No preferences found'
            };
        }

        const currentTokens = currentPrefs.deviceTokens || [];
        if (currentTokens.includes(token)) {
            return {
                success: true,
                updatedPreferences: currentPrefs
            };
        }

        return this.updatePreferences({
            deviceTokens: [...currentTokens, token]
        });
    }

    public async unregisterDeviceToken(token: string): Promise<PreferenceUpdateResult> {
        const currentPrefs = await this.getCurrentPreferences();
        if (!currentPrefs) {
            return {
                success: false,
                error: 'No preferences found'
            };
        }

        const updatedTokens = currentPrefs.deviceTokens.filter(t => t !== token);

        return this.updatePreferences({
            deviceTokens: updatedTokens
        });
    }

    public async getCurrentPreferences(): Promise<CustomNotificationPreferences | null> {
        const currentUser = await this.authService.getCurrentUser();
        if (!currentUser) {
            return null;
        }

        return this.preferences.get(currentUser.id) || null;
    }

    public getPreferencesStream(): Observable<CustomNotificationPreferences | null> {
        return this.preferencesSubject.asObservable();
    }

    private mergePreferences(
        current: CustomNotificationPreferences,
        updates: Partial<CustomNotificationPreferences>
    ): CustomNotificationPreferences {
        return {
            ...current,
            ...updates,
            categories: updates.categories
                ? {
                    ...current.categories,
                    ...updates.categories
                }
                : current.categories
        };
    }

    private validatePreferences(prefs: CustomNotificationPreferences): boolean {
        // Basic validation
        if (typeof prefs.globalEnabled !== 'boolean') {
            return false;
        }

        if (!prefs.quietHours || typeof prefs.quietHours.enabled !== 'boolean') {
            return false;
        }

        // Validate time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(prefs.quietHours.startTime) || !timeRegex.test(prefs.quietHours.endTime)) {
            return false;
        }

        // Validate categories
        for (const type of Object.values(NotificationType)) {
            const category = prefs.categories[type];
            if (!category || typeof category.enabled !== 'boolean') {
                return false;
            }
        }

        return true;
    }
}
