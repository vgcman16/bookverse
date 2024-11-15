import { Observable, BehaviorSubject } from 'rxjs';
import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-auth';
import { 
    User, 
    UserCredentials, 
    AuthState, 
    UserProfileUpdate 
} from '../models/user.model';
import { getFirebaseErrorMessage } from '../../../core/config/firebase.config';

type NativeScriptFirebaseUser = {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoUri: string | null;
    metadata: {
        creationDate: Date;
        lastSignInDate: Date;
    };
};

export class AuthService {
    private static instance: AuthService;
    private authStateSubject: BehaviorSubject<AuthState>;

    private constructor() {
        this.authStateSubject = new BehaviorSubject<AuthState>({
            isAuthenticated: false,
            isLoading: true,
            user: null,
            error: null
        });

        // Listen to Firebase auth state changes
        firebase().auth().addAuthStateChangeListener((fbUser: any) => {
            if (fbUser) {
                const user: NativeScriptFirebaseUser = {
                    uid: fbUser.uid,
                    email: fbUser.email,
                    displayName: fbUser.displayName,
                    photoUri: fbUser.photoUri,
                    metadata: {
                        creationDate: fbUser.metadata?.creationDate || new Date(),
                        lastSignInDate: fbUser.metadata?.lastSignInDate || new Date()
                    }
                };

                this.updateAuthState({
                    isAuthenticated: true,
                    isLoading: false,
                    user: this.mapFirebaseUser(user),
                    error: null
                });
            } else {
                this.updateAuthState({
                    isAuthenticated: false,
                    isLoading: false,
                    user: null,
                    error: null
                });
            }
        });
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    public get authState$(): Observable<AuthState> {
        return this.authStateSubject.asObservable();
    }

    public isAuthenticated(): boolean {
        return this.authStateSubject.value.isAuthenticated;
    }

    public getCurrentUser(): User | null {
        return this.authStateSubject.value.user;
    }

    public async signIn(credentials: UserCredentials): Promise<void> {
        try {
            this.updateAuthState({ ...this.authStateSubject.value, isLoading: true });
            await firebase().auth().signInWithEmailAndPassword(
                credentials.email,
                credentials.password
            );
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            this.updateAuthState({
                ...this.authStateSubject.value,
                isLoading: false,
                error: errorMessage
            });
            throw error;
        }
    }

    public async signUp(credentials: UserCredentials): Promise<void> {
        try {
            this.updateAuthState({ ...this.authStateSubject.value, isLoading: true });
            const userCredential = await firebase().auth().createUserWithEmailAndPassword(
                credentials.email,
                credentials.password
            );
            
            if (userCredential.user) {
                // Additional user setup can be done here
                console.log('User created successfully');
            }
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            this.updateAuthState({
                ...this.authStateSubject.value,
                isLoading: false,
                error: errorMessage
            });
            throw error;
        }
    }

    public async signOut(): Promise<void> {
        try {
            await firebase().auth().signOut();
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            this.updateAuthState({
                ...this.authStateSubject.value,
                error: errorMessage
            });
            throw error;
        }
    }

    public async resetPassword(email: string): Promise<void> {
        try {
            await firebase().auth().sendPasswordResetEmail(email);
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            throw new Error(errorMessage);
        }
    }

    public async updateProfile(displayName: string, photoUri?: string): Promise<void> {
        try {
            const currentUser = firebase().auth().currentUser;
            if (currentUser) {
                const updateData: UserProfileUpdate = { displayName };
                if (photoUri) {
                    updateData.photoUri = photoUri;
                }
                
                await currentUser.updateProfile(updateData);
                
                // Get the updated user data
                const updatedUser = firebase().auth().currentUser;
                if (updatedUser) {
                    const user: NativeScriptFirebaseUser = {
                        uid: updatedUser.uid,
                        email: updatedUser.email,
                        displayName: updatedUser.displayName,
                        photoUri: updatedUser.photoUri,
                        metadata: {
                            creationDate: updatedUser.metadata?.creationDate || new Date(),
                            lastSignInDate: updatedUser.metadata?.lastSignInDate || new Date()
                        }
                    };
                    
                    this.updateAuthState({
                        ...this.authStateSubject.value,
                        user: this.mapFirebaseUser(user)
                    });
                }
            }
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            throw new Error(errorMessage);
        }
    }

    private updateAuthState(state: AuthState): void {
        this.authStateSubject.next(state);
    }

    private mapFirebaseUser(firebaseUser: NativeScriptFirebaseUser): User {
        return {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoUri: firebaseUser.photoUri || undefined,
            createdAt: firebaseUser.metadata.creationDate,
            lastLoginAt: firebaseUser.metadata.lastSignInDate,
            preferences: {
                theme: 'light',
                notifications: {
                    pushEnabled: true,
                    emailEnabled: true,
                    bookClubUpdates: true,
                    reviewResponses: true,
                    newFollowers: true
                },
                privacy: {
                    profileVisibility: 'public',
                    showReadingProgress: true,
                    showReviews: true,
                    allowMessages: true
                }
            }
        };
    }
}
