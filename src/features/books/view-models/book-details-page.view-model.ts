import { Observable } from '@nativescript/core';
import { Utils } from '@nativescript/core';
import { BookService } from '../services/book.service';
import { Book, UserBook, ReadingStatus } from '../models/book.model';
import { NavigationService } from '../../../core/services/navigation.service';

export class BookDetailsPageViewModel extends Observable {
    private bookService: BookService;
    private _book: Book | null = null;
    private _userBook: UserBook | null = null;
    private _isLoading: boolean = false;
    private _errorMessage: string = '';
    private _readingProgress: number = 0;
    private _isFavorite: boolean = false;
    private _readingStatusText: string = 'Add to Library';

    constructor(private bookId: string) {
        super();
        this.bookService = BookService.getInstance();
        this.loadBookDetails();
    }

    // Getters and Setters
    get book(): Book | null {
        return this._book;
    }

    set book(value: Book | null) {
        if (this._book !== value) {
            this._book = value;
            this.notifyPropertyChange('book', value);
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

    get readingProgress(): number {
        return this._readingProgress;
    }

    set readingProgress(value: number) {
        if (this._readingProgress !== value) {
            this._readingProgress = value;
            this.notifyPropertyChange('readingProgress', value);
        }
    }

    get isFavorite(): boolean {
        return this._isFavorite;
    }

    set isFavorite(value: boolean) {
        if (this._isFavorite !== value) {
            this._isFavorite = value;
            this.notifyPropertyChange('isFavorite', value);
        }
    }

    get readingStatusText(): string {
        return this._readingStatusText;
    }

    set readingStatusText(value: string) {
        if (this._readingStatusText !== value) {
            this._readingStatusText = value;
            this.notifyPropertyChange('readingStatusText', value);
        }
    }

    get isReading(): boolean {
        return this._userBook?.status === ReadingStatus.Reading;
    }

    // Event Handlers
    public async onToggleFavorite(): Promise<void> {
        try {
            this.isFavorite = !this.isFavorite;
            // TODO: Implement favorite toggle in backend
        } catch (error) {
            console.error('Error toggling favorite:', error);
            this.isFavorite = !this.isFavorite; // Revert on error
        }
    }

    public async onChangeReadingStatus(): Promise<void> {
        try {
            if (!this._book) return;

            if (!this._userBook) {
                // Add to library
                this._userBook = await this.bookService.addBookToLibrary(this._book);
                this.updateReadingStatusText(this._userBook.status);
            } else {
                // Show status selection dialog
                // TODO: Implement status selection dialog
                const newStatus = ReadingStatus.Reading; // Temporary default
                this._userBook = await this.bookService.updateBookStatus(this.bookId, newStatus);
                this.updateReadingStatusText(newStatus);
            }
        } catch (error) {
            console.error('Error changing reading status:', error);
            // TODO: Show error message to user
        }
    }

    public async onUpdateProgress(): Promise<void> {
        try {
            // TODO: Show progress update dialog
            const newProgress = 50; // Temporary value
            if (this._userBook) {
                this._userBook = await this.bookService.updateReadingProgress(this.bookId, newProgress);
                this.readingProgress = newProgress;
            }
        } catch (error) {
            console.error('Error updating progress:', error);
            // TODO: Show error message to user
        }
    }

    public async onAddToCollection(): Promise<void> {
        // TODO: Navigate to collection selection page
        NavigationService.navigate('books/collections', { bookId: this.bookId });
    }

    public onPreviewTap(): void {
        if (this._book?.previewLink) {
            Utils.openUrl(this._book.previewLink);
        }
    }

    public onInfoTap(): void {
        if (this._book?.infoLink) {
            Utils.openUrl(this._book.infoLink);
        }
    }

    public onRetry(): void {
        this.loadBookDetails();
    }

    // Private Methods
    private async loadBookDetails(): Promise<void> {
        try {
            this.isLoading = true;
            this.errorMessage = '';

            // Load book details
            this._book = await this.bookService.getBookById(this.bookId);
            this.notifyPropertyChange('book', this._book);

            // Load user's book data if exists
            this._userBook = await this.bookService.getUserBook(this.bookId);
            if (this._userBook) {
                this.readingProgress = this._userBook.progress;
                this.updateReadingStatusText(this._userBook.status);
            }

            // TODO: Load favorite status from user preferences
            this.isFavorite = false;

        } catch (error) {
            console.error('Error loading book details:', error);
            this.errorMessage = 'Failed to load book details. Please try again.';
        } finally {
            this.isLoading = false;
        }
    }

    private updateReadingStatusText(status: ReadingStatus): void {
        switch (status) {
            case ReadingStatus.ToRead:
                this.readingStatusText = 'Want to Read';
                break;
            case ReadingStatus.Reading:
                this.readingStatusText = 'Currently Reading';
                break;
            case ReadingStatus.Completed:
                this.readingStatusText = 'Completed';
                break;
            case ReadingStatus.OnHold:
                this.readingStatusText = 'On Hold';
                break;
            case ReadingStatus.Dropped:
                this.readingStatusText = 'Dropped';
                break;
            default:
                this.readingStatusText = 'Add to Library';
        }
    }
}
