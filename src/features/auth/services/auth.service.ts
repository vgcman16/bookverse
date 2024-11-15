import { Observable, BehaviorSubject } from 'rxjs';
import { User, UserCredentials, UserRegistration, UserUpdate, AuthState, DEFAULT_USER_PREFERENCES } from '../models/user.model';

export class AuthService {
    private static instance: AuthService;
    private currentUser: User | null = null;
    private users: Map<string, User> = new Map();
    private authState: AuthState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
    };
    private authStateSubject: BehaviorSubject<AuthState>;

    private constructor() {
        this.authStateSubject = new BehaviorSubject<AuthState>(this.authState);
        this.initializeMockData();
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    public async signIn(credentials: UserCredentials): Promise<User> {
        this.updateAuthState({ isLoading: true, error: null });

        try {
            const user = Array.from(this.users.values()).find(u => 
                u.email === credentials.email && 
                (u as any).password === credentials.password
            );

            if (!user) {
                throw new Error('Invalid email or password');
            }

            this.currentUser = user;
            this.updateAuthState({
                user,
                isAuthenticated: true,
                isLoading: false
            });

            return user;
        } catch (error) {
            this.updateAuthState({
                isLoading: false,
                error: error instanceof Error ? error.message : 'An error occurred'
            });
            throw error;
        }
    }

    public async signUp(registration: UserRegistration): Promise<User> {
        this.updateAuthState({ isLoading: true, error: null });

        try {
            if (Array.from(this.users.values()).some(u => u.email === registration.email)) {
                throw new Error('Email already in use');
            }

            const newUser: User = {
                id: Date.now().toString(),
                email: registration.email,
                displayName: registration.displayName,
                photoURL: registration.photoURL || 'assets/images/default-avatar.png',
                bio: registration.bio || '',
                createdAt: new Date(),
                updatedAt: new Date(),
                preferences: DEFAULT_USER_PREFERENCES,
                stats: {
                    totalBooksRead: 0,
                    totalPagesRead: 0,
                    averageRating: 0,
                    reviewsWritten: 0,
                    challengesCompleted: 0,
                    readingStreak: 0
                }
            };

            this.users.set(newUser.id, newUser);
            this.currentUser = newUser;
            this.updateAuthState({
                user: newUser,
                isAuthenticated: true,
                isLoading: false
            });

            return newUser;
        } catch (error) {
            this.updateAuthState({
                isLoading: false,
                error: error instanceof Error ? error.message : 'An error occurred'
            });
            throw error;
        }
    }

    public async signOut(): Promise<void> {
        this.currentUser = null;
        this.updateAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
        });
    }

    public async updateProfile(updates: Partial<User>): Promise<User> {
        if (!this.currentUser) {
            throw new Error('No user is currently logged in');
        }

        // Ensure preferences are properly merged
        const updatedPreferences = updates.preferences
            ? {
                ...this.currentUser.preferences,
                ...updates.preferences,
                notifications: {
                    ...this.currentUser.preferences?.notifications,
                    ...updates.preferences.notifications
                },
                privacy: {
                    ...this.currentUser.preferences?.privacy,
                    ...updates.preferences.privacy
                }
            }
            : this.currentUser.preferences;

        const updatedUser: User = {
            ...this.currentUser,
            ...updates,
            preferences: updatedPreferences,
            updatedAt: new Date()
        };

        this.users.set(updatedUser.id, updatedUser);
        this.currentUser = updatedUser;
        this.updateAuthState({
            user: updatedUser,
            isAuthenticated: true
        });

        return updatedUser;
    }

    public getCurrentUser(): User | null {
        return this.currentUser;
    }

    public async getUserById(userId: string): Promise<User | null> {
        return this.users.get(userId) || null;
    }

    public async searchUsers(query: string): Promise<User[]> {
        const searchTerm = query.toLowerCase();
        return Array.from(this.users.values()).filter(user =>
            user.displayName.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        );
    }

    public getIsAuthenticated(): boolean {
        return this.authState.isAuthenticated;
    }

    public get authState$(): Observable<AuthState> {
        return this.authStateSubject.asObservable();
    }

    private updateAuthState(updates: Partial<AuthState>): void {
        this.authState = {
            ...this.authState,
            ...updates
        };
        this.authStateSubject.next(this.authState);
    }

    private initializeMockData(): void {
        const mockUsers: Array<User & { password: string }> = [
            {
                id: '1',
                email: 'john@example.com',
                password: 'password123',
                displayName: 'John Doe',
                photoURL: 'https://example.com/john.jpg',
                bio: 'Avid reader and book enthusiast',
                favoriteGenres: ['Fiction', 'Mystery', 'Science Fiction'],
                favoriteAuthors: ['J.K. Rowling', 'Stephen King'],
                readingGoal: 52,
                booksRead: 12,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01'),
                preferences: DEFAULT_USER_PREFERENCES,
                stats: {
                    totalBooksRead: 45,
                    totalPagesRead: 12350,
                    averageRating: 4.2,
                    reviewsWritten: 28,
                    challengesCompleted: 3,
                    readingStreak: 15
                }
            },
            {
                id: '2',
                email: 'jane@example.com',
                password: 'password456',
                displayName: 'Jane Smith',
                photoURL: 'https://example.com/jane.jpg',
                bio: 'Book reviewer and literature lover',
                favoriteGenres: ['Romance', 'Fantasy', 'Historical Fiction'],
                favoriteAuthors: ['Jane Austen', 'George R.R. Martin'],
                readingGoal: 24,
                booksRead: 8,
                createdAt: new Date('2023-01-02'),
                updatedAt: new Date('2023-01-02'),
                preferences: DEFAULT_USER_PREFERENCES,
                stats: {
                    totalBooksRead: 32,
                    totalPagesRead: 8750,
                    averageRating: 4.5,
                    reviewsWritten: 15,
                    challengesCompleted: 2,
                    readingStreak: 8
                }
            }
        ];

        mockUsers.forEach(user => this.users.set(user.id, user));
    }
}
