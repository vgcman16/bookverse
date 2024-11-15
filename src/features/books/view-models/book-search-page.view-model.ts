import { Observable } from '@nativescript/core';
import { BookService } from '../services/book.service';
import { Book, BookSearchParams } from '../models/book.model';
import { NavigationService } from '../../../core/services/navigation.service';

export class BookSearchPageViewModel extends Observable {
    private bookService: BookService;
    private _searchQuery: string = '';
    private _searchResults: Book[] = [];
    private _isLoading: boolean = false;
    private _errorMessage: string = '';
    private _activeFilter: string = '';
    private _emptyStateMessage: string = 'Search for books by title, author, or ISBN';
    private _canLoadMore: boolean = false;
    private currentPage: number = 0;
    private readonly pageSize: number = 20;

    constructor() {
        super();
        this.bookService = BookService.getInstance();
    }

    // Getters and Setters
    get searchQuery(): string {
        return this._searchQuery;
    }

    set searchQuery(value: string) {
        if (this._searchQuery !== value) {
            this._searchQuery = value;
            this.notifyPropertyChange('searchQuery', value);
        }
    }

    get searchResults(): Book[] {
        return this._searchResults;
    }

    set searchResults(value: Book[]) {
        if (this._searchResults !== value) {
            this._searchResults = value;
            this.notifyPropertyChange('searchResults', value);
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

    get activeFilter(): string {
        return this._activeFilter;
    }

    set activeFilter(value: string) {
        if (this._activeFilter !== value) {
            this._activeFilter = value;
            this.notifyPropertyChange('activeFilter', value);
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

    get canLoadMore(): boolean {
        return this._canLoadMore;
    }

    set canLoadMore(value: boolean) {
        if (this._canLoadMore !== value) {
            this._canLoadMore = value;
            this.notifyPropertyChange('canLoadMore', value);
        }
    }

    // Event Handlers
    public async onSearch(): Promise<void> {
        if (!this.searchQuery.trim()) {
            return;
        }

        try {
            this.isLoading = true;
            this.errorMessage = '';
            this.currentPage = 0;

            const searchParams = this.buildSearchParams();
            const result = await this.bookService.searchBooks(searchParams);

            this.searchResults = result.items;
            this.canLoadMore = result.items.length === this.pageSize;
            
            if (result.items.length === 0) {
                this.emptyStateMessage = 'No books found matching your search';
            }
        } catch (error) {
            console.error('Search error:', error);
            this.errorMessage = 'Failed to search books. Please try again.';
        } finally {
            this.isLoading = false;
        }
    }

    public onFilterTap(args: any): void {
        const filter = args.object.text.toLowerCase();
        this.activeFilter = this.activeFilter === filter ? '' : filter;
        this.onSearch();
    }

    public async onLoadMore(): Promise<void> {
        if (this.isLoading) {
            return;
        }

        try {
            this.isLoading = true;
            this.currentPage++;

            const searchParams = this.buildSearchParams();
            const result = await this.bookService.searchBooks(searchParams);

            this.searchResults = [...this.searchResults, ...result.items];
            this.canLoadMore = result.items.length === this.pageSize;
        } catch (error) {
            console.error('Load more error:', error);
            this.errorMessage = 'Failed to load more books. Please try again.';
            this.currentPage--; // Revert page increment on error
        } finally {
            this.isLoading = false;
        }
    }

    public onBookTap(args: any): void {
        const book = this.searchResults[args.index];
        NavigationService.navigate('books/details', { bookId: book.id });
    }

    public onRetry(): void {
        this.errorMessage = '';
        this.onSearch();
    }

    // Helper Methods
    private buildSearchParams(): BookSearchParams {
        const params: BookSearchParams = {
            query: this.searchQuery,
            startIndex: this.currentPage * this.pageSize,
            maxResults: this.pageSize
        };

        if (this.activeFilter) {
            params.filter = {};
            switch (this.activeFilter) {
                case 'title':
                    params.filter.title = this.searchQuery;
                    break;
                case 'author':
                    params.filter.author = this.searchQuery;
                    break;
                case 'isbn':
                    params.filter.isbn = this.searchQuery;
                    break;
                case 'genre':
                    params.filter.subject = this.searchQuery;
                    break;
            }
        }

        return params;
    }
}
