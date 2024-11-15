import { Observable } from '@nativescript/core';
import { AuthService } from '../services/auth.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { UserRegistration } from '../models/user.model';

export class SignupPageViewModel extends Observable {
    private authService: AuthService;
    private navigationService: NavigationService;

    public displayName: string = '';
    public email: string = '';
    public password: string = '';
    public confirmPassword: string = '';
    public acceptTerms: boolean = false;
    public isLoading: boolean = false;

    public displayNameError: string = '';
    public emailError: string = '';
    public passwordError: string = '';
    public confirmPasswordError: string = '';
    public errorMessage: string = '';

    constructor() {
        super();
        this.authService = AuthService.getInstance();
        this.navigationService = NavigationService.getInstance();
    }

    public async onSignUp() {
        if (!this.validateForm()) {
            return;
        }

        try {
            this.setLoading(true);
            this.clearErrors();

            const registration: UserRegistration = {
                email: this.email,
                password: this.password,
                displayName: this.displayName
            };

            await this.authService.signUpWithEmailAndPassword(registration);
            this.navigateToHome();
        } catch (error) {
            this.handleError(error);
        } finally {
            this.setLoading(false);
        }
    }

    public onViewTerms() {
        this.navigationService.navigate('features/auth/views/terms-page', {
            showAcceptButton: true,
            acceptCallback: (accepted: boolean) => {
                if (accepted) {
                    this.acceptTerms = true;
                    this.notifyPropertyChange('acceptTerms', true);
                }
            }
        });
    }

    public onBackToLogin() {
        this.navigationService.navigate('features/auth/views/login-page');
    }

    private validateForm(): boolean {
        let isValid = true;
        this.clearErrors();

        // Display Name validation
        if (!this.displayName) {
            this.displayNameError = 'Display name is required';
            isValid = false;
        } else if (this.displayName.length < 2) {
            this.displayNameError = 'Display name must be at least 2 characters';
            isValid = false;
        }

        // Email validation
        if (!this.email) {
            this.emailError = 'Email is required';
            isValid = false;
        } else if (!this.isValidEmail(this.email)) {
            this.emailError = 'Please enter a valid email address';
            isValid = false;
        }

        // Password validation
        if (!this.password) {
            this.passwordError = 'Password is required';
            isValid = false;
        } else if (this.password.length < 6) {
            this.passwordError = 'Password must be at least 6 characters';
            isValid = false;
        } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(this.password)) {
            this.passwordError = 'Password must contain both letters and numbers';
            isValid = false;
        }

        // Confirm Password validation
        if (!this.confirmPassword) {
            this.confirmPasswordError = 'Please confirm your password';
            isValid = false;
        } else if (this.password !== this.confirmPassword) {
            this.confirmPasswordError = 'Passwords do not match';
            isValid = false;
        }

        // Terms validation
        if (!this.acceptTerms) {
            this.errorMessage = 'Please accept the Terms and Conditions';
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
        console.error('Sign up error:', error);
        
        if (error.code) {
            switch (error.code) {
                case 'auth/email-already-in-use':
                    this.emailError = 'This email is already registered';
                    break;
                case 'auth/invalid-email':
                    this.emailError = 'Invalid email address';
                    break;
                case 'auth/operation-not-allowed':
                    this.errorMessage = 'Email/password accounts are not enabled. Please contact support.';
                    break;
                case 'auth/weak-password':
                    this.passwordError = 'Password is too weak';
                    break;
                case 'auth/network-request-failed':
                    this.errorMessage = 'Network error. Please check your connection';
                    break;
                default:
                    this.errorMessage = 'An error occurred during sign up. Please try again';
            }
        } else {
            this.errorMessage = error.message || 'An unexpected error occurred';
        }

        this.notifyPropertyChanges();
    }

    private clearErrors() {
        this.displayNameError = '';
        this.emailError = '';
        this.passwordError = '';
        this.confirmPasswordError = '';
        this.errorMessage = '';
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
        this.notifyPropertyChange('displayNameError', this.displayNameError);
        this.notifyPropertyChange('emailError', this.emailError);
        this.notifyPropertyChange('passwordError', this.passwordError);
        this.notifyPropertyChange('confirmPasswordError', this.confirmPasswordError);
        this.notifyPropertyChange('errorMessage', this.errorMessage);
    }
}
