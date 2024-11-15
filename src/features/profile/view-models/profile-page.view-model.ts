import { Observable } from '@nativescript/core';
import { AuthService } from '../../auth/services/auth.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { User, UserPreferences } from '../../auth/models/user.model';

export class ProfilePageViewModel extends Observable {
    private authService: AuthService;
    private _user: User | null = null;
    private _booksRead: number = 0;
    private _reviewsCount: number = 0;
    private _followersCount: number = 0;
    private _yearlyGoal: number = 50;
    private _readingProgress: number = 0;

    constructor() {
        super();
        this.authService = AuthService.getInstance();
        this.initializeProfile();
    }

    private async initializeProfile(): Promise<void> {
        try {
            // Get user data from auth service
            this._user = this.authService.getCurrentUser();
            if (!this._user) {
                NavigationService.navigateToLogin();
                return;
            }

            // TODO: Fetch these from a backend service
            this._booksRead = 23;
            this._reviewsCount = 15;
            this._followersCount = 42;
            this._readingProgress = (this._booksRead / this._yearlyGoal) * 100;

            this.notifyPropertyChange('user', this._user);
            this.notifyPropertyChange('booksRead', this._booksRead);
            this.notifyPropertyChange('reviewsCount', this._reviewsCount);
            this.notifyPropertyChange('followersCount', this._followersCount);
            this.notifyPropertyChange('yearlyGoal', this._yearlyGoal);
            this.notifyPropertyChange('readingProgress', this._readingProgress);
            this.notifyPropertyChange('readingProgressPercent', Math.round(this._readingProgress));
        } catch (error) {
            console.error('Error initializing profile:', error);
            // TODO: Show error message to user
        }
    }

    // Getters
    get user(): User | null {
        return this._user;
    }

    get booksRead(): number {
        return this._booksRead;
    }

    get reviewsCount(): number {
        return this._reviewsCount;
    }

    get followersCount(): number {
        return this._followersCount;
    }

    get yearlyGoal(): number {
        return this._yearlyGoal;
    }

    get readingProgress(): number {
        return this._readingProgress;
    }

    get readingProgressPercent(): number {
        return Math.round(this._readingProgress);
    }

    get preferences(): UserPreferences {
        return this._user?.preferences || {
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
            }
        };
    }

    // Event Handlers
    public onEditProfile(): void {
        NavigationService.navigate('profile/edit');
    }

    public onThemeToggle(): void {
        const newTheme = this.preferences.theme === 'light' ? 'dark' : 'light';
        // TODO: Update user preferences in backend
        if (this._user) {
            this._user.preferences.theme = newTheme;
            this.notifyPropertyChange('preferences', this._user.preferences);
        }
    }

    public onNotificationsToggle(): void {
        if (this._user) {
            const notifications = this._user.preferences.notifications;
            notifications.pushEnabled = !notifications.pushEnabled;
            // TODO: Update user preferences in backend
            this.notifyPropertyChange('preferences', this._user.preferences);
        }
    }

    public onPrivacyToggle(): void {
        if (this._user) {
            const privacy = this._user.preferences.privacy;
            privacy.profileVisibility = privacy.profileVisibility === 'public' ? 'private' : 'public';
            // TODO: Update user preferences in backend
            this.notifyPropertyChange('preferences', this._user.preferences);
        }
    }

    public onReadingListsTap(): void {
        NavigationService.navigate('reading-lists');
    }

    public onReviewsTap(): void {
        NavigationService.navigate('reviews');
    }

    public onBookClubsTap(): void {
        NavigationService.navigate('book-clubs');
    }

    public onSettingsTap(): void {
        NavigationService.navigate('settings');
    }

    public async onSignOutTap(): Promise<void> {
        try {
            await this.authService.signOut();
            NavigationService.navigateToLogin();
        } catch (error) {
            console.error('Error signing out:', error);
            // TODO: Show error message to user
        }
    }
}
