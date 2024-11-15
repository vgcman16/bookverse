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

    private constructor() {
        this.authService = AuthService.getInstance();
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

        const following: Following = {
            id: Date.now().toString(),
            followerId: currentUser.id,
            followingId: targetUserId,
            createdAt: new Date()
        };

        let userFollowing = this.following.get(currentUser.id) || [];
        userFollowing.push(following);
        this.following.set(currentUser.id, userFollowing);

        let targetFollowers = this.followers.get(targetUserId) || [];
        targetFollowers.push(following);
        this.followers.set(targetUserId, targetFollowers);
    }

    public async unfollowUser(targetUserId: string): Promise<void> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            throw new Error('Must be logged in to unfollow users');
        }

        let userFollowing = this.following.get(currentUser.id) || [];
        userFollowing = userFollowing.filter(f => f.followingId !== targetUserId);
        this.following.set(currentUser.id, userFollowing);

        let targetFollowers = this.followers.get(targetUserId) || [];
        targetFollowers = targetFollowers.filter(f => f.followerId !== currentUser.id);
        this.followers.set(targetUserId, targetFollowers);
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

    // Activity Management
    public async getActivities(filter?: ActivityFilter): Promise<NewsFeedItem[]> {
        let activities = Array.from(this.activities.values()).flat();

        if (filter) {
            if (filter.types) {
                activities = activities.filter(a => filter.types!.includes(a.type));
            }
            if (filter.userId) {
                activities = activities.filter(a => a.userId === filter.userId);
            }
            if (filter.isPublic !== undefined) {
                activities = activities.filter(a => a.isPublic === filter.isPublic);
            }
            if (filter.startDate) {
                activities = activities.filter(a => a.timestamp >= filter.startDate!);
            }
            if (filter.endDate) {
                activities = activities.filter(a => a.timestamp <= filter.endDate!);
            }
        }

        // Transform UserActivity to NewsFeedItem
        const feedItems = await Promise.all(activities.map(async activity => {
            const user = await this.authService.getUserById(activity.userId);
            const activityInteractions = this.interactions.get(activity.id) || [];
            const currentUser = this.authService.getCurrentUser();

            return {
                ...activity,
                user: {
                    id: user!.id,
                    name: user!.displayName,
                    avatarUrl: user!.photoURL
                },
                interactions: {
                    likes: activityInteractions.filter(i => i.type === InteractionType.Like).length,
                    comments: activityInteractions.filter(i => i.type === InteractionType.Comment).length,
                    hasLiked: currentUser ? activityInteractions.some(i => 
                        i.type === InteractionType.Like && i.userId === currentUser.id
                    ) : false
                }
            };
        }));

        return feedItems;
    }

    public async likeActivity(activityId: string): Promise<void> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            throw new Error('Must be logged in to like activities');
        }

        const interaction: ActivityInteraction = {
            id: Date.now().toString(),
            activityId,
            userId: currentUser.id,
            type: InteractionType.Like,
            timestamp: new Date()
        };

        const activityInteractions = this.interactions.get(activityId) || [];
        activityInteractions.push(interaction);
        this.interactions.set(activityId, activityInteractions);
    }

    public async unlikeActivity(activityId: string): Promise<void> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            throw new Error('Must be logged in to unlike activities');
        }

        let activityInteractions = this.interactions.get(activityId) || [];
        activityInteractions = activityInteractions.filter(i => 
            !(i.type === InteractionType.Like && i.userId === currentUser.id)
        );
        this.interactions.set(activityId, activityInteractions);
    }

    public async commentOnActivity(activityId: string, content: string): Promise<ActivityInteraction> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            throw new Error('Must be logged in to comment on activities');
        }

        const interaction: ActivityInteraction = {
            id: Date.now().toString(),
            activityId,
            userId: currentUser.id,
            type: InteractionType.Comment,
            content,
            timestamp: new Date()
        };

        const activityInteractions = this.interactions.get(activityId) || [];
        activityInteractions.push(interaction);
        this.interactions.set(activityId, activityInteractions);

        return interaction;
    }

    public async getActivityComments(activityId: string): Promise<ActivityInteraction[]> {
        const interactions = this.interactions.get(activityId) || [];
        return interactions.filter(i => i.type === InteractionType.Comment);
    }

    // Follow Suggestions
    public async getFollowSuggestions(userId: string): Promise<FollowSuggestion[]> {
        const following = await this.getFollowing(userId);
        const followingIds = new Set(following.map(f => f.followingId));
        const allUsers = await this.authService.searchUsers('');
        
        const suggestions = await Promise.all(
            allUsers
                .filter(user => user.id !== userId && !followingIds.has(user.id))
                .map(async user => {
                    const stats = await this.getFollowStats(user.id);
                    const activities = await this.getActivities({ userId: user.id, isPublic: true });
                    
                    return {
                        userId: user.id,
                        name: user.displayName,
                        avatarUrl: user.photoURL,
                        bio: user.bio,
                        mutualFollowers: stats.mutualFollowersCount,
                        recentActivity: activities[0],
                        commonInterests: {
                            genres: user.favoriteGenres,
                            authors: user.favoriteAuthors
                        }
                    };
                })
        );

        return suggestions.sort((a, b) => b.mutualFollowers - a.mutualFollowers);
    }
}
