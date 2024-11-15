import { device, element, by, waitFor } from 'detox';

describe('Sign Up Flow', () => {
    beforeAll(async () => {
        await device.launchApp({
            newInstance: true,
            permissions: { notifications: 'YES' }
        });
    });

    beforeEach(async () => {
        await device.reloadReactNative();
        // Navigate to sign up page
        await element(by.text('Sign Up')).tap();
    });

    it('should show validation errors for empty form submission', async () => {
        // Attempt to sign up with empty form
        await element(by.text('Sign Up')).tap();

        // Verify validation errors
        await expect(element(by.text('Display name is required'))).toBeVisible();
        await expect(element(by.text('Email is required'))).toBeVisible();
        await expect(element(by.text('Password is required'))).toBeVisible();
        await expect(element(by.text('Please accept both Terms and Conditions and Privacy Policy'))).toBeVisible();
    });

    it('should validate email format', async () => {
        // Enter invalid email
        await element(by.id('email-input')).typeText('invalid-email');
        await element(by.text('Sign Up')).tap();

        // Verify email validation error
        await expect(element(by.text('Please enter a valid email address'))).toBeVisible();

        // Clear and enter valid email
        await element(by.id('email-input')).clearText();
        await element(by.id('email-input')).typeText('test@example.com');
        await element(by.text('Sign Up')).tap();

        // Verify email error is gone
        await expect(element(by.text('Please enter a valid email address'))).not.toBeVisible();
    });

    it('should validate password requirements', async () => {
        // Enter short password
        await element(by.id('password-input')).typeText('12345');
        await element(by.text('Sign Up')).tap();

        // Verify password length error
        await expect(element(by.text('Password must be at least 6 characters'))).toBeVisible();

        // Enter password without letters
        await element(by.id('password-input')).clearText();
        await element(by.id('password-input')).typeText('123456');
        await element(by.text('Sign Up')).tap();

        // Verify password complexity error
        await expect(element(by.text('Password must contain both letters and numbers'))).toBeVisible();

        // Enter valid password
        await element(by.id('password-input')).clearText();
        await element(by.id('password-input')).typeText('abc123');
        await element(by.text('Sign Up')).tap();

        // Verify password errors are gone
        await expect(element(by.text('Password must be at least 6 characters'))).not.toBeVisible();
        await expect(element(by.text('Password must contain both letters and numbers'))).not.toBeVisible();
    });

    it('should validate password confirmation', async () => {
        // Enter mismatched passwords
        await element(by.id('password-input')).typeText('abc123');
        await element(by.id('confirm-password-input')).typeText('abc124');
        await element(by.text('Sign Up')).tap();

        // Verify password mismatch error
        await expect(element(by.text('Passwords do not match'))).toBeVisible();

        // Enter matching passwords
        await element(by.id('confirm-password-input')).clearText();
        await element(by.id('confirm-password-input')).typeText('abc123');
        await element(by.text('Sign Up')).tap();

        // Verify password mismatch error is gone
        await expect(element(by.text('Passwords do not match'))).not.toBeVisible();
    });

    it('should handle terms and privacy policy flow', async () => {
        // View and accept terms
        await element(by.text('Terms and Conditions')).tap();
        await waitFor(element(by.text('Accept Terms'))).toBeVisible().withTimeout(2000);
        await element(by.text('Accept Terms')).tap();

        // Verify terms switch is checked
        await expect(element(by.id('terms-switch'))).toHaveToggleValue(true);

        // View and accept privacy policy
        await element(by.text('Privacy Policy')).tap();
        await waitFor(element(by.text('Accept Privacy Policy'))).toBeVisible().withTimeout(2000);
        await element(by.text('Accept Privacy Policy')).tap();

        // Verify privacy switch is checked
        await expect(element(by.id('privacy-switch'))).toHaveToggleValue(true);
    });

    it('should complete successful sign up', async () => {
        // Fill in valid form data
        await element(by.id('display-name-input')).typeText('John Doe');
        await element(by.id('email-input')).typeText('test@example.com');
        await element(by.id('password-input')).typeText('abc123');
        await element(by.id('confirm-password-input')).typeText('abc123');

        // Accept terms and privacy
        await element(by.text('Terms and Conditions')).tap();
        await waitFor(element(by.text('Accept Terms'))).toBeVisible().withTimeout(2000);
        await element(by.text('Accept Terms')).tap();

        await element(by.text('Privacy Policy')).tap();
        await waitFor(element(by.text('Accept Privacy Policy'))).toBeVisible().withTimeout(2000);
        await element(by.text('Accept Privacy Policy')).tap();

        // Submit form
        await element(by.text('Sign Up')).tap();

        // Verify navigation to home page
        await waitFor(element(by.id('home-page'))).toBeVisible().withTimeout(2000);
    });

    it('should handle existing email error', async () => {
        // Fill in form with existing email
        await element(by.id('display-name-input')).typeText('John Doe');
        await element(by.id('email-input')).typeText('existing@example.com');
        await element(by.id('password-input')).typeText('abc123');
        await element(by.id('confirm-password-input')).typeText('abc123');

        // Accept terms and privacy
        await element(by.text('Terms and Conditions')).tap();
        await element(by.text('Accept Terms')).tap();
        await element(by.text('Privacy Policy')).tap();
        await element(by.text('Accept Privacy Policy')).tap();

        // Submit form
        await element(by.text('Sign Up')).tap();

        // Verify error message
        await expect(element(by.text('This email is already registered'))).toBeVisible();
    });

    it('should navigate back to login', async () => {
        await element(by.text('Already have an account? Login')).tap();
        await expect(element(by.text('Login'))).toBeVisible();
    });
});
