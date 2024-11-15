import { Observable } from '@nativescript/core';
import { BookService } from '../services/book.service';
import { BookCollection } from '../models/book.model';
import { NavigationService } from '../../../core/services/navigation.service';

export class CollectionsPageViewModel extends Observable {
    private bookService: BookService;
    private _collections: BookCollection[] = [];
    private _searchQuery: string = '';
    private _isLoading: boolean = false;
    private _errorMessage: string = '';
    private _emptyStateMessage: string = 'Create your first collection to organize your books';
    private _isCreatingCollection: boolean = false;
    private _newCollectionName: string = '';
    private _newCollectionDescription: string = '';
    private _isNewCollectionPublic: boolean = false;

    constructor() {
        super();
        this.bookService = BookService.getInstance();
        this.loadCollections();
    }

    // Getters and Setters
    get collections(): BookCollection[] {
        return this._collections;
    }

    set collections(value: BookCollection[]) {
        if (this._collections !== value) {
            this._collections = value;
            this.notifyPropertyChange('collections', value);
        }
    }

    get searchQuery(): string {
        return this._searchQuery;
    }

    set searchQuery(value: string) {
        if (this._searchQuery !== value) {
            this._searchQuery = value;
            this.notifyPropertyChange('searchQuery', value);
            this.filterCollections();
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

    get isCreatingCollection(): boolean {
        return this._isCreatingCollection;
    }

    set isCreatingCollection(value: boolean) {
        if (this._isCreatingCollection !== value) {
            this._isCreatingCollection = value;
            this.notifyPropertyChange('isCreatingCollection', value);
        }
    }

    get newCollectionName(): string {
        return this._newCollectionName;
    }

    set newCollectionName(value: string) {
        if (this._newCollectionName !== value) {
            this._newCollectionName = value;
            this.notifyPropertyChange('newCollectionName', value);
        }
    }

    get newCollectionDescription(): string {
        return this._newCollectionDescription;
    }

    set newCollectionDescription(value: string) {
        if (this._newCollectionDescription !== value) {
            this._newCollectionDescription = value;
            this.notifyPropertyChange('newCollectionDescription', value);
        }
    }

    get isNewCollectionPublic(): boolean {
        return this._isNewCollectionPublic;
    }

    set isNewCollectionPublic(value: boolean) {
        if (this._isNewCollectionPublic !== value) {
            this._isNewCollectionPublic = value;
            this.notifyPropertyChange('isNewCollectionPublic', value);
        }
    }

    // Event Handlers
    public onSearch(): void {
        this.filterCollections();
    }

    public onClearSearch(): void {
        this.searchQuery = '';
    }

    public onCollectionTap(args: any): void {
        const collection = this.collections[args.index];
        NavigationService.navigate('books/collection-details', { collectionId: collection.id });
    }

    public onCreateCollection(): void {
        this.resetNewCollectionForm();
        this.isCreatingCollection = true;
    }

    public onCancelCreate(): void {
        this.isCreatingCollection = false;
        this.resetNewCollectionForm();
    }

    public async onConfirmCreate(): Promise<void> {
        if (!this.newCollectionName.trim()) {
            return;
        }

        try {
            this.isLoading = true;
            const collection = await this.bookService.createCollection(
                this.newCollectionName,
                this.newCollectionDescription
            );

            // Add to collections list
            this.collections = [...this.collections, collection];
            
            // Reset form and close modal
            this.isCreatingCollection = false;
            this.resetNewCollectionForm();

        } catch (error) {
            console.error('Error creating collection:', error);
            this.errorMessage = 'Failed to create collection. Please try again.';
        } finally {
            this.isLoading = false;
        }
    }

    public onRetry(): void {
        this.loadCollections();
    }

    // Private Methods
    private async loadCollections(): Promise<void> {
        try {
            this.isLoading = true;
            this.errorMessage = '';

            // TODO: Implement loading collections from backend
            this.collections = [];
            
            if (this.collections.length === 0) {
                this.emptyStateMessage = 'Create your first collection to organize your books';
            }

        } catch (error) {
            console.error('Error loading collections:', error);
            this.errorMessage = 'Failed to load collections. Please try again.';
        } finally {
            this.isLoading = false;
        }
    }

    private filterCollections(): void {
        if (!this.searchQuery.trim()) {
            this.loadCollections();
            return;
        }

        const query = this.searchQuery.toLowerCase();
        const filtered = this.collections.filter(collection => 
            collection.name.toLowerCase().includes(query) ||
            (collection.description && collection.description.toLowerCase().includes(query))
        );

        if (filtered.length === 0) {
            this.emptyStateMessage = 'No collections found matching your search';
        }

        this.collections = filtered;
    }

    private resetNewCollectionForm(): void {
        this.newCollectionName = '';
        this.newCollectionDescription = '';
        this.isNewCollectionPublic = false;
    }
}
