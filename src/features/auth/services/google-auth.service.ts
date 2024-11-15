import { firebase } from '@nativescript/firebase-core';
import { Auth, User as FirebaseUser, UserCredential, GoogleAuthProvider } from '@nativescript/firebase-auth';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Application, Device, isAndroid, isIOS } from '@nativescript/core';
import { AuthService } from './auth.service';

// Replace these with your actual client IDs
const IOS_CLIENT_ID = '{{YOUR_IOS_CLIENT_ID}}';
const WEB_CLIENT_ID = '{{YOUR_WEB_CLIENT_ID}}';

interface GoogleSignInResult {
    idToken: string;
    accessToken: string;
}

interface AndroidGoogleSignIn {
    GoogleSignIn: any;
    GoogleSignInOptions: any;
}

interface iOSGoogleSignIn {
    GIDSignIn: any;
    GIDConfiguration: any;
}

declare const com: any;
declare const GIDSignIn: any;
declare const GIDConfiguration: any;
declare const UIApplication: any;
declare const UIWindowScene: any;

export class GoogleAuthService {
    private static instance: GoogleAuthService;
    private auth: Auth;
    private authService: AuthService;

    private constructor() {
        this.auth = firebase().auth();
        this.authService = AuthService.getInstance();
        this.initializeGoogleSignIn();
    }

    public static getInstance(): GoogleAuthService {
        if (!GoogleAuthService.instance) {
            GoogleAuthService.instance = new GoogleAuthService();
        }
        return GoogleAuthService.instance;
    }

    private async initializeGoogleSignIn(): Promise<void> {
        if (isIOS) {
            // iOS-specific initialization
            const signInConfig = GIDConfiguration.alloc().initWithClientID(IOS_CLIENT_ID);
            GIDSignIn.sharedInstance.configuration = signInConfig;
        }
    }

    public signIn(): Observable<FirebaseUser> {
        return from(this.signInWithGoogle()).pipe(
            map(userCredential => userCredential.user),
            catchError(error => {
                console.error('Google sign-in error:', error);
                return throwError(() => new Error(this.getErrorMessage(error)));
            })
        );
    }

    private async signInWithGoogle(): Promise<UserCredential> {
        try {
            // Get Google credentials using native sign-in
            const result = await this.nativeGoogleSignIn();

            // Create Firebase credential
            const credential = GoogleAuthProvider.credential(
                result.idToken,
                result.accessToken
            );

            // Sign in to Firebase with credential
            const userCredential = await this.auth.signInWithCredential(credential);

            // Update user profile if needed
            if (userCredential.user && !userCredential.user.displayName) {
                await userCredential.user.updateProfile({
                    displayName: userCredential.user.email?.split('@')[0] || '',
                    photoUri: ''
                });
            }

            return userCredential;
        } catch (error) {
            throw error;
        }
    }

    private async nativeGoogleSignIn(): Promise<GoogleSignInResult> {
        if (isAndroid) {
            const activity = Application.android.foregroundActivity || Application.android.startActivity;
            const gso = new com.google.android.gms.auth.api.signin.GoogleSignInOptions.Builder(
                com.google.android.gms.auth.api.signin.GoogleSignInOptions.DEFAULT_SIGN_IN
            )
                .requestIdToken(WEB_CLIENT_ID)
                .requestEmail()
                .build();

            const googleSignInClient = com.google.android.gms.auth.api.signin.GoogleSignIn.getClient(
                activity,
                gso
            );

            const signInIntent = googleSignInClient.getSignInIntent();

            return new Promise<GoogleSignInResult>((resolve, reject) => {
                const onActivityResult = (args: any) => {
                    if (args.requestCode === 123) {
                        Application.android.off(Application.AndroidApplication.activityResultEvent, onActivityResult);

                        const task = com.google.android.gms.auth.api.signin.GoogleSignIn.getSignedInAccountFromIntent(args.intent);
                        task.addOnSuccessListener(new com.google.android.gms.tasks.OnSuccessListener({
                            onSuccess: (account: any) => {
                                resolve({
                                    idToken: account.getIdToken(),
                                    accessToken: ''
                                });
                            }
                        }))
                        .addOnFailureListener(new com.google.android.gms.tasks.OnFailureListener({
                            onFailure: (error: any) => {
                                reject(new Error(error.getMessage()));
                            }
                        }));
                    }
                };

                Application.android.on(Application.AndroidApplication.activityResultEvent, onActivityResult);
                activity.startActivityForResult(signInIntent, 123);
            });
        } else if (isIOS) {
            return new Promise<GoogleSignInResult>((resolve, reject) => {
                const signInConfig = GIDConfiguration.alloc().initWithClientID(WEB_CLIENT_ID);
                const windowScene = UIApplication.sharedApplication.connectedScenes.allObjects
                    .filter((scene: any) => scene instanceof UIWindowScene)
                    .pop();
                
                GIDSignIn.sharedInstance.signInWithConfigurationPresentingViewControllerCompletion(
                    signInConfig,
                    windowScene.keyWindow.rootViewController,
                    (user: any, error: any) => {
                        if (error) {
                            reject(new Error(error.localizedDescription));
                            return;
                        }
                        
                        resolve({
                            idToken: user.authentication.idToken,
                            accessToken: user.authentication.accessToken
                        });
                    }
                );
            });
        } else {
            throw new Error('Platform not supported');
        }
    }

    private getErrorMessage(error: any): string {
        switch (error.code) {
            case 'auth/account-exists-with-different-credential':
                return 'An account already exists with the same email address but different sign-in credentials.';
            case 'auth/invalid-credential':
                return 'Invalid credentials. Please try again.';
            case 'auth/operation-not-allowed':
                return 'Google sign-in is not enabled. Please contact support.';
            case 'auth/user-disabled':
                return 'This account has been disabled. Please contact support.';
            case 'auth/user-not-found':
                return 'No account found with these credentials.';
            case 'sign_in_cancelled':
                return 'Google sign-in was cancelled.';
            case 'sign_in_failed':
                return 'Google sign-in failed. Please try again.';
            case 'play_services_not_available':
                return 'Google Play Services is not available on this device.';
            default:
                return 'An error occurred during sign-in. Please try again.';
        }
    }

    public getCurrentUser(): Promise<FirebaseUser | null> {
        return Promise.resolve(this.auth.currentUser);
    }

    public revokeAccess(): Observable<void> {
        return from(this.auth.signOut()).pipe(
            map(() => undefined),
            tap(() => this.authService.signOut()),
            catchError(error => {
                console.error('Failed to revoke access:', error);
                return throwError(() => new Error('Failed to revoke access. Please try again.'));
            })
        );
    }
}
