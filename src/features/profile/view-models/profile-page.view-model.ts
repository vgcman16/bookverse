import { Observable } from '@nativescript/core';
import { AuthService } from '../../auth/services/auth.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { User, UserPreferences, DEFAULT_USER_PREFERENCES } from '../../auth/models/user.model';

export class ProfilePageViewModel extends Observable {
    private authService: AuthService;
    private _user: User | null = null;
    private _isLoading: boolean = false;

    constructor() {
        super();
        this.authService = AuthService.getInstance();
        this.loadUserProfile();
    }

    // Getters and Setters
    get user(): User | null {
        return this._user;
    }

    set user(value: User | null) {
        if (this._user !== value) {
            this._user = value;
            this.notifyPropertyChange('user', value);
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

    get displayName(): string {
        return this.user?.displayName || '';
    }

    get photoURL(): string {
        return this.user?.photoURL || '';
    }

    get bio(): string {
        return this.user?.bio || '';
    }

    get readingGoal(): number {
        return this.user?.readingGoal || 0;
    }

    get booksRead(): number {
        return this.user?.booksRead || 0;
    }

    get readingProgress(): number {
        return this.readingGoal > 0 ? (this.booksRead / this.readingGoal) * 100 : 0;
    }

    get preferences(): UserPreferences {
        return this.user?.preferences || {
            ...DEFAULT_USER_PREFERENCES,
            theme: 'light',
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
            language: 'en'
        };
    }

    // Event Handlers
    public onEditProfile(): void {
        NavigationService.navigate('profile/edit');
    }

    public onViewCollections(): void {
        NavigationService.navigate('books/collections');
    }

    public onViewReviews(): void {
        NavigationService.navigate('reviews/user', {
            userId: this.user?.id
        });
    }

    public onToggleNotifications(): void {
        if (!this.user?.preferences) return;

        const updatedPreferences = {
            ...this.user.preferences,
            notifications: {
                ...this.user.preferences.notifications,
                pushEnabled: !this.user.preferences.notifications.pushEnabled
            }
        };

        this.updatePreferences(updatedPreferences);
    }

    public onTogglePrivacy(): void {
        if (!this.user?.preferences) return;

        const updatedPreferences = {
            ...this.user.preferences,
            privacy: {
                ...this.user.preferences.privacy,
                profileVisibility: this.user.preferences.privacy.profileVisibility === 'public' ? 'private' : 'public'
            }
        };

        this.updatePreferences(updatedPreferences);
    }

    public async onSignOut(): Promise<void> {
        try {
            await this.authService.signOut();
            NavigationService.navigate('auth/login', {
                clearHistory: true
            });
        } catch (error) {
            console.error('Error signing out:', error);
            // TODO: Show error message to user
        }
    }

    // Private Methods
    private async loadUserProfile(): Promise<void> {
        this.isLoading = true;
        try {
            const user = this.authService.getCurrentUser();
            if (!user) {
                NavigationService.navigate('auth/login', {
                    clearHistory: true
                });
                return;
            }
            this.user = user;
        } catch (error) {
            console.error('Error loading user profile:', error);
            // TODO: Show error message to user
        } finally {
            this.isLoading = false;
        }
    }

    private async updatePreferences(preferences: UserPreferences): Promise<void> {
        if (!this.user) return;

        try {
            const updatedUser = await this.authService.updateProfile({
                ...this.user,
                preferences
            });
            this.user = updatedUser;
        } catch (error) {
            console.error('Error updating preferences:', error);
            // TODO: Show error message to user
        }
    }
}
