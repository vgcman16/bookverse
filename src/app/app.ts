import { Application, Frame } from '@nativescript/core';
import { initializeFirebase } from '../core/config/firebase.config';
import { NavigationService } from '../core/services/navigation.service';
import { AuthService } from '../features/auth/services/auth.service';

// Load global styles
require('./app.css');
require('../features/auth/styles/auth.css');

export class App {
    private static instance: App;
    private authService: AuthService;

    private constructor() {
        this.authService = AuthService.getInstance();
        this.initializeApp();
    }

    public static getInstance(): App {
        if (!App.instance) {
            App.instance = new App();
        }
        return App.instance;
    }

    private async initializeApp(): Promise<void> {
        try {
            // Initialize Firebase
            await initializeFirebase();

            // Set up application lifecycle handlers
            this.setupAppLifecycleListeners();

            // Handle uncaught errors
            this.setupErrorHandling();

            // Initialize the main frame when the app launches
            Application.on(Application.launchEvent, (args) => {
                const rootFrame = args.root as Frame;
                NavigationService.setMainFrame(rootFrame);

                // Check authentication state and navigate accordingly
                const isAuthenticated = this.authService.isAuthenticated();
                if (isAuthenticated) {
                    NavigationService.navigateToHome();
                } else {
                    NavigationService.navigateToLogin();
                }
            });

        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    private setupAppLifecycleListeners(): void {
        Application.on(Application.exitEvent, () => {
            console.log('Application exiting');
            // Cleanup resources
        });

        Application.on(Application.suspendEvent, () => {
            console.log('Application suspended');
            // Handle app suspension
        });

        Application.on(Application.resumeEvent, () => {
            console.log('Application resumed');
            // Handle app resume
        });

        Application.on(Application.lowMemoryEvent, () => {
            console.log('Low memory warning');
            // Handle low memory situation
        });
    }

    private setupErrorHandling(): void {
        Application.on(Application.uncaughtErrorEvent, (args) => {
            console.error('Uncaught error:', args.error);
            // TODO: Implement error reporting service
        });
    }

    public start(): void {
        Application.run({ moduleName: 'app-root' });
    }
}

// Start the application
App.getInstance().start();
