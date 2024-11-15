import { Frame } from '@nativescript/core';

export class NavigationService {
    private static mainFrame: Frame;

    public static setMainFrame(frame: Frame): void {
        NavigationService.mainFrame = frame;
    }

    public static navigate(page: string, context?: any): void {
        if (!NavigationService.mainFrame) {
            console.error('Navigation frame not set. Call setMainFrame first.');
            return;
        }

        const modulePath = this.getModulePath(page);
        NavigationService.mainFrame.navigate({
            moduleName: modulePath,
            context: context,
            animated: true,
            transition: {
                name: 'slide',
                duration: 300,
                curve: 'easeInOut'
            }
        });
    }

    public static goBack(): void {
        if (!NavigationService.mainFrame) {
            console.error('Navigation frame not set. Call setMainFrame first.');
            return;
        }

        if (NavigationService.mainFrame.canGoBack()) {
            NavigationService.mainFrame.goBack();
        }
    }

    public static navigateToHome(): void {
        this.navigate('features/home/views/home-page');
    }

    public static navigateToLogin(): void {
        this.navigate('features/auth/views/login-page');
    }

    public static navigateToSignup(): void {
        this.navigate('features/auth/views/signup-page');
    }

    public static navigateToForgotPassword(): void {
        this.navigate('features/auth/views/forgot-password-page');
    }

    public static navigateToProfile(): void {
        this.navigate('features/profile/views/profile-page');
    }

    public static navigateToBookDetails(bookId: string): void {
        this.navigate('features/books/views/book-details-page', { bookId });
    }

    private static getModulePath(page: string): string {
        // Map short names to full paths
        const pathMap: { [key: string]: string } = {
            'home': 'features/home/views/home-page',
            'login': 'features/auth/views/login-page',
            'signup': 'features/auth/views/signup-page',
            'forgot-password': 'features/auth/views/forgot-password-page',
            'profile': 'features/profile/views/profile-page',
            'book-details': 'features/books/views/book-details-page'
        };

        return pathMap[page] || page;
    }
}
