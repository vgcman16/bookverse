import { Observable } from '@nativescript/core';
import { AuthService } from '../services/auth.service';
import { getFirebaseErrorMessage } from '../../../core/config/firebase.config';
import { NavigationService } from '../../../core/services/navigation.service';

export class LoginPageViewModel extends Observable {
    private authService: AuthService;
    private _email: string = '';
    private _password: string = '';
    private _isLoading: boolean = false;
    private _errorMessage: string = '';

    constructor() {
        super();
        this.authService = AuthService.getInstance();
    }

    get email(): string {
        return this._email;
    }

    set email(value: string) {
        if (this._email !== value) {
            this._email = value;
            this.notifyPropertyChange('email', value);
        }
    }

    get password(): string {
        return this._password;
    }

    set password(value: string) {
        if (this._password !== value) {
            this._password = value;
            this.notifyPropertyChange('password', value);
        }
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    set isLoading(value: boolean) {
        if (this._isLoading !== value) {
            this._isLoading = value;
            this.notifyPropertyChange('isLoading', value);
        }
    }

    get errorMessage(): string {
        return this._errorMessage;
    }

    set errorMessage(value: string) {
        if (this._errorMessage !== value) {
            this._errorMessage = value;
            this.notifyPropertyChange('errorMessage', value);
        }
    }

    public async onLoginTap(): Promise<void> {
        if (!this.validateForm()) {
            return;
        }

        try {
            this.isLoading = true;
            this.errorMessage = '';

            await this.authService.signIn({
                email: this.email,
                password: this.password
            });

            // Navigate to home page on successful login
            NavigationService.navigate('home');
        } catch (error) {
            this.errorMessage = getFirebaseErrorMessage(error);
        } finally {
            this.isLoading = false;
        }
    }

    public async onGoogleLoginTap(): Promise<void> {
        try {
            this.isLoading = true;
            this.errorMessage = '';
            
            // TODO: Implement Google login
            console.log('Google login not implemented yet');
            
        } catch (error) {
            this.errorMessage = getFirebaseErrorMessage(error);
        } finally {
            this.isLoading = false;
        }
    }

    public async onFacebookLoginTap(): Promise<void> {
        try {
            this.isLoading = true;
            this.errorMessage = '';
            
            // TODO: Implement Facebook login
            console.log('Facebook login not implemented yet');
            
        } catch (error) {
            this.errorMessage = getFirebaseErrorMessage(error);
        } finally {
            this.isLoading = false;
        }
    }

    public onSignUpTap(): void {
        NavigationService.navigate('signup');
    }

    public onForgotPasswordTap(): void {
        NavigationService.navigate('forgot-password');
    }

    private validateForm(): boolean {
        if (!this.email || !this.email.trim()) {
            this.errorMessage = 'Please enter your email';
            return false;
        }

        if (!this.isValidEmail(this.email)) {
            this.errorMessage = 'Please enter a valid email address';
            return false;
        }

        if (!this.password || !this.password.trim()) {
            this.errorMessage = 'Please enter your password';
            return false;
        }

        if (this.password.length < 6) {
            this.errorMessage = 'Password must be at least 6 characters long';
            return false;
        }

        return true;
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
