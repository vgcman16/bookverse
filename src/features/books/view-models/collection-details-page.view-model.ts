import { Observable } from '@nativescript/core';
import { BookService } from '../services/book.service';
import { Book, BookCollection } from '../models/book.model';
import { NavigationService } from '../../../core/services/navigation.service';

interface AvailableBook extends Book {
    isSelected: boolean;
}

export class CollectionDetailsViewModel extends Observable {
    private bookService: BookService;
    private _collection: BookCollection | null = null;
    private _books: Book[] = [];
    private _availableBooks: AvailableBook[] = [];
    private _selectedBooks: Book[] = [];
    private _searchQuery: string = '';
    private _isLoading: boolean = false;
    private _errorMessage: string = '';
    private _emptyStateMessage: string = 'Add books to your collection';
    private _isShowingOptions: boolean = false;
    private _isAddingBooks: boolean = false;

    constructor(private collectionId: string) {
        super();
        this.bookService = BookService.getInstance();
        this.loadCollection();
    }

    // Getters and Setters
    get collection(): BookCollection | null {
        return this._collection;
    }

    set collection(value: BookCollection | null) {
        if (this._collection !== value) {
            this._collection = value;
            this.notifyPropertyChange('collection', value);
        }
    }

    get books(): Book[] {
        return this._books;
    }

    set books(value: Book[]) {
        if (this._books !== value) {
            this._books = value;
            this.notifyPropertyChange('books', value);
        }
    }

    get availableBooks(): AvailableBook[] {
        return this._availableBooks;
    }

    set availableBooks(value: AvailableBook[]) {
        if (this._availableBooks !== value) {
            this._availableBooks = value;
            this.notifyPropertyChange('availableBooks', value);
        }
    }

    get selectedBooks(): Book[] {
        return this._selectedBooks;
    }

    get searchQuery(): string {
        return this._searchQuery;
    }

    set searchQuery(value: string) {
        if (this._searchQuery !== value) {
            this._searchQuery = value;
            this.notifyPropertyChange('searchQuery', value);
            this.filterBooks();
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

    get emptyStateMessage(): string {
        return this._emptyStateMessage;
    }

    set emptyStateMessage(value: string) {
        if (this._emptyStateMessage !== value) {
            this._emptyStateMessage = value;
            this.notifyPropertyChange('emptyStateMessage', value);
        }
    }

    get isShowingOptions(): boolean {
        return this._isShowingOptions;
    }

    set isShowingOptions(value: boolean) {
        if (this._isShowingOptions !== value) {
            this._isShowingOptions = value;
            this.notifyPropertyChange('isShowingOptions', value);
        }
    }

    get isAddingBooks(): boolean {
        return this._isAddingBooks;
    }

    set isAddingBooks(value: boolean) {
        if (this._isAddingBooks !== value) {
            this._isAddingBooks = value;
            this.notifyPropertyChange('isAddingBooks', value);
        }
    }

    // Event Handlers
    public onSearch(): void {
        this.filterBooks();
    }

    public onClearSearch(): void {
        this.searchQuery = '';
    }

    public onBookTap(args: any): void {
        const book = this.books[args.index];
        NavigationService.navigate('books/details', { bookId: book.id });
    }

    public async onRemoveBook(args: any): Promise<void> {
        try {
            const book = args.object.bindingContext;
            await this.bookService.removeBookFromCollection(book.id, this.collectionId);
            this.books = this.books.filter(b => b.id !== book.id);
        } catch (error) {
            console.error('Error removing book:', error);
            this.errorMessage = 'Failed to remove book from collection';
        }
    }

    public onShowOptions(): void {
        this.isShowingOptions = true;
    }

    public onHideOptions(): void {
        this.isShowingOptions = false;
    }

    public onEditCollection(): void {
        this.isShowingOptions = false;
        // TODO: Navigate to edit collection page
    }

    public async onTogglePrivacy(): Promise<void> {
        try {
            if (!this.collection) return;

            const updatedCollection = {
                ...this.collection,
                isPublic: !this.collection.isPublic
            };

            await this.bookService.updateCollection(updatedCollection);
            this.collection = updatedCollection;
            this.isShowingOptions = false;
        } catch (error) {
            console.error('Error updating collection privacy:', error);
            this.errorMessage = 'Failed to update collection privacy';
        }
    }

    public async onDeleteCollection(): Promise<void> {
        try {
            await this.bookService.deleteCollection(this.collectionId);
            NavigationService.goBack();
        } catch (error) {
            console.error('Error deleting collection:', error);
            this.errorMessage = 'Failed to delete collection';
        }
    }

    public async onAddBooks(): Promise<void> {
        try {
            // Load user's books that aren't in this collection
            const userBooks = await this.bookService.getUserBooks();
            this.availableBooks = userBooks
                .filter(book => !this.books.some(b => b.id === book.id))
                .map(book => ({ ...book, isSelected: false }));
            
            this.isAddingBooks = true;
        } catch (error) {
            console.error('Error loading available books:', error);
            this.errorMessage = 'Failed to load available books';
        }
    }

    public onToggleBookSelection(args: any): void {
        const book = args.object.bindingContext;
        const index = this.availableBooks.findIndex(b => b.id === book.id);
        
        if (index !== -1) {
            this.availableBooks[index].isSelected = !this.availableBooks[index].isSelected;
            this.notifyPropertyChange('availableBooks', this.availableBooks);
            
            this._selectedBooks = this.availableBooks
                .filter(b => b.isSelected)
                .map(({ isSelected, ...book }) => book);
            this.notifyPropertyChange('selectedBooks', this._selectedBooks);
        }
    }

    public onCancelAddBooks(): void {
        this.isAddingBooks = false;
        this.availableBooks = [];
        this._selectedBooks = [];
    }

    public async onConfirmAddBooks(): Promise<void> {
        try {
            for (const book of this._selectedBooks) {
                await this.bookService.addBookToCollection(book.id, this.collectionId);
            }

            // Refresh books list
            await this.loadCollection();
            this.onCancelAddBooks();
        } catch (error) {
            console.error('Error adding books:', error);
            this.errorMessage = 'Failed to add books to collection';
        }
    }

    public onRetry(): void {
        this.loadCollection();
    }

    // Private Methods
    private async loadCollection(): Promise<void> {
        try {
            this.isLoading = true;
            this.errorMessage = '';

            this.collection = await this.bookService.getCollection(this.collectionId);
            if (!this.collection) {
                throw new Error('Collection not found');
            }

            // Load books in collection
            const bookPromises = this.collection.books.map(bookId => 
                this.bookService.getBookById(bookId)
            );
            this.books = await Promise.all(bookPromises);

            if (this.books.length === 0) {
                this.emptyStateMessage = 'Add books to your collection';
            }

        } catch (error) {
            console.error('Error loading collection:', error);
            this.errorMessage = 'Failed to load collection';
        } finally {
            this.isLoading = false;
        }
    }

    private filterBooks(): void {
        if (!this.searchQuery.trim()) {
            this.loadCollection();
            return;
        }

        const query = this.searchQuery.toLowerCase();
        const filtered = this.books.filter(book => 
            book.title.toLowerCase().includes(query) ||
            book.authors.some(author => author.toLowerCase().includes(query))
        );

        if (filtered.length === 0) {
            this.emptyStateMessage = 'No books found matching your search';
        }

        this.books = filtered;
    }
}
