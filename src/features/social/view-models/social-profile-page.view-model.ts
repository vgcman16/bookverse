import { Observable } from '@nativescript/core';
import { AuthService } from '../../auth/services/auth.service';
import { SocialService } from '../services/social.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { User } from '../../auth/models/user.model';
import { UserActivity, NewsFeedItem, FollowStats } from '../models/following.model';

export class SocialProfilePageViewModel extends Observable {
    private authService: AuthService;
    private socialService: SocialService;
    private _user: User | null = null;
    private _activities: NewsFeedItem[] = [];
    private _books: any[] = [];
    private _stats: FollowStats | null = null;
    private _isLoading: boolean = false;
    private _selectedTabIndex: number = 0;
    private _isFollowing: boolean = false;
    private _isCurrentUser: boolean = false;

    constructor() {
        super();
        this.authService = AuthService.getInstance();
        this.socialService = SocialService.getInstance();
        this.initializeProfile();
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

    get activities(): NewsFeedItem[] {
        return this._activities;
    }

    set activities(value: NewsFeedItem[]) {
        if (this._activities !== value) {
            this._activities = value;
            this.notifyPropertyChange('activities', value);
        }
    }

    get books(): any[] {
        return this._books;
    }

    set books(value: any[]) {
        if (this._books !== value) {
            this._books = value;
            this.notifyPropertyChange('books', value);
        }
    }

    get stats(): FollowStats | null {
        return this._stats;
    }

    set stats(value: FollowStats | null) {
        if (this._stats !== value) {
            this._stats = value;
            this.notifyPropertyChange('stats', value);
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
            this.onTabChanged(value);
        }
    }

    get isFollowing(): boolean {
        return this._isFollowing;
    }

    set isFollowing(value: boolean) {
        if (this._isFollowing !== value) {
            this._isFollowing = value;
            this.notifyPropertyChange('isFollowing', value);
        }
    }

    get isCurrentUser(): boolean {
        return this._isCurrentUser;
    }

    set isCurrentUser(value: boolean) {
        if (this._isCurrentUser !== value) {
            this._isCurrentUser = value;
            this.notifyPropertyChange('isCurrentUser', value);
        }
    }

    // Event Handlers
    public onEditProfile(): void {
        NavigationService.navigate('profile/edit');
    }

    public async onToggleFollow(): Promise<void> {
        if (!this.user) return;

        try {
            if (this.isFollowing) {
                await this.socialService.unfollowUser(this.user.id);
            } else {
                await this.socialService.followUser(this.user.id);
            }
            this.isFollowing = !this.isFollowing;
            await this.loadStats();
        } catch (error) {
            console.error('Error toggling follow:', error);
            // TODO: Show error message to user
        }
    }

    public onShowBooks(): void {
        this.selectedTabIndex = 1;
    }

    public onShowFollowers(): void {
        if (!this.user) return;
        NavigationService.navigate('social/followers', { userId: this.user.id });
    }

    public onShowFollowing(): void {
        if (!this.user) return;
        NavigationService.navigate('social/following', { userId: this.user.id });
    }

    public async onLike(args: any): Promise<void> {
        const activity = args.object.bindingContext as NewsFeedItem;
        try {
            if (activity.interactions.hasLiked) {
                await this.socialService.unlikeActivity(activity.id);
            } else {
                await this.socialService.likeActivity(activity.id);
            }
            await this.loadActivities();
        } catch (error) {
            console.error('Error toggling like:', error);
            // TODO: Show error message to user
        }
    }

    public onComment(args: any): void {
        const activity = args.object.bindingContext as NewsFeedItem;
        NavigationService.navigate('social/comments', { activityId: activity.id });
    }

    public onBookTap(args: any): void {
        const activity = args.object.bindingContext as NewsFeedItem;
        if (activity.data.bookId) {
            NavigationService.navigate('books/details', { bookId: activity.data.bookId });
        }
    }

    public onReviewTap(args: any): void {
        const activity = args.object.bindingContext as NewsFeedItem;
        if (activity.data.reviewId) {
            NavigationService.navigate('reviews/details', { reviewId: activity.data.reviewId });
        }
    }

    public onChallengeTap(args: any): void {
        const activity = args.object.bindingContext as NewsFeedItem;
        if (activity.data.challengeId) {
            NavigationService.navigate('challenges/details', { challengeId: activity.data.challengeId });
        }
    }

    // Private Methods
    private async initializeProfile(): Promise<void> {
        const currentUser = this.authService.getCurrentUser();
        const params = NavigationService.getFrame().currentPage?.navigationContext;
        const userId = params?.userId || currentUser?.id;

        if (!userId) {
            NavigationService.back();
            return;
        }

        this.isCurrentUser = currentUser?.id === userId;
        await this.loadUser(userId);
        await this.loadStats();
        await this.loadActivities();
        await this.checkFollowStatus();
    }

    private async loadUser(userId: string): Promise<void> {
        this.isLoading = true;
        try {
            const user = await this.authService.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            this.user = user;
        } catch (error) {
            console.error('Error loading user:', error);
            NavigationService.back();
        } finally {
            this.isLoading = false;
        }
    }

    private async loadStats(): Promise<void> {
        if (!this.user) return;

        try {
            this.stats = await this.socialService.getFollowStats(this.user.id);
        } catch (error) {
            console.error('Error loading stats:', error);
            // TODO: Show error message to user
        }
    }

    private async loadActivities(): Promise<void> {
        if (!this.user) return;

        this.isLoading = true;
        try {
            const activities = await this.socialService.getActivities({
                userId: this.user.id,
                isPublic: true
            });
            this.activities = activities;
        } catch (error) {
            console.error('Error loading activities:', error);
            // TODO: Show error message to user
        } finally {
            this.isLoading = false;
        }
    }

    private async loadBooks(): Promise<void> {
        if (!this.user) return;

        this.isLoading = true;
        try {
            // TODO: Implement book loading from BookService
            this.books = [];
        } catch (error) {
            console.error('Error loading books:', error);
            // TODO: Show error message to user
        } finally {
            this.isLoading = false;
        }
    }

    private async checkFollowStatus(): Promise<void> {
        if (!this.user || this.isCurrentUser) return;

        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) return;

        try {
            const following = await this.socialService.getFollowing(currentUser.id);
            this.isFollowing = following.some(f => f.followingId === this.user?.id);
        } catch (error) {
            console.error('Error checking follow status:', error);
            // TODO: Show error message to user
        }
    }

    private async onTabChanged(index: number): Promise<void> {
        if (index === 1) {
            await this.loadBooks();
        }
    }
}
