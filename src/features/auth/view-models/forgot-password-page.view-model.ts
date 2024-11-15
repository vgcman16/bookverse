import { Observable } from '@nativescript/core';
import { AuthService } from '../services/auth.service';
import { NavigationService } from '../../../core/services/navigation.service';

export class ForgotPasswordPageViewModel extends Observable {
    private authService: AuthService;
    private navigationService: NavigationService;

    public email: string = '';
    public isLoading: boolean = false;
    public errorMessage: string = '';
    public emailError: string = '';
    public successMessage: string = '';

    constructor() {
        super();
        this.authService = AuthService.getInstance();
        this.navigationService = NavigationService.getInstance();
    }

    public async onResetPassword() {
        if (!this.validateForm()) {
            return;
        }

        try {
            this.setLoading(true);
            this.clearMessages();
            
            await this.authService.resetPassword(this.email);
            this.successMessage = 'Password reset link has been sent to your email.';
            this.notifyPropertyChange('successMessage', this.successMessage);

            // Automatically navigate back to login after 3 seconds
            setTimeout(() => {
                this.onBackToLogin();
            }, 3000);
        } catch (error) {
            this.handleError(error);
        } finally {
            this.setLoading(false);
        }
    }

    public onBackToLogin() {
        this.navigationService.navigate('features/auth/views/login-page');
    }

    private validateForm(): boolean {
        let isValid = true;
        this.clearMessages();

        if (!this.email) {
            this.emailError = 'Email is required';
            isValid = false;
        } else if (!this.isValidEmail(this.email)) {
            this.emailError = 'Please enter a valid email address';
            isValid = false;
        }

        this.notifyPropertyChanges();
        return isValid;
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private handleError(error: any) {
        console.error('Password reset error:', error);
        
        if (error.code) {
            switch (error.code) {
                case 'auth/invalid-email':
                    this.emailError = 'Invalid email address';
                    break;
                case 'auth/user-not-found':
                    this.errorMessage = 'No account found with this email';
                    break;
                case 'auth/too-many-requests':
                    this.errorMessage = 'Too many attempts. Please try again later';
                    break;
                case 'auth/network-request-failed':
                    this.errorMessage = 'Network error. Please check your connection';
                    break;
                default:
                    this.errorMessage = 'An error occurred. Please try again';
            }
        } else {
            this.errorMessage = error.message || 'An unexpected error occurred';
        }

        this.notifyPropertyChanges();
    }

    private clearMessages() {
        this.errorMessage = '';
        this.emailError = '';
        this.successMessage = '';
        this.notifyPropertyChanges();
    }

    private setLoading(value: boolean) {
        this.isLoading = value;
        this.notifyPropertyChange('isLoading', value);
    }

    private notifyPropertyChanges() {
        this.notifyPropertyChange('errorMessage', this.errorMessage);
        this.notifyPropertyChange('emailError', this.emailError);
        this.notifyPropertyChange('successMessage', this.successMessage);
    }
}
