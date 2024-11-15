import { Observable, BehaviorSubject } from 'rxjs';
import { GoogleBooksService } from './google-books.service';
import { AuthService } from '../../auth/services/auth.service';
import { 
    Book, 
    UserBook, 
    BookSearchParams, 
    BookSearchResult,
    ReadingStatus,
    BookCollection,
    ReadingProgress,
    ReadingStats
} from '../models/book.model';

export class BookService {
    private static instance: BookService;
    private googleBooksService: GoogleBooksService;
    private authService: AuthService;
    private currentlyReadingSubject: BehaviorSubject<UserBook[]>;
    private readingStatsSubject: BehaviorSubject<ReadingStats>;

    private constructor() {
        this.googleBooksService = GoogleBooksService.getInstance();
        this.authService = AuthService.getInstance();
        this.currentlyReadingSubject = new BehaviorSubject<UserBook[]>([]);
        this.readingStatsSubject = new BehaviorSubject<ReadingStats>(this.getInitialReadingStats());
    }

    public static getInstance(): BookService {
        if (!BookService.instance) {
            BookService.instance = new BookService();
        }
        return BookService.instance;
    }

    // Book Search Operations
    public async searchBooks(params: BookSearchParams): Promise<BookSearchResult> {
        return this.googleBooksService.searchBooks(params);
    }

    public async getBookById(bookId: string): Promise<Book> {
        return this.googleBooksService.getBookById(bookId);
    }

    // User Book Operations
    public async addBookToLibrary(book: Book, status: ReadingStatus = ReadingStatus.ToRead): Promise<UserBook> {
        const user = this.authService.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated to add books');
        }

        const userBook: UserBook = {
            ...book,
            userId: user.id,
            status,
            progress: 0,
            addedDate: new Date(),
            lastUpdated: new Date(),
            collections: []
        };

        // TODO: Save to backend/database
        await this.saveUserBook(userBook);

        if (status === ReadingStatus.Reading) {
            const currentlyReading = this.currentlyReadingSubject.value;
            this.currentlyReadingSubject.next([...currentlyReading, userBook]);
        }

        return userBook;
    }

    public async updateBookStatus(bookId: string, status: ReadingStatus): Promise<UserBook> {
        const userBook = await this.getUserBook(bookId);
        if (!userBook) {
            throw new Error('Book not found in user library');
        }

        const updatedBook: UserBook = {
            ...userBook,
            status,
            lastUpdated: new Date()
        };

        // TODO: Save to backend/database
        await this.saveUserBook(updatedBook);

        // Update currently reading list if necessary
        if (status === ReadingStatus.Reading) {
            const currentlyReading = this.currentlyReadingSubject.value;
            this.currentlyReadingSubject.next([...currentlyReading, updatedBook]);
        } else if (userBook.status === ReadingStatus.Reading) {
            const currentlyReading = this.currentlyReadingSubject.value
                .filter(book => book.id !== bookId);
            this.currentlyReadingSubject.next(currentlyReading);
        }

        return updatedBook;
    }

    public async updateReadingProgress(bookId: string, progress: number): Promise<UserBook> {
        const userBook = await this.getUserBook(bookId);
        if (!userBook) {
            throw new Error('Book not found in user library');
        }

        const updatedBook: UserBook = {
            ...userBook,
            progress,
            lastUpdated: new Date()
        };

        // TODO: Save to backend/database
        await this.saveUserBook(updatedBook);

        // Update reading stats
        await this.updateReadingStats();

        return updatedBook;
    }

    // Collections Management
    public async createCollection(name: string, description?: string): Promise<BookCollection> {
        const user = this.authService.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated to create collections');
        }

        const collection: BookCollection = {
            id: Date.now().toString(), // TODO: Use proper ID generation
            userId: user.id,
            name,
            description,
            isPublic: false,
            books: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // TODO: Save to backend/database
        await this.saveCollection(collection);

        return collection;
    }

    public async addBookToCollection(bookId: string, collectionId: string): Promise<void> {
        const collection = await this.getCollection(collectionId);
        if (!collection) {
            throw new Error('Collection not found');
        }

        const userBook = await this.getUserBook(bookId);
        if (!userBook) {
            throw new Error('Book not found in user library');
        }

        if (!collection.books.includes(bookId)) {
            collection.books.push(bookId);
            collection.updatedAt = new Date();
            await this.saveCollection(collection);
        }

        if (!userBook.collections.includes(collectionId)) {
            userBook.collections.push(collectionId);
            userBook.lastUpdated = new Date();
            await this.saveUserBook(userBook);
        }
    }

    // Observables
    public get currentlyReading$(): Observable<UserBook[]> {
        return this.currentlyReadingSubject.asObservable();
    }

    public get readingStats$(): Observable<ReadingStats> {
        return this.readingStatsSubject.asObservable();
    }

    // Private Helper Methods
    private async getUserBook(bookId: string): Promise<UserBook | null> {
        // TODO: Implement backend/database fetch
        return null;
    }

    private async saveUserBook(book: UserBook): Promise<void> {
        // TODO: Implement backend/database save
    }

    private async getCollection(collectionId: string): Promise<BookCollection | null> {
        // TODO: Implement backend/database fetch
        return null;
    }

    private async saveCollection(collection: BookCollection): Promise<void> {
        // TODO: Implement backend/database save
    }

    private async updateReadingStats(): Promise<void> {
        // TODO: Implement reading stats calculation
        const stats = this.getInitialReadingStats();
        this.readingStatsSubject.next(stats);
    }

    private getInitialReadingStats(): ReadingStats {
        return {
            totalBooksRead: 0,
            totalPagesRead: 0,
            totalMinutesRead: 0,
            averagePagesPerDay: 0,
            averageMinutesPerDay: 0,
            longestReadingStreak: 0,
            currentReadingStreak: 0,
            booksReadThisYear: 0,
            booksReadThisMonth: 0,
            favoriteGenres: [],
            readingGoals: {
                yearly: {
                    target: 50,
                    current: 0
                },
                monthly: {
                    target: 4,
                    current: 0
                }
            }
        };
    }
}
