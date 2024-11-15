import { Observable } from '@nativescript/core';
import { AuthService } from '../../auth/services/auth.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { User, UserPreferences } from '../../auth/models/user.model';

export class ProfilePageViewModel extends Observable {
    private authService: AuthService;
    private navigationService: NavigationService;
    private _user: User | null = null;

    constructor() {
        super();
        this.authService = AuthService.getInstance();
        this.navigationService = NavigationService.getInstance();
        this.loadUserProfile();
    }

    private async loadUserProfile() {
        const user = this.authService.getCurrentUser();
        if (user) {
            this._user = user;
            this.notifyPropertyChange('user', user);
        }
    }

    public get user(): User | null {
        return this._user;
    }

    public onEditProfile() {
        this.navigationService.navigate('features/profile/views/profile-edit-page');
    }

    public onViewBooks() {
        this.navigationService.navigate('features/books/views/collections-page');
    }

    public onViewReviews() {
        this.navigationService.navigate('features/reviews/views/review-list', {
            userId: this._user?.id
        });
    }

    public onViewChallenges() {
        this.navigationService.navigate('features/challenges/views/challenges-page', {
            userId: this._user?.id
        });
    }

    public onViewClubs() {
        this.navigationService.navigate('features/clubs/views/clubs-page', {
            userId: this._user?.id
        });
    }

    public async onSignOut() {
        try {
            await this.authService.signOut();
            this.navigationService.navigate('features/auth/views/login-page', {
                clearHistory: true
            });
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }

    public onUpdatePreferences(preferences: UserPreferences) {
        if (!this._user) return;

        const updatedUser: User = {
            ...this._user,
            preferences,
            updatedAt: new Date()
        };

        // Ensure we have non-null values for required fields
        const displayName = updatedUser.displayName || '';
        const photoURL = updatedUser.photoURL || '';

        this.authService.updateProfile(displayName, photoURL);
        this._user = updatedUser;
        this.notifyPropertyChange('user', updatedUser);
    }

    public onDeleteAccount() {
        // TODO: Add confirmation dialog
        this.authService.deleteAccount()
            .then(() => {
                this.navigationService.navigate('features/auth/views/login-page', {
                    clearHistory: true
                });
            })
            .catch(error => {
                console.error('Delete account error:', error);
            });
    }
}
