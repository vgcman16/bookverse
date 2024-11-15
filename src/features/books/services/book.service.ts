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
    private userBooks: Map<string, UserBook> = new Map();
    private collections: Map<string, BookCollection> = new Map();

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

        if (progress < 0 || progress > 100) {
            throw new Error('Progress must be between 0 and 100');
        }

        const updatedBook: UserBook = {
            ...userBook,
            progress,
            lastUpdated: new Date(),
            // If book is completed, update status
            status: progress === 100 ? ReadingStatus.Completed : userBook.status
        };

        await this.saveUserBook(updatedBook);
        await this.updateReadingStats();

        // Update currently reading list if book is completed
        if (progress === 100 && userBook.status === ReadingStatus.Reading) {
            const currentlyReading = this.currentlyReadingSubject.value
                .filter(book => book.id !== bookId);
            this.currentlyReadingSubject.next(currentlyReading);
        }

        return updatedBook;
    }

    // Collection Operations
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

        await this.saveCollection(collection);
        return collection;
    }

    public async getCollection(collectionId: string): Promise<BookCollection | null> {
        // TODO: Implement backend/database fetch
        return this.collections.get(collectionId) || null;
    }

    public async updateCollection(collection: BookCollection): Promise<BookCollection> {
        const existingCollection = await this.getCollection(collection.id);
        if (!existingCollection) {
            throw new Error('Collection not found');
        }

        const updatedCollection = {
            ...collection,
            updatedAt: new Date()
        };

        await this.saveCollection(updatedCollection);
        return updatedCollection;
    }

    public async deleteCollection(collectionId: string): Promise<void> {
        const collection = await this.getCollection(collectionId);
        if (!collection) {
            throw new Error('Collection not found');
        }

        // Remove collection from all books
        for (const bookId of collection.books) {
            const userBook = await this.getUserBook(bookId);
            if (userBook) {
                userBook.collections = userBook.collections.filter(id => id !== collectionId);
                await this.saveUserBook(userBook);
            }
        }

        this.collections.delete(collectionId);
        // TODO: Implement backend/database delete
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

    public async removeBookFromCollection(bookId: string, collectionId: string): Promise<void> {
        const collection = await this.getCollection(collectionId);
        if (!collection) {
            throw new Error('Collection not found');
        }

        const userBook = await this.getUserBook(bookId);
        if (!userBook) {
            throw new Error('Book not found in user library');
        }

        collection.books = collection.books.filter(id => id !== bookId);
        collection.updatedAt = new Date();
        await this.saveCollection(collection);

        userBook.collections = userBook.collections.filter(id => id !== collectionId);
        userBook.lastUpdated = new Date();
        await this.saveUserBook(userBook);
    }

    public async getUserBooks(): Promise<UserBook[]> {
        // TODO: Implement backend/database fetch
        return Array.from(this.userBooks.values());
    }

    public async getUserBook(bookId: string): Promise<UserBook | null> {
        // TODO: Implement backend/database fetch
        return this.userBooks.get(bookId) || null;
    }

    // Observables
    public get currentlyReading$(): Observable<UserBook[]> {
        return this.currentlyReadingSubject.asObservable();
    }

    public get readingStats$(): Observable<ReadingStats> {
        return this.readingStatsSubject.asObservable();
    }

    // Private Helper Methods
    private async saveUserBook(book: UserBook): Promise<void> {
        this.userBooks.set(book.id, book);
        // TODO: Implement backend/database save
    }

    private async saveCollection(collection: BookCollection): Promise<void> {
        this.collections.set(collection.id, collection);
        // TODO: Implement backend/database save
    }

    private async updateReadingStats(): Promise<void> {
        const userBooks = await this.getUserBooks();
        const stats: ReadingStats = {
            totalBooksRead: userBooks.filter(book => book.status === ReadingStatus.Completed).length,
            totalPagesRead: userBooks.reduce((total, book) => total + (book.pageCount || 0) * (book.progress / 100), 0),
            totalMinutesRead: 0, // TODO: Implement reading time tracking
            averagePagesPerDay: 0, // TODO: Calculate based on reading history
            averageMinutesPerDay: 0, // TODO: Calculate based on reading history
            longestReadingStreak: 0, // TODO: Implement reading streaks
            currentReadingStreak: 0, // TODO: Implement reading streaks
            booksReadThisYear: userBooks.filter(book => 
                book.status === ReadingStatus.Completed && 
                book.lastUpdated.getFullYear() === new Date().getFullYear()
            ).length,
            booksReadThisMonth: userBooks.filter(book => 
                book.status === ReadingStatus.Completed && 
                book.lastUpdated.getMonth() === new Date().getMonth()
            ).length,
            favoriteGenres: this.calculateFavoriteGenres(userBooks),
            readingGoals: {
                yearly: {
                    target: 50,
                    current: userBooks.filter(book => 
                        book.status === ReadingStatus.Completed && 
                        book.lastUpdated.getFullYear() === new Date().getFullYear()
                    ).length
                },
                monthly: {
                    target: 4,
                    current: userBooks.filter(book => 
                        book.status === ReadingStatus.Completed && 
                        book.lastUpdated.getMonth() === new Date().getMonth()
                    ).length
                }
            }
        };

        this.readingStatsSubject.next(stats);
    }

    private calculateFavoriteGenres(books: UserBook[]): Array<{ genre: string; count: number }> {
        const genreCounts = new Map<string, number>();

        books.forEach(book => {
            book.categories?.forEach(category => {
                genreCounts.set(category, (genreCounts.get(category) || 0) + 1);
            });
        });

        return Array.from(genreCounts.entries())
            .map(([genre, count]) => ({ genre, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5 genres
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
