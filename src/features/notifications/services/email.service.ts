import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { NotificationType } from '../models/notification.model';

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    template: string;
    category: NotificationType;
    description?: string;
    variables: string[];
}

export interface EmailPreferences {
    enabled: boolean;
    categories: {
        [key in NotificationType]?: boolean;
    };
    frequency: EmailFrequency;
    digest: {
        enabled: boolean;
        time: string; // HH:mm format
        days: string[]; // ['monday', 'wednesday', 'friday']
    };
    unsubscribeToken?: string;
}

export enum EmailFrequency {
    Instant = 'instant',
    Hourly = 'hourly',
    Daily = 'daily',
    Weekly = 'weekly'
}

export interface EmailMessage {
    id: string;
    to: string;
    subject: string;
    body: string;
    templateId: string;
    variables: { [key: string]: string };
    category: NotificationType;
    timestamp: Date;
    status: EmailStatus;
    error?: string;
    retries: number;
}

export enum EmailStatus {
    Pending = 'pending',
    Sent = 'sent',
    Failed = 'failed',
    Bounced = 'bounced',
    Delivered = 'delivered',
    Opened = 'opened',
    Clicked = 'clicked',
    Unsubscribed = 'unsubscribed',
    SpamReported = 'spamReported'
}

export interface EmailStats {
    totalSent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    spamReported: number;
    byCategory: {
        [key in NotificationType]?: {
            sent: number;
            opened: number;
            clicked: number;
        };
    };
}

export class EmailService {
    private static instance: EmailService;
    private authService: AuthService;
    private templates: Map<string, EmailTemplate> = new Map();
    private preferences: Map<string, EmailPreferences> = new Map(); // userId -> preferences
    private messages: Map<string, EmailMessage[]> = new Map(); // userId -> messages
    private stats: Map<string, EmailStats> = new Map(); // userId -> stats
    private emailQueueSubject: BehaviorSubject<EmailMessage[]>;

    private readonly DEFAULT_TEMPLATES: EmailTemplate[] = [
        {
            id: 'welcome',
            name: 'Welcome Email',
            subject: 'Welcome to BookVerse!',
            template: `
                <h1>Welcome to BookVerse, {{userName}}!</h1>
                <p>We're excited to have you join our community of book lovers.</p>
                <p>Here are some things you can do to get started:</p>
                <ul>
                    <li>Complete your profile</li>
                    <li>Browse our book collection</li>
                    <li>Join a book club</li>
                    <li>Start a reading challenge</li>
                </ul>
                <p>Happy reading!</p>
            `,
            category: NotificationType.SystemAnnouncement,
            variables: ['userName']
        },
        {
            id: 'new-follower',
            name: 'New Follower',
            subject: '{{followerName}} started following you on BookVerse',
            template: `
                <p>Hi {{userName}},</p>
                <p><strong>{{followerName}}</strong> is now following you on BookVerse!</p>
                <p>Check out their profile to see what they're reading.</p>
                <a href="{{profileUrl}}">View Profile</a>
            `,
            category: NotificationType.NewFollower,
            variables: ['userName', 'followerName', 'profileUrl']
        },
        {
            id: 'book-club-invite',
            name: 'Book Club Invitation',
            subject: 'You\'re invited to join {{clubName}}',
            template: `
                <p>Hi {{userName}},</p>
                <p>You've been invited to join the book club <strong>{{clubName}}</strong>!</p>
                <p>{{inviterName}} thinks you'd be a great addition to the club.</p>
                <p>Club Description:</p>
                <blockquote>{{clubDescription}}</blockquote>
                <a href="{{inviteUrl}}">Join Club</a>
            `,
            category: NotificationType.ClubInvite,
            variables: ['userName', 'clubName', 'inviterName', 'clubDescription', 'inviteUrl']
        },
        {
            id: 'challenge-completed',
            name: 'Challenge Completed',
            subject: 'Congratulations! You\'ve completed {{challengeName}}',
            template: `
                <h2>🎉 Challenge Complete!</h2>
                <p>Amazing work, {{userName}}! You've successfully completed the {{challengeName}} challenge.</p>
                <p>Here's what you achieved:</p>
                <ul>
                    <li>{{achievement}}</li>
                    <li>Earned {{points}} points</li>
                    <li>Unlocked: {{badgeName}}</li>
                </ul>
                <a href="{{challengeUrl}}">View Your Achievement</a>
            `,
            category: NotificationType.ChallengeCompleted,
            variables: ['userName', 'challengeName', 'achievement', 'points', 'badgeName', 'challengeUrl']
        },
        {
            id: 'review-comment',
            name: 'New Review Comment',
            subject: '{{commenterName}} commented on your review of {{bookTitle}}',
            template: `
                <p>Hi {{userName}},</p>
                <p><strong>{{commenterName}}</strong> commented on your review:</p>
                <blockquote>{{comment}}</blockquote>
                <p>Your review:</p>
                <blockquote>{{reviewText}}</blockquote>
                <a href="{{reviewUrl}}">View Comment</a>
            `,
            category: NotificationType.ReviewComment,
            variables: ['userName', 'commenterName', 'comment', 'reviewText', 'bookTitle', 'reviewUrl']
        },
        {
            id: 'reading-goal',
            name: 'Reading Goal Update',
            subject: 'You\'re {{progress}}% towards your reading goal!',
            template: `
                <h2>Reading Goal Progress Update</h2>
                <p>Great progress, {{userName}}! You're {{progress}}% of the way to your reading goal.</p>
                <ul>
                    <li>Books read: {{booksRead}}/{{goalBooks}}</li>
                    <li>Pages read: {{pagesRead}}</li>
                    <li>Reading streak: {{streakDays}} days</li>
                </ul>
                <p>Keep up the great work!</p>
                <a href="{{progressUrl}}">View Your Progress</a>
            `,
            category: NotificationType.ReadingGoalReminder,
            variables: ['userName', 'progress', 'booksRead', 'goalBooks', 'pagesRead', 'streakDays', 'progressUrl']
        },
        {
            id: 'digest',
            name: 'Weekly Digest',
            subject: 'Your BookVerse Weekly Update',
            template: `
                <h1>Your Week in Books</h1>
                <p>Hi {{userName}}, here's what happened this week:</p>
                
                <h3>Reading Activity</h3>
                <ul>
                    {{#readingActivity}}
                    <li>{{.}}</li>
                    {{/readingActivity}}
                </ul>

                <h3>Social Updates</h3>
                <ul>
                    {{#socialUpdates}}
                    <li>{{.}}</li>
                    {{/socialUpdates}}
                </ul>

                <h3>Book Club Updates</h3>
                <ul>
                    {{#clubUpdates}}
                    <li>{{.}}</li>
                    {{/clubUpdates}}
                </ul>

                <h3>Challenge Progress</h3>
                <ul>
                    {{#challengeUpdates}}
                    <li>{{.}}</li>
                    {{/challengeUpdates}}
                </ul>

                <a href="{{dashboardUrl}}">View Full Activity</a>
            `,
            category: NotificationType.SystemAnnouncement,
            variables: [
                'userName',
                'readingActivity',
                'socialUpdates',
                'clubUpdates',
                'challengeUpdates',
                'dashboardUrl'
            ]
        }
    ];

    private constructor() {
        this.authService = AuthService.getInstance();
        this.emailQueueSubject = new BehaviorSubject<EmailMessage[]>([]);
        this.initializeTemplates();
    }

    public static getInstance(): EmailService {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    private initializeTemplates(): void {
        this.DEFAULT_TEMPLATES.forEach(template => {
            this.templates.set(template.id, template);
        });
    }

    public async sendEmail(
        userId: string,
        templateId: string,
        variables: { [key: string]: string }
    ): Promise<void> {
        const user = await this.authService.getUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const preferences = await this.getEmailPreferences(userId);
        if (!preferences.enabled) {
            console.log(`Email notifications disabled for user ${userId}`);
            return;
        }

        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Email template ${templateId} not found`);
        }

        if (!preferences.categories[template.category]) {
            console.log(`Email category ${template.category} disabled for user ${userId}`);
            return;
        }

        const message: EmailMessage = {
            id: Date.now().toString(),
            to: user.email,
            subject: this.replaceVariables(template.subject, variables),
            body: this.replaceVariables(template.template, variables),
            templateId,
            variables,
            category: template.category,
            timestamp: new Date(),
            status: EmailStatus.Pending,
            retries: 0
        };

        // Add to queue based on frequency preference
        if (preferences.frequency === EmailFrequency.Instant) {
            await this.queueEmail(message);
        } else {
            await this.queueForDigest(userId, message);
        }
    }

    private replaceVariables(template: string, variables: { [key: string]: string }): string {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
    }

    private async queueEmail(message: EmailMessage): Promise<void> {
        // TODO: Implement actual email sending logic
        console.log('Queuing email:', message);

        const userMessages = this.messages.get(message.to) || [];
        userMessages.push(message);
        this.messages.set(message.to, userMessages);

        this.emailQueueSubject.next(Array.from(this.messages.values()).flat());
    }

    private async queueForDigest(userId: string, message: EmailMessage): Promise<void> {
        const userMessages = this.messages.get(userId) || [];
        userMessages.push(message);
        this.messages.set(userId, userMessages);
    }

    public async getEmailPreferences(userId: string): Promise<EmailPreferences> {
        let prefs = this.preferences.get(userId);
        if (!prefs) {
            prefs = {
                enabled: true,
                categories: Object.values(NotificationType).reduce((acc, type) => ({
                    ...acc,
                    [type]: true
                }), {}),
                frequency: EmailFrequency.Instant,
                digest: {
                    enabled: false,
                    time: '09:00',
                    days: ['monday', 'friday']
                }
            };
            this.preferences.set(userId, prefs);
        }
        return prefs;
    }

    public async updateEmailPreferences(
        userId: string,
        preferences: Partial<EmailPreferences>
    ): Promise<void> {
        const currentPrefs = await this.getEmailPreferences(userId);
        const updatedPrefs = {
            ...currentPrefs,
            ...preferences,
            categories: {
                ...currentPrefs.categories,
                ...preferences.categories
            },
            digest: {
                ...currentPrefs.digest,
                ...preferences.digest
            }
        };
        this.preferences.set(userId, updatedPrefs);
    }

    public async getEmailStats(userId: string): Promise<EmailStats> {
        return this.stats.get(userId) || {
            totalSent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            unsubscribed: 0,
            spamReported: 0,
            byCategory: {}
        };
    }

    public async unsubscribe(userId: string, token: string): Promise<void> {
        const prefs = await this.getEmailPreferences(userId);
        if (prefs.unsubscribeToken !== token) {
            throw new Error('Invalid unsubscribe token');
        }

        await this.updateEmailPreferences(userId, { enabled: false });
    }

    public get emailQueue$(): Observable<EmailMessage[]> {
        return this.emailQueueSubject.asObservable();
    }
}
