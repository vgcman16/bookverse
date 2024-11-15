import { firebase } from '@nativescript/firebase-core';
import { Auth, User as FirebaseUser, UserCredential, EmailAuthProvider } from '@nativescript/firebase-auth';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
    User, 
    AuthState, 
    UserCredentials, 
    UserRegistration,
    DEFAULT_USER_PREFERENCES,
    DEFAULT_USER_STATS
} from '../models/user.model';

export class AuthService {
    private static instance: AuthService;
    private auth: Auth;
    private authStateSubject: BehaviorSubject<AuthState>;
    private authCheckInterval: any;

    private constructor() {
        this.auth = firebase().auth();
        this.authStateSubject = new BehaviorSubject<AuthState>({
            user: null,
            isAuthenticated: false,
            isLoading: true,
            error: null
        });

        this.initializeAuthStateListener();
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    private initializeAuthStateListener(): void {
        // Check auth state every second
        this.authCheckInterval = setInterval(() => {
            const firebaseUser = this.auth.currentUser;
            if (firebaseUser) {
                const user: User = this.mapFirebaseUserToUser(firebaseUser);
                this.authStateSubject.next({
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null
                });
            } else {
                this.authStateSubject.next({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null
                });
            }
        }, 1000);
    }

    private mapFirebaseUserToUser(firebaseUser: FirebaseUser): User {
        return {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            emailVerified: firebaseUser.emailVerified,
            createdAt: new Date(),
            updatedAt: new Date(),
            preferences: DEFAULT_USER_PREFERENCES,
            stats: DEFAULT_USER_STATS
        };
    }

    public async signInWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
        try {
            this.updateAuthState({ isLoading: true, error: null });
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            return userCredential;
        } catch (error) {
            this.handleAuthError(error);
            throw error;
        }
    }

    public async signUpWithEmailAndPassword(registration: UserRegistration): Promise<UserCredential> {
        try {
            this.updateAuthState({ isLoading: true, error: null });
            const userCredential = await this.auth.createUserWithEmailAndPassword(
                registration.email,
                registration.password
            );

            if (userCredential.user) {
                await userCredential.user.updateProfile({
                    displayName: registration.displayName || '',
                    photoUri: registration.photoURL || ''
                });
            }

            return userCredential;
        } catch (error) {
            this.handleAuthError(error);
            throw error;
        }
    }

    public async signOut(): Promise<void> {
        try {
            await this.auth.signOut();
            this.updateAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            });
        } catch (error) {
            this.handleAuthError(error);
            throw error;
        }
    }

    public async resetPassword(email: string): Promise<void> {
        try {
            await this.auth.sendPasswordResetEmail(email);
        } catch (error) {
            this.handleAuthError(error);
            throw error;
        }
    }

    public async updatePassword(newPassword: string): Promise<void> {
        if (!this.auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            await this.auth.currentUser.updatePassword(newPassword);
        } catch (error) {
            this.handleAuthError(error);
            throw error;
        }
    }

    public async updateEmail(newEmail: string): Promise<void> {
        if (!this.auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            await this.auth.currentUser.updateEmail(newEmail);
        } catch (error) {
            this.handleAuthError(error);
            throw error;
        }
    }

    public async updateProfile(displayName: string, photoURL: string): Promise<void> {
        if (!this.auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            await this.auth.currentUser.updateProfile({
                displayName: displayName || '',
                photoUri: photoURL || ''
            });

            // Update the auth state with new profile info
            if (this.authStateSubject.value.user) {
                const updatedUser = {
                    ...this.authStateSubject.value.user,
                    displayName,
                    photoURL,
                    updatedAt: new Date()
                };
                this.updateAuthState({ user: updatedUser });
            }
        } catch (error) {
            this.handleAuthError(error);
            throw error;
        }
    }

    public async reauthenticate(password: string): Promise<UserCredential> {
        if (!this.auth.currentUser || !this.auth.currentUser.email) {
            throw new Error('No authenticated user');
        }

        try {
            const credential = EmailAuthProvider.credential(
                this.auth.currentUser.email,
                password
            );
            return await this.auth.currentUser.reauthenticateWithCredential(credential);
        } catch (error) {
            this.handleAuthError(error);
            throw error;
        }
    }

    public async deleteAccount(): Promise<void> {
        if (!this.auth.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            await this.auth.currentUser.delete();
            this.updateAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            });
        } catch (error) {
            this.handleAuthError(error);
            throw error;
        }
    }

    public getCurrentUser(): User | null {
        return this.authStateSubject.value.user;
    }

    public getIsAuthenticated(): boolean {
        return this.authStateSubject.value.isAuthenticated;
    }

    public get authState$(): Observable<AuthState> {
        return this.authStateSubject.asObservable();
    }

    public get isAuthenticated$(): Observable<boolean> {
        return this.authState$.pipe(
            map(state => state.isAuthenticated)
        );
    }

    public get currentUser$(): Observable<User | null> {
        return this.authState$.pipe(
            map(state => state.user)
        );
    }

    private updateAuthState(updates: Partial<AuthState>): void {
        this.authStateSubject.next({
            ...this.authStateSubject.value,
            ...updates
        });
    }

    private handleAuthError(error: any): void {
        console.error('Auth error:', error);
        this.updateAuthState({
            isLoading: false,
            error: error.message || 'An error occurred during authentication'
        });
    }

    public dispose(): void {
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
            this.authCheckInterval = null;
        }
    }
}
