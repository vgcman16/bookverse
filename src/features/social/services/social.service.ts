import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import {
    Following,
    UserActivity,
    ActivityType,
    NewsFeedItem,
    ActivityInteraction,
    InteractionType,
    FollowSuggestion,
    FollowStats,
    ActivityFilter,
    NewsFeedFilter,
    ActivityNotification,
    FollowRequest,
    FollowRequestStatus,
    PrivacySettings
} from '../models/following.model';

export class SocialService {
    private static instance: SocialService;
    private authService: AuthService;
    private following: Map<string, Following[]> = new Map(); // userId -> following list
    private followers: Map<string, Following[]> = new Map(); // userId -> followers list
    private activities: Map<string, UserActivity[]> = new Map(); // userId -> activities
    private interactions: Map<string, ActivityInteraction[]> = new Map(); // activityId -> interactions
    private notifications: Map<string, ActivityNotification[]> = new Map(); // userId -> notifications
    private followRequests: Map<string, FollowRequest[]> = new Map(); // userId -> requests
    private privacySettings: Map<string, PrivacySettings> = new Map(); // userId -> settings
    private newsFeedSubject: BehaviorSubject<NewsFeedItem[]>;
    private notificationsSubject: BehaviorSubject<ActivityNotification[]>;

    private constructor() {
        this.authService = AuthService.getInstance();
        this.newsFeedSubject = new BehaviorSubject<NewsFeedItem[]>([]);
        this.notificationsSubject = new BehaviorSubject<ActivityNotification[]>([]);
    }

    public static getInstance(): SocialService {
        if (!SocialService.instance) {
            SocialService.instance = new SocialService();
        }
        return SocialService.instance;
    }

    // Following Management
    public async followUser(targetUserId: string): Promise<void> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            throw new Error('Must be logged in to follow users');
        }

        const targetSettings = await this.getPrivacySettings(targetUserId);
        if (targetSettings.requireFollowApproval) {
            await this.createFollowRequest(currentUser.id, targetUserId);
            return;
        }

        await this.createFollowRelationship(currentUser.id, targetUserId);
    }

    public async unfollowUser(targetUserId: string): Promise<void> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            throw new Error('Must be logged in to unfollow users');
        }

        const userFollowing = this.following.get(currentUser.id) || [];
        const followingIndex = userFollowing.findIndex(f => f.followingId === targetUserId);
        if (followingIndex !== -1) {
            userFollowing.splice(followingIndex, 1);
            this.following.set(currentUser.id, userFollowing);
        }

        const targetFollowers = this.followers.get(targetUserId) || [];
        const followerIndex = targetFollowers.findIndex(f => f.followerId === currentUser.id);
        if (followerIndex !== -1) {
            targetFollowers.splice(followerIndex, 1);
            this.followers.set(targetUserId, targetFollowers);
        }

        await this.updateNewsFeed();
    }

    public async getFollowers(userId: string): Promise<Following[]> {
        return this.followers.get(userId) || [];
    }

    public async getFollowing(userId: string): Promise<Following[]> {
        return this.following.get(userId) || [];
    }

    public async getFollowStats(userId: string): Promise<FollowStats> {
        const followers = await this.getFollowers(userId);
        const following = await this.getFollowing(userId);
        const currentUser = this.authService.getCurrentUser();
        
        let mutualFollowersCount = 0;
        if (currentUser && currentUser.id !== userId) {
            const userFollowers = new Set(followers.map(f => f.followerId));
            const currentUserFollowing = await this.getFollowing(currentUser.id);
            mutualFollowersCount = currentUserFollowing.filter(f => userFollowers.has(f.followingId)).length;
        }

        return {
            followersCount: followers.length,
            followingCount: following.length,
            mutualFollowersCount
        };
    }

    // Activity Feed Management
    public async createActivity(activity: Omit<UserActivity, 'id' | 'timestamp'>): Promise<UserActivity> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            throw new Error('Must be logged in to create activities');
        }

        const newActivity: UserActivity = {
            ...activity,
            id: Date.now().toString(),
            timestamp: new Date()
        };

        const userActivities = this.activities.get(currentUser.id) || [];
        userActivities.push(newActivity);
        this.activities.set(currentUser.id, userActivities);

        await this.updateNewsFeed();
        return newActivity;
    }

    public async getActivities(filter?: ActivityFilter): Promise<UserActivity[]> {
        const allActivities: UserActivity[] = [];
        this.activities.forEach(activities => allActivities.push(...activities));

        return this.filterActivities(allActivities, filter);
    }

    public async getNewsFeed(filter?: NewsFeedFilter): Promise<NewsFeedItem[]> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            return [];
        }

        const following = await this.getFollowing(currentUser.id);
        const followingIds = new Set(following.map(f => f.followingId));
        followingIds.add(currentUser.id); // Include user's own activities

        const feedItems: NewsFeedItem[] = [];
        for (const userId of followingIds) {
            const userActivities = this.activities.get(userId) || [];
            const user = await this.authService.getUserById(userId);
            if (!user) continue;

            for (const activity of userActivities) {
                const interactions = this.interactions.get(activity.id) || [];
                feedItems.push({
                    ...activity,
                    user: {
                        id: user.id,
                        name: user.displayName,
                        avatarUrl: user.photoURL
                    },
                    interactions: {
                        likes: interactions.filter(i => i.type === InteractionType.Like).length,
                        comments: interactions.filter(i => i.type === InteractionType.Comment).length,
                        hasLiked: interactions.some(i => i.type === InteractionType.Like && i.userId === currentUser.id)
                    }
                });
            }
        }

        return this.filterNewsFeedItems(feedItems, filter);
    }

    // Interaction Management
    public async likeActivity(activityId: string): Promise<void> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            throw new Error('Must be logged in to like activities');
        }

        const interactions = this.interactions.get(activityId) || [];
        const existingLike = interactions.find(i => 
            i.type === InteractionType.Like && i.userId === currentUser.id
        );

        if (!existingLike) {
            interactions.push({
                id: Date.now().toString(),
                activityId,
                userId: currentUser.id,
                type: InteractionType.Like,
                timestamp: new Date()
            });
            this.interactions.set(activityId, interactions);
            await this.updateNewsFeed();
        }
    }

    public async unlikeActivity(activityId: string): Promise<void> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            throw new Error('Must be logged in to unlike activities');
        }

        const interactions = this.interactions.get(activityId) || [];
        const likeIndex = interactions.findIndex(i => 
            i.type === InteractionType.Like && i.userId === currentUser.id
        );

        if (likeIndex !== -1) {
            interactions.splice(likeIndex, 1);
            this.interactions.set(activityId, interactions);
            await this.updateNewsFeed();
        }
    }

    public async commentOnActivity(activityId: string, content: string): Promise<ActivityInteraction> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            throw new Error('Must be logged in to comment on activities');
        }

        const comment: ActivityInteraction = {
            id: Date.now().toString(),
            activityId,
            userId: currentUser.id,
            type: InteractionType.Comment,
            content,
            timestamp: new Date()
        };

        const interactions = this.interactions.get(activityId) || [];
        interactions.push(comment);
        this.interactions.set(activityId, interactions);
        await this.updateNewsFeed();

        return comment;
    }

    // Privacy Settings Management
    public async getPrivacySettings(userId: string): Promise<PrivacySettings> {
        return this.privacySettings.get(userId) || {
            userId,
            isPrivateProfile: false,
            requireFollowApproval: false,
            showReadingProgress: true,
            showReviews: true,
            showClubMembership: true,
            showChallenges: true,
            allowActivityFeedComments: true,
            allowDirectMessages: true
        };
    }

    public async updatePrivacySettings(settings: PrivacySettings): Promise<void> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser || currentUser.id !== settings.userId) {
            throw new Error('Can only update own privacy settings');
        }

        this.privacySettings.set(currentUser.id, settings);
    }

    // Follow Request Management
    private async createFollowRequest(requesterId: string, targetId: string): Promise<void> {
        const request: FollowRequest = {
            id: Date.now().toString(),
            requesterId,
            targetId,
            status: FollowRequestStatus.Pending,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const requests = this.followRequests.get(targetId) || [];
        requests.push(request);
        this.followRequests.set(targetId, requests);
    }

    private async createFollowRelationship(followerId: string, followingId: string): Promise<void> {
        const following: Following = {
            id: Date.now().toString(),
            followerId,
            followingId,
            createdAt: new Date()
        };

        // Update following list
        const userFollowing = this.following.get(followerId) || [];
        userFollowing.push(following);
        this.following.set(followerId, userFollowing);

        // Update followers list
        const targetFollowers = this.followers.get(followingId) || [];
        targetFollowers.push(following);
        this.followers.set(followingId, targetFollowers);

        await this.updateNewsFeed();
    }

    // Helper Methods
    private async updateNewsFeed(): Promise<void> {
        const feedItems = await this.getNewsFeed();
        this.newsFeedSubject.next(feedItems);
    }

    private filterActivities(activities: UserActivity[], filter?: ActivityFilter): UserActivity[] {
        if (!filter) return activities;

        return activities.filter(activity => {
            if (filter.types && !filter.types.includes(activity.type)) return false;
            if (filter.userId && activity.userId !== filter.userId) return false;
            if (filter.isPublic !== undefined && activity.isPublic !== filter.isPublic) return false;
            if (filter.startDate && activity.timestamp < filter.startDate) return false;
            if (filter.endDate && activity.timestamp > filter.endDate) return false;
            return true;
        });
    }

    private filterNewsFeedItems(items: NewsFeedItem[], filter?: NewsFeedFilter): NewsFeedItem[] {
        if (!filter) return items;

        return items.filter(item => {
            if (filter.types && !filter.types.includes(item.type)) return false;
            if (filter.startDate && item.timestamp < filter.startDate) return false;
            if (filter.endDate && item.timestamp > filter.endDate) return false;
            return true;
        });
    }

    // Observable Getters
    public get newsFeed$(): Observable<NewsFeedItem[]> {
        return this.newsFeedSubject.asObservable();
    }

    public get notifications$(): Observable<ActivityNotification[]> {
        return this.notificationsSubject.asObservable();
    }
}
