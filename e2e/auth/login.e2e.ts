import { by } from 'detox';
import {
    tapOn,
    typeText,
    checkElementExists,
    checkElementHasText,
    takeScreenshot
} from '../setup';

describe('Login Flow', () => {
    beforeEach(async () => {
        // Ensure we're on the login page
        await checkElementExists(by.id('login-page'));
    });

    it('should show validation errors for empty fields', async () => {
        // Attempt to login with empty fields
        await tapOn(by.id('login-button'));

        // Check for validation messages
        await checkElementExists(by.id('email-error'));
        await checkElementExists(by.id('password-error'));
        await checkElementHasText(by.id('email-error'), 'Email is required');
        await checkElementHasText(by.id('password-error'), 'Password is required');

        await takeScreenshot('login-validation-errors');
    });

    it('should show error for invalid credentials', async () => {
        // Type invalid credentials
        await typeText(by.id('email-input'), 'invalid@example.com');
        await typeText(by.id('password-input'), 'wrongpassword');

        // Attempt to login
        await tapOn(by.id('login-button'));

        // Check for error message
        await checkElementExists(by.id('login-error'));
        await checkElementHasText(
            by.id('login-error'),
            'Invalid email or password'
        );

        await takeScreenshot('login-invalid-credentials');
    });

    it('should successfully login with valid credentials', async () => {
        // Type valid credentials
        await typeText(by.id('email-input'), 'test@example.com');
        await typeText(by.id('password-input'), 'password123');

        // Take screenshot before login
        await takeScreenshot('login-before-submit');

        // Attempt to login
        await tapOn(by.id('login-button'));

        // Verify successful login
        await checkElementExists(by.id('home-page'));
        await checkElementExists(by.id('user-profile-button'));
        await checkElementHasText(
            by.id('welcome-message'),
            'Welcome back, Test User'
        );

        // Take screenshot after successful login
        await takeScreenshot('login-success-home');
    });

    it('should navigate to forgot password page', async () => {
        // Tap forgot password link
        await tapOn(by.id('forgot-password-link'));

        // Verify navigation
        await checkElementExists(by.id('forgot-password-page'));
        await checkElementHasText(
            by.id('page-title'),
            'Reset Your Password'
        );

        await takeScreenshot('forgot-password-page');
    });

    it('should navigate to signup page', async () => {
        // Tap signup link
        await tapOn(by.id('signup-link'));

        // Verify navigation
        await checkElementExists(by.id('signup-page'));
        await checkElementHasText(
            by.id('page-title'),
            'Create an Account'
        );

        await takeScreenshot('signup-page');
    });

    it('should persist login state after app restart', async () => {
        // Login with valid credentials
        await typeText(by.id('email-input'), 'test@example.com');
        await typeText(by.id('password-input'), 'password123');
        await tapOn(by.id('login-button'));

        // Verify successful login
        await checkElementExists(by.id('home-page'));

        // Restart the app
        await device.reloadReactNative();

        // Verify we're still logged in
        await checkElementExists(by.id('home-page'));
        await checkElementExists(by.id('user-profile-button'));

        await takeScreenshot('login-persistence');
    });

    it('should handle network errors gracefully', async () => {
        // Simulate no network connection
        await device.setStatusBar({
            dataNetwork: 'hide'
        });

        // Attempt to login
        await typeText(by.id('email-input'), 'test@example.com');
        await typeText(by.id('password-input'), 'password123');
        await tapOn(by.id('login-button'));

        // Check for network error message
        await checkElementExists(by.id('network-error'));
        await checkElementHasText(
            by.id('network-error'),
            'Network error. Please check your connection.'
        );

        // Take screenshot of network error
        await takeScreenshot('login-network-error');

        // Restore network connection
        await device.setStatusBar({
            dataNetwork: '4g'
        });
    });
});
