import { Application } from '@nativescript/core';
import { AppRootViewModel } from './view-models/app-root.view-model';

// Global app setup and configuration
class App {
    private static instance: App;
    private rootViewModel: AppRootViewModel;

    private constructor() {
        // Initialize root view model
        this.rootViewModel = new AppRootViewModel();

        // Setup global error handling
        Application.on(Application.uncaughtErrorEvent, (args: any) => {
            console.error('Application error:', args.error);
            // TODO: Implement error reporting service
        });

        // Setup app lifecycle handlers
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
    }

    public static getInstance(): App {
        if (!App.instance) {
            App.instance = new App();
        }
        return App.instance;
    }

    public getRootViewModel(): AppRootViewModel {
        return this.rootViewModel;
    }

    public start() {
        Application.run({ moduleName: 'app-root' });
    }
}

// Initialize and start the application
App.getInstance().start();
