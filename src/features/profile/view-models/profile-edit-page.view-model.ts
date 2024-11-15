import { Observable, File, ImageSource, knownFolders } from '@nativescript/core';
import { AuthService } from '../../auth/services/auth.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { User, UserPreferences } from '../../auth/models/user.model';

interface Genre {
    id: string;
    name: string;
    selected: boolean;
}

export class ProfileEditViewModel extends Observable {
    private authService: AuthService;
    private _displayName: string = '';
    private _photoUri: string = '';
    private _bio: string = '';
    private _yearlyGoal: number = 50;
    private _isLoading: boolean = false;
    private _errorMessage: string = '';
    private _genres: Genre[] = [
        { id: '1', name: 'Fiction', selected: false },
        { id: '2', name: 'Non-Fiction', selected: false },
        { id: '3', name: 'Mystery', selected: false },
        { id: '4', name: 'Science Fiction', selected: false },
        { id: '5', name: 'Fantasy', selected: false },
        { id: '6', name: 'Romance', selected: false },
        { id: '7', name: 'Thriller', selected: false },
        { id: '8', name: 'Biography', selected: false }
    ];
    private _privacy = {
        profileVisibility: 'public',
        showReadingProgress: true,
        allowMessages: true
    };
    private _notifications = {
        pushEnabled: true,
        emailEnabled: true,
        bookClubUpdates: true
    };

    constructor() {
        super();
        this.authService = AuthService.getInstance();
        this.initializeProfile();
    }

    private async initializeProfile(): Promise<void> {
        try {
            const user = this.authService.getCurrentUser();
            if (!user) {
                NavigationService.navigateToLogin();
                return;
            }

            this._displayName = user.displayName;
            this._photoUri = user.photoUri || '';
            this._privacy = user.preferences.privacy;
            this._notifications = user.preferences.notifications;

            this.notifyPropertyChange('displayName', this._displayName);
            this.notifyPropertyChange('photoUri', this._photoUri);
            this.notifyPropertyChange('privacy', this._privacy);
            this.notifyPropertyChange('notifications', this._notifications);
        } catch (error) {
            console.error('Error initializing profile edit:', error);
            this.errorMessage = 'Failed to load profile data';
        }
    }

    // Getters and Setters
    get displayName(): string {
        return this._displayName;
    }

    set displayName(value: string) {
        if (this._displayName !== value) {
            this._displayName = value;
            this.notifyPropertyChange('displayName', value);
        }
    }

    get photoUri(): string {
        return this._photoUri;
    }

    get bio(): string {
        return this._bio;
    }

    set bio(value: string) {
        if (this._bio !== value) {
            this._bio = value;
            this.notifyPropertyChange('bio', value);
        }
    }

    get yearlyGoal(): number {
        return this._yearlyGoal;
    }

    set yearlyGoal(value: number) {
        if (this._yearlyGoal !== value) {
            this._yearlyGoal = value;
            this.notifyPropertyChange('yearlyGoal', value);
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

    get errorMessage(): string {
        return this._errorMessage;
    }

    set errorMessage(value: string) {
        if (this._errorMessage !== value) {
            this._errorMessage = value;
            this.notifyPropertyChange('errorMessage', value);
        }
    }

    get genres(): Genre[] {
        return this._genres;
    }

    get privacy(): typeof this._privacy {
        return this._privacy;
    }

    get notifications(): typeof this._notifications {
        return this._notifications;
    }

    // Event Handlers
    public async onChangePhotoTap(): Promise<void> {
        try {
            // TODO: Implement image picker functionality
            console.log('Change photo tapped');
        } catch (error) {
            console.error('Error changing photo:', error);
            this.errorMessage = 'Failed to update profile photo';
        }
    }

    public onGenreSelect(args: any): void {
        const genre = args.object.bindingContext as Genre;
        genre.selected = !genre.selected;
        this.notifyPropertyChange('genres', this._genres);
    }

    public onPrivacyToggle(): void {
        this._privacy.profileVisibility = this._privacy.profileVisibility === 'public' ? 'private' : 'public';
        this.notifyPropertyChange('privacy', this._privacy);
    }

    public onProgressVisibilityToggle(): void {
        this._privacy.showReadingProgress = !this._privacy.showReadingProgress;
        this.notifyPropertyChange('privacy', this._privacy);
    }

    public onMessagesToggle(): void {
        this._privacy.allowMessages = !this._privacy.allowMessages;
        this.notifyPropertyChange('privacy', this._privacy);
    }

    public onPushNotificationsToggle(): void {
        this._notifications.pushEnabled = !this._notifications.pushEnabled;
        this.notifyPropertyChange('notifications', this._notifications);
    }

    public onEmailNotificationsToggle(): void {
        this._notifications.emailEnabled = !this._notifications.emailEnabled;
        this.notifyPropertyChange('notifications', this._notifications);
    }

    public onBookClubUpdatesToggle(): void {
        this._notifications.bookClubUpdates = !this._notifications.bookClubUpdates;
        this.notifyPropertyChange('notifications', this._notifications);
    }

    public async onSaveProfile(): Promise<void> {
        try {
            this.isLoading = true;
            this.errorMessage = '';

            // Validate input
            if (!this.displayName.trim()) {
                throw new Error('Display name is required');
            }

            // Update profile
            await this.authService.updateProfile(this.displayName, this.photoUri);

            // TODO: Update additional profile data in backend service

            // Navigate back to profile page
            NavigationService.goBack();
        } catch (error) {
            console.error('Error saving profile:', error);
            this.errorMessage = 'Failed to save profile changes';
        } finally {
            this.isLoading = false;
        }
    }
}
