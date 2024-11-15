import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import {
    ReadingChallenge,
    ChallengeProgress,
    ChallengeMilestone,
    ChallengeReward,
    ChallengeType,
    ChallengeStatus,
    ChallengeStats,
    ChallengeFilters,
    ChallengeActivity,
    ChallengeLeaderboard,
    ChallengeNotification,
    ChallengeActivityType,
    ChallengeNotificationType,
    ChallengeDifficulty
} from '../models/challenge.model';

export class ChallengeService {
    private static instance: ChallengeService;
    private authService: AuthService;
    private challenges: Map<string, ReadingChallenge> = new Map();
    private progress: Map<string, Map<string, ChallengeProgress>> = new Map(); // challengeId -> userId -> progress
    private activities: Map<string, ChallengeActivity[]> = new Map(); // challengeId -> activities
    private leaderboards: Map<string, ChallengeLeaderboard> = new Map();
    private notifications: Map<string, ChallengeNotification[]> = new Map(); // userId -> notifications
    private userChallengesSubject: BehaviorSubject<ReadingChallenge[]>;

    private constructor() {
        this.authService = AuthService.getInstance();
        this.userChallengesSubject = new BehaviorSubject<ReadingChallenge[]>([]);
    }

    public static getInstance(): ChallengeService {
        if (!ChallengeService.instance) {
            ChallengeService.instance = new ChallengeService();
        }
        return ChallengeService.instance;
    }

    // Challenge Management
    public async getChallenges(filters?: ChallengeFilters): Promise<ReadingChallenge[]> {
        let challenges = Array.from(this.challenges.values());

        if (filters) {
            if (filters.type) {
                challenges = challenges.filter(c => c.type === filters.type);
            }
            if (filters.status) {
                const userId = this.authService.getCurrentUser()?.id;
                if (userId) {
                    challenges = challenges.filter(c => {
                        const progress = this.getChallengeProgress(c.id, userId);
                        return progress?.status === filters.status;
                    });
                }
            }
            if (filters.clubId) {
                challenges = challenges.filter(c => c.clubId === filters.clubId);
            }
            if (filters.isActive !== undefined) {
                challenges = challenges.filter(c => c.isActive === filters.isActive);
            }
            if (filters.difficulty) {
                challenges = challenges.filter(c => c.difficulty === filters.difficulty);
            }
            if (filters.startDateRange) {
                challenges = challenges.filter(c => 
                    c.startDate >= filters.startDateRange!.start &&
                    c.startDate <= filters.startDateRange!.end
                );
            }
        }

        return challenges;
    }

    public async getChallengeProgress(challengeId: string, userId: string): Promise<ChallengeProgress | null> {
        return this.progress.get(challengeId)?.get(userId) || null;
    }

    public async createChallenge(challenge: Omit<ReadingChallenge, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReadingChallenge> {
        const user = this.authService.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated to create challenges');
        }

        const newChallenge: ReadingChallenge = {
            ...challenge,
            id: Date.now().toString(), // TODO: Use proper ID generation
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.challenges.set(newChallenge.id, newChallenge);
        await this.updateUserChallenges();
        return newChallenge;
    }

    public async getChallenge(challengeId: string): Promise<ReadingChallenge | null> {
        return this.challenges.get(challengeId) || null;
    }

    public async updateChallenge(challengeId: string, updates: Partial<ReadingChallenge>): Promise<ReadingChallenge> {
        const challenge = await this.getChallenge(challengeId);
        if (!challenge) {
            throw new Error('Challenge not found');
        }

        const user = this.authService.getCurrentUser();
        if (!user || challenge.createdBy !== user.id) {
            throw new Error('Only the challenge creator can update it');
        }

        const updatedChallenge: ReadingChallenge = {
            ...challenge,
            ...updates,
            updatedAt: new Date()
        };

        this.challenges.set(challengeId, updatedChallenge);
        await this.updateUserChallenges();
        return updatedChallenge;
    }

    public async deleteChallenge(challengeId: string): Promise<void> {
        const challenge = await this.getChallenge(challengeId);
        if (!challenge) return;

        const user = this.authService.getCurrentUser();
        if (!user || challenge.createdBy !== user.id) {
            throw new Error('Only the challenge creator can delete it');
        }

        this.challenges.delete(challengeId);
        // Clean up related data
        this.progress.delete(challengeId);
        this.activities.delete(challengeId);
        this.leaderboards.delete(challengeId);
        await this.updateUserChallenges();
    }

    // Challenge Participation
    public async joinChallenge(challengeId: string): Promise<void> {
        const user = this.authService.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated to join challenges');
        }

        const challenge = await this.getChallenge(challengeId);
        if (!challenge) {
            throw new Error('Challenge not found');
        }

        if (!challenge.isActive) {
            throw new Error('Challenge is not active');
        }

        if (challenge.participants.includes(user.id)) {
            throw new Error('Already participating in this challenge');
        }

        challenge.participants.push(user.id);
        this.challenges.set(challengeId, challenge);

        // Initialize progress tracking
        const progress: ChallengeProgress = {
            id: Date.now().toString(),
            userId: user.id,
            challengeId,
            currentProgress: 0,
            milestones: [],
            status: ChallengeStatus.InProgress,
            startedAt: new Date(),
            lastUpdated: new Date()
        };

        let userProgress = this.progress.get(challengeId);
        if (!userProgress) {
            userProgress = new Map();
            this.progress.set(challengeId, userProgress);
        }
        userProgress.set(user.id, progress);

        // Record activity
        this.recordActivity(challengeId, user.id, ChallengeActivityType.Started);
        await this.updateUserChallenges();
    }

    public async updateProgress(challengeId: string, progress: number): Promise<void> {
        const user = this.authService.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated to update progress');
        }

        const challenge = await this.getChallenge(challengeId);
        if (!challenge) {
            throw new Error('Challenge not found');
        }

        const userProgress = this.progress.get(challengeId)?.get(user.id);
        if (!userProgress) {
            throw new Error('Not participating in this challenge');
        }

        userProgress.currentProgress = progress;
        userProgress.lastUpdated = new Date();

        // Check for milestone completion
        const newMilestones = this.checkMilestones(challenge, progress);
        if (newMilestones.length > 0) {
            userProgress.milestones.push(...newMilestones);
            this.notifyMilestoneCompletion(challengeId, user.id, newMilestones);
        }

        // Check for challenge completion
        if (progress >= challenge.goal && userProgress.status !== ChallengeStatus.Completed) {
            userProgress.status = ChallengeStatus.Completed;
            userProgress.completedAt = new Date();
            challenge.completedBy.push(user.id);
            this.challenges.set(challengeId, challenge);
            this.notifyChallengeCompletion(challengeId, user.id);
        }

        // Update progress map
        const challengeProgress = this.progress.get(challengeId);
        if (challengeProgress) {
            challengeProgress.set(user.id, userProgress);
        }

        // Record activity
        this.recordActivity(challengeId, user.id, ChallengeActivityType.ProgressUpdate, { progressUpdate: progress });

        // Update leaderboard
        await this.updateLeaderboard(challengeId);
    }

    public async abandonChallenge(challengeId: string): Promise<void> {
        const user = this.authService.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated to abandon challenges');
        }

        const userProgress = this.progress.get(challengeId)?.get(user.id);
        if (!userProgress) {
            throw new Error('Not participating in this challenge');
        }

        userProgress.status = ChallengeStatus.Abandoned;
        userProgress.lastUpdated = new Date();

        const challengeProgress = this.progress.get(challengeId);
        if (challengeProgress) {
            challengeProgress.set(user.id, userProgress);
        }

        // Record activity
        this.recordActivity(challengeId, user.id, ChallengeActivityType.Abandoned);
    }

    // Stats and Leaderboards
    public async getChallengeStats(challengeId: string): Promise<ChallengeStats> {
        const challenge = await this.getChallenge(challengeId);
        if (!challenge) {
            throw new Error('Challenge not found');
        }

        const challengeProgress = this.progress.get(challengeId);
        if (!challengeProgress) {
            return {
                totalParticipants: 0,
                completionRate: 0,
                averageProgress: 0,
                topPerformers: []
            };
        }

        const progressArray = Array.from(challengeProgress.values());
        const completedCount = progressArray.filter(p => p.status === ChallengeStatus.Completed).length;

        return {
            totalParticipants: progressArray.length,
            completionRate: progressArray.length > 0 ? completedCount / progressArray.length : 0,
            averageProgress: progressArray.reduce((acc, curr) => acc + curr.currentProgress, 0) / progressArray.length,
            topPerformers: progressArray
                .sort((a, b) => b.currentProgress - a.currentProgress)
                .slice(0, 10)
                .map(p => ({
                    userId: p.userId,
                    progress: p.currentProgress,
                    completedAt: p.completedAt
                }))
        };
    }

    public async getLeaderboard(challengeId: string): Promise<ChallengeLeaderboard> {
        return this.leaderboards.get(challengeId) || {
            challengeId,
            entries: [],
            lastUpdated: new Date()
        };
    }

    // Notifications
    public async getNotifications(userId: string): Promise<ChallengeNotification[]> {
        return this.notifications.get(userId) || [];
    }

    public async markNotificationAsRead(notificationId: string): Promise<void> {
        const user = this.authService.getCurrentUser();
        if (!user) return;

        const userNotifications = this.notifications.get(user.id);
        if (!userNotifications) return;

        const notification = userNotifications.find(n => n.id === notificationId);
        if (notification) {
            notification.isRead = true;
            this.notifications.set(user.id, userNotifications);
        }
    }

    // Observable Getters
    public get userChallenges$(): Observable<ReadingChallenge[]> {
        return this.userChallengesSubject.asObservable();
    }

    // Private Helper Methods
    private async updateUserChallenges(): Promise<void> {
        const user = this.authService.getCurrentUser();
        if (!user) {
            this.userChallengesSubject.next([]);
            return;
        }

        const userChallenges = Array.from(this.challenges.values()).filter(
            challenge => challenge.participants.includes(user.id) || challenge.createdBy === user.id
        );

        this.userChallengesSubject.next(userChallenges);
    }

    private checkMilestones(challenge: ReadingChallenge, progress: number): ChallengeMilestone[] {
        const userProgress = this.progress.get(challenge.id)?.get(this.authService.getCurrentUser()?.id || '');
        if (!userProgress) return [];

        const completedMilestones = userProgress.milestones.map(m => m.targetProgress);
        const newMilestones: ChallengeMilestone[] = [];

        // Calculate milestone thresholds (e.g., 25%, 50%, 75%, 100%)
        const milestoneThresholds = [0.25, 0.5, 0.75, 1];
        milestoneThresholds.forEach(threshold => {
            const targetProgress = challenge.goal * threshold;
            if (progress >= targetProgress && !completedMilestones.includes(targetProgress)) {
                newMilestones.push({
                    id: Date.now().toString(),
                    title: `${threshold * 100}% Complete!`,
                    description: `Reached ${threshold * 100}% of the challenge goal`,
                    targetProgress,
                    isCompleted: true,
                    completedAt: new Date()
                });
            }
        });

        return newMilestones;
    }

    private async updateLeaderboard(challengeId: string): Promise<void> {
        const challengeProgress = this.progress.get(challengeId);
        if (!challengeProgress) return;

        const entries = Array.from(challengeProgress.values())
            .map(progress => ({
                userId: progress.userId,
                rank: 0,
                progress: progress.currentProgress,
                completedMilestones: progress.milestones.length,
                totalPoints: this.calculatePoints(progress),
                completionTime: progress.completedAt ? 
                    progress.completedAt.getTime() - progress.startedAt.getTime() : 
                    undefined
            }))
            .sort((a, b) => {
                if (b.progress !== a.progress) return b.progress - a.progress;
                if (b.completedMilestones !== a.completedMilestones) return b.completedMilestones - a.completedMilestones;
                return (a.completionTime || Infinity) - (b.completionTime || Infinity);
            });

        // Assign ranks
        entries.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        this.leaderboards.set(challengeId, {
            challengeId,
            entries,
            lastUpdated: new Date()
        });
    }

    private calculatePoints(progress: ChallengeProgress): number {
        let points = progress.currentProgress;
        points += progress.milestones.length * 100; // Bonus points for milestones
        if (progress.status === ChallengeStatus.Completed) {
            points += 500; // Completion bonus
        }
        return points;
    }

    private recordActivity(
        challengeId: string,
        userId: string,
        type: ChallengeActivityType,
        details: Partial<ChallengeActivity['details']> = {}
    ): void {
        const activity: ChallengeActivity = {
            id: Date.now().toString(),
            challengeId,
            userId,
            type,
            details,
            timestamp: new Date()
        };

        const activities = this.activities.get(challengeId) || [];
        activities.push(activity);
        this.activities.set(challengeId, activities);
    }

    private notifyMilestoneCompletion(challengeId: string, userId: string, milestones: ChallengeMilestone[]): void {
        milestones.forEach(milestone => {
            const notification: ChallengeNotification = {
                id: Date.now().toString(),
                challengeId,
                userId,
                type: ChallengeNotificationType.MilestoneReached,
                message: `Congratulations! You've reached a new milestone: ${milestone.title}`,
                data: {
                    milestoneId: milestone.id,
                    progress: milestone.targetProgress,
                    reward: milestone.reward
                },
                isRead: false,
                createdAt: new Date()
            };

            const userNotifications = this.notifications.get(userId) || [];
            userNotifications.push(notification);
            this.notifications.set(userId, userNotifications);
        });
    }

    private notifyChallengeCompletion(challengeId: string, userId: string): void {
        const notification: ChallengeNotification = {
            id: Date.now().toString(),
            challengeId,
            userId,
            type: ChallengeNotificationType.Completed,
            message: 'Congratulations! You\'ve completed the challenge!',
            isRead: false,
            createdAt: new Date()
        };

        const userNotifications = this.notifications.get(userId) || [];
        userNotifications.push(notification);
        this.notifications.set(userId, userNotifications);
    }
}
