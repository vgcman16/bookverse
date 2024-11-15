import { Frame, NavigationEntry, BackstackEntry } from '@nativescript/core';

export interface NavigationOptions extends NavigationEntry {
    clearHistory?: boolean;
    animated?: boolean;
    transition?: any;
    // Custom parameters used across the app
    userId?: string;
    bookId?: string;
    reviewId?: string;
    clubId?: string;
    challengeId?: string;
    collectionId?: string;
    discussionId?: string;
    eventId?: string;
    activityId?: string;
    mode?: string;
    onSelect?: (item: any) => void;
    // Terms page specific options
    showAcceptButton?: boolean;
    acceptCallback?: (accepted: boolean) => void;
}

export class NavigationService {
    private static instance: NavigationService;
    private static navigationStack: string[] = [];
    private static frame: Frame | null = null;

    private constructor() {}

    public static getInstance(): NavigationService {
        if (!NavigationService.instance) {
            NavigationService.instance = new NavigationService();
        }
        return NavigationService.instance;
    }

    public static setFrame(frame: Frame): void {
        NavigationService.frame = frame;
    }

    public static getFrame(): Frame {
        return NavigationService.frame || Frame.topmost();
    }

    public static navigate(path: string, options: Partial<NavigationOptions> = {}): void {
        const navigationEntry: NavigationOptions = {
            moduleName: path,
            clearHistory: options.clearHistory,
            animated: options.animated !== false,
            transition: options.transition,
            context: {
                ...options,
                userId: options.userId,
                bookId: options.bookId,
                reviewId: options.reviewId,
                clubId: options.clubId,
                challengeId: options.challengeId,
                collectionId: options.collectionId,
                discussionId: options.discussionId,
                eventId: options.eventId,
                activityId: options.activityId,
                mode: options.mode,
                onSelect: options.onSelect,
                showAcceptButton: options.showAcceptButton,
                acceptCallback: options.acceptCallback
            }
        };

        NavigationService.navigationStack.push(path);
        Frame.topmost().navigate(navigationEntry);
    }

    public static back(): void {
        if (NavigationService.canGoBack()) {
            NavigationService.navigationStack.pop();
            Frame.topmost().goBack();
        }
    }

    public static goBack(): void {
        NavigationService.back();
    }

    public static getCurrentRoute(): string {
        return NavigationService.navigationStack[NavigationService.navigationStack.length - 1] || '';
    }

    public static getBackStack(): BackstackEntry[] {
        return Frame.topmost().backStack;
    }

    public static navigateToRoot(): void {
        const frame = Frame.topmost();
        if (frame) {
            frame.navigate({
                moduleName: 'features/home/views/home-page',
                clearHistory: true
            });
        }
        NavigationService.navigationStack = [NavigationService.getCurrentRoute()];
    }

    public static canGoBack(): boolean {
        return NavigationService.navigationStack.length > 1;
    }

    public static reset(path: string): void {
        NavigationService.navigationStack = [path];
        NavigationService.navigate(path, { clearHistory: true });
    }

    public static replaceTopmost(path: string, options: Partial<NavigationOptions> = {}): void {
        NavigationService.navigationStack.pop();
        NavigationService.navigationStack.push(path);
        
        const navigationEntry: NavigationOptions = {
            moduleName: path,
            animated: options.animated !== false,
            transition: options.transition,
            context: {
                ...options,
                userId: options.userId,
                bookId: options.bookId,
                reviewId: options.reviewId,
                clubId: options.clubId,
                challengeId: options.challengeId,
                collectionId: options.collectionId,
                discussionId: options.discussionId,
                eventId: options.eventId,
                activityId: options.activityId,
                mode: options.mode,
                onSelect: options.onSelect,
                showAcceptButton: options.showAcceptButton,
                acceptCallback: options.acceptCallback
            },
            clearHistory: false
        };

        Frame.topmost().navigate(navigationEntry);
    }

    public static navigateToLogin(): void {
        NavigationService.navigate('features/auth/views/login-page', { clearHistory: true });
    }

    // Instance methods that delegate to static methods
    public navigate(path: string, options: Partial<NavigationOptions> = {}): void {
        NavigationService.navigate(path, options);
    }

    public back(): void {
        NavigationService.back();
    }

    public getCurrentRoute(): string {
        return NavigationService.getCurrentRoute();
    }

    public getBackStack(): BackstackEntry[] {
        return NavigationService.getBackStack();
    }

    public navigateToRoot(): void {
        NavigationService.navigateToRoot();
    }

    public canGoBack(): boolean {
        return NavigationService.canGoBack();
    }

    public reset(path: string): void {
        NavigationService.reset(path);
    }

    public replaceTopmost(path: string, options: Partial<NavigationOptions> = {}): void {
        NavigationService.replaceTopmost(path, options);
    }

    public setFrame(frame: Frame): void {
        NavigationService.setFrame(frame);
    }

    public getFrame(): Frame {
        return NavigationService.getFrame();
    }

    public goBack(): void {
        NavigationService.back();
    }

    public navigateToLogin(): void {
        NavigationService.navigateToLogin();
    }
}
