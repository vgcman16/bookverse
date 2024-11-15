import { Observable } from '@nativescript/core';
import { AuthService } from '../services/auth.service';
import { GoogleAuthService } from '../services/google-auth.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { User, UserPreferences } from '../models/user.model';

export class LoginPageViewModel extends Observable {
    private authService: AuthService;
    private googleAuthService: GoogleAuthService;
    private navigationService: NavigationService;

    public email: string = '';
    public password: string = '';
    public rememberMe: boolean = false;
    public isLoading: boolean = false;
    public errorMessage: string = '';
    public emailError: string = '';
    public passwordError: string = '';

    constructor() {
        super();
        this.authService = AuthService.getInstance();
        this.googleAuthService = GoogleAuthService.getInstance();
        this.navigationService = NavigationService.getInstance();
    }

    public async onLogin() {
        if (!this.validateForm()) {
            return;
        }

        try {
            this.setLoading(true);
            await this.authService.signInWithEmailAndPassword(this.email, this.password);
            this.navigateToHome();
        } catch (error) {
            this.handleError(error);
        } finally {
            this.setLoading(false);
        }
    }

    public async onGoogleLogin() {
        try {
            this.setLoading(true);
            this.clearErrors();
            
            await this.googleAuthService.signIn().toPromise();
            this.navigateToHome();
        } catch (error) {
            this.handleError(error);
        } finally {
            this.setLoading(false);
        }
    }

    public onForgotPassword() {
        this.navigationService.navigate('features/auth/views/forgot-password-page');
    }

    public onSignUp() {
        this.navigationService.navigate('features/auth/views/signup-page');
    }

    private validateForm(): boolean {
        let isValid = true;
        this.clearErrors();

        if (!this.email) {
            this.emailError = 'Email is required';
            isValid = false;
        } else if (!this.isValidEmail(this.email)) {
            this.emailError = 'Please enter a valid email address';
            isValid = false;
        }

        if (!this.password) {
            this.passwordError = 'Password is required';
            isValid = false;
        } else if (this.password.length < 6) {
            this.passwordError = 'Password must be at least 6 characters';
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
        console.error('Login error:', error);
        
        if (error.code) {
            switch (error.code) {
                case 'auth/invalid-email':
                    this.emailError = 'Invalid email address';
                    break;
                case 'auth/user-disabled':
                    this.errorMessage = 'This account has been disabled';
                    break;
                case 'auth/user-not-found':
                    this.emailError = 'No account found with this email';
                    break;
                case 'auth/wrong-password':
                    this.passwordError = 'Incorrect password';
                    break;
                case 'auth/too-many-requests':
                    this.errorMessage = 'Too many failed attempts. Please try again later';
                    break;
                case 'auth/network-request-failed':
                    this.errorMessage = 'Network error. Please check your connection';
                    break;
                case 'sign_in_cancelled':
                    // User cancelled the sign-in, no need to show error
                    break;
                default:
                    this.errorMessage = 'An error occurred during sign in. Please try again';
            }
        } else {
            this.errorMessage = error.message || 'An unexpected error occurred';
        }

        this.notifyPropertyChanges();
    }

    private clearErrors() {
        this.errorMessage = '';
        this.emailError = '';
        this.passwordError = '';
        this.notifyPropertyChanges();
    }

    private setLoading(value: boolean) {
        this.isLoading = value;
        this.notifyPropertyChange('isLoading', value);
    }

    private navigateToHome() {
        this.navigationService.navigate('features/home/views/home-page', {
            clearHistory: true
        });
    }

    private notifyPropertyChanges() {
        this.notifyPropertyChange('errorMessage', this.errorMessage);
        this.notifyPropertyChange('emailError', this.emailError);
        this.notifyPropertyChange('passwordError', this.passwordError);
    }
}
