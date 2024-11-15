import { Frame, NavigationEntry, BackstackEntry, Page } from '@nativescript/core';

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
    mode?: string;
    onSelect?: (item: any) => void;
}

export class NavigationService {
    private static frame: Frame;
    private static navigationStack: string[] = [];

    public static setRootNavigation(options: NavigationOptions): void {
        Frame.topmost().navigate(options);
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
                mode: options.mode,
                onSelect: options.onSelect
            }
        };

        this.navigationStack.push(path);
        Frame.topmost().navigate(navigationEntry);
    }

    public static back(): void {
        if (this.canGoBack()) {
            this.navigationStack.pop();
            Frame.topmost().goBack();
        }
    }

    public static getCurrentRoute(): string {
        return this.navigationStack[this.navigationStack.length - 1] || '';
    }

    public static getBackStack(): BackstackEntry[] {
        return Frame.topmost().backStack;
    }

    public static clearHistory(): void {
        const topmost = Frame.topmost();
        const currentPage = topmost.currentPage;
        if (currentPage) {
            topmost.navigate({
                create: () => currentPage,
                clearHistory: true
            });
        }
        this.navigationStack = [this.getCurrentRoute()];
    }

    public static canGoBack(): boolean {
        return this.navigationStack.length > 1;
    }

    public static reset(path: string): void {
        this.navigationStack = [path];
        this.navigate(path, { clearHistory: true });
    }

    public static replaceTopmost(path: string, options: Partial<NavigationOptions> = {}): void {
        this.navigationStack.pop();
        this.navigationStack.push(path);
        
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
                mode: options.mode,
                onSelect: options.onSelect
            },
            clearHistory: false
        };

        Frame.topmost().navigate(navigationEntry);
    }

    public static setFrame(frame: Frame): void {
        NavigationService.frame = frame;
    }

    public static getFrame(): Frame {
        return NavigationService.frame || Frame.topmost();
    }

    // Alias methods for consistency
    public static goBack(): void {
        this.back();
    }

    public static navigateToLogin(): void {
        this.navigate('auth/login', { clearHistory: true });
    }
}
