import { Application } from '@nativescript/core';
import { AuthService } from '../features/auth/services/auth.service';
import { NavigationService } from '../core/services/navigation.service';

export class App {
    private static instance: App;
    private authService: AuthService;

    private constructor() {
        this.authService = AuthService.getInstance();
        this.setupNavigation();
        this.setupTheme();
    }

    public static getInstance(): App {
        if (!App.instance) {
            App.instance = new App();
        }
        return App.instance;
    }

    public start(): void {
        Application.run({ moduleName: 'app-root' });
    }

    private setupNavigation(): void {
        NavigationService.setRootNavigation({
            moduleName: 'app-root',
            clearHistory: true
        });
    }

    private setupTheme(): void {
        // Set initial theme based on user preferences or system settings
    }

    private checkInitialRoute(): string {
        return this.authService.getIsAuthenticated() ? 'home' : 'auth/login';
    }
}

// Initialize the app
const app = App.getInstance();
app.start();
