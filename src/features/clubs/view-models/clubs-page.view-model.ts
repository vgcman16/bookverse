import { Observable } from '@nativescript/core';
import { firstValueFrom } from 'rxjs';
import { ClubService } from '../services/club.service';
import { BookService } from '../../books/services/book.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { BookClub } from '../models/club.model';
import { AuthService } from '../../../features/auth/services/auth.service';

interface ClubViewModel extends BookClub {
    isMember: boolean;
    currentlyReadingTitle?: string;
}

export class ClubsPageViewModel extends Observable {
    private clubService: ClubService;
    private bookService: BookService;
    private authService: AuthService;
    private _clubs: ClubViewModel[] = [];
    private _searchQuery: string = '';
    private _selectedTab: 'my-clubs' | 'discover' = 'my-clubs';
    private _isLoading: boolean = false;
    private _errorMessage: string = '';
    private _isCreatingClub: boolean = false;
    private _newClubName: string = '';
    private _newClubDescription: string = '';
    private _isNewClubPublic: boolean = true;

    constructor() {
        super();
        this.clubService = ClubService.getInstance();
        this.bookService = BookService.getInstance();
        this.authService = AuthService.getInstance();
        this.initializeClubs();
        this.setupSubscriptions();
    }

    // Getters and Setters
    get clubs(): ClubViewModel[] {
        return this._clubs;
    }

    set clubs(value: ClubViewModel[]) {
        if (this._clubs !== value) {
            this._clubs = value;
            this.notifyPropertyChange('clubs', value);
        }
    }

    get searchQuery(): string {
        return this._searchQuery;
    }

    set searchQuery(value: string) {
        if (this._searchQuery !== value) {
            this._searchQuery = value;
            this.notifyPropertyChange('searchQuery', value);
            this.filterClubs();
        }
    }

    get selectedTab(): 'my-clubs' | 'discover' {
        return this._selectedTab;
    }

    set selectedTab(value: 'my-clubs' | 'discover') {
        if (this._selectedTab !== value) {
            this._selectedTab = value;
            this.notifyPropertyChange('selectedTab', value);
            this.loadClubs();
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

    get isCreatingClub(): boolean {
        return this._isCreatingClub;
    }

    set isCreatingClub(value: boolean) {
        if (this._isCreatingClub !== value) {
            this._isCreatingClub = value;
            this.notifyPropertyChange('isCreatingClub', value);
        }
    }

    get newClubName(): string {
        return this._newClubName;
    }

    set newClubName(value: string) {
        if (this._newClubName !== value) {
            this._newClubName = value;
            this.notifyPropertyChange('newClubName', value);
        }
    }

    get newClubDescription(): string {
        return this._newClubDescription;
    }

    set newClubDescription(value: string) {
        if (this._newClubDescription !== value) {
            this._newClubDescription = value;
            this.notifyPropertyChange('newClubDescription', value);
        }
    }

    get isNewClubPublic(): boolean {
        return this._isNewClubPublic;
    }

    set isNewClubPublic(value: boolean) {
        if (this._isNewClubPublic !== value) {
            this._isNewClubPublic = value;
            this.notifyPropertyChange('isNewClubPublic', value);
        }
    }

    get emptyStateMessage(): string {
        return this.selectedTab === 'my-clubs'
            ? "You haven't joined any book clubs yet"
            : 'No book clubs found matching your search';
    }

    // Event Handlers
    public onTabSelect(args: any): void {
        const tab = args.object.text.toLowerCase().replace(' ', '-');
        this.selectedTab = tab as 'my-clubs' | 'discover';
    }

    public onSearch(): void {
        this.filterClubs();
    }

    public onClearSearch(): void {
        this.searchQuery = '';
    }

    public onClubTap(args: any): void {
        const club = this.clubs[args.index];
        NavigationService.navigate('clubs/details', { clubId: club.id });
    }

    public onCreateClub(): void {
        this.resetNewClubForm();
        this.isCreatingClub = true;
    }

    public onCancelCreate(): void {
        this.isCreatingClub = false;
        this.resetNewClubForm();
    }

    public async onConfirmCreate(): Promise<void> {
        if (!this.newClubName.trim()) {
            return;
        }

        try {
            this.isLoading = true;
            await this.clubService.createClub(
                this.newClubName,
                this.newClubDescription,
                this.isNewClubPublic
            );

            this.isCreatingClub = false;
            this.resetNewClubForm();
            this.selectedTab = 'my-clubs'; // Switch to My Clubs tab
        } catch (error) {
            console.error('Error creating club:', error);
            this.errorMessage = 'Failed to create club. Please try again.';
        } finally {
            this.isLoading = false;
        }
    }

    public async onJoinClub(args: any): Promise<void> {
        try {
            const club = args.object.bindingContext;
            await this.clubService.joinClub(club.id);
            await this.loadClubs(); // Refresh clubs list
        } catch (error) {
            console.error('Error joining club:', error);
            this.errorMessage = 'Failed to join club. Please try again.';
        }
    }

    public onSwitchToDiscover(): void {
        this.selectedTab = 'discover';
    }

    public onRetry(): void {
        this.loadClubs();
    }

    // Private Methods
    private async initializeClubs(): Promise<void> {
        this.isLoading = true;
        try {
            await this.loadClubs();
        } catch (error) {
            console.error('Error initializing clubs:', error);
            this.errorMessage = 'Failed to load clubs';
        } finally {
            this.isLoading = false;
        }
    }

    private setupSubscriptions(): void {
        // Subscribe to user clubs updates
        this.clubService.userClubs$.subscribe(async clubs => {
            if (this.selectedTab === 'my-clubs') {
                await this.updateClubsList(clubs);
            }
        });
    }

    private async loadClubs(): Promise<void> {
        try {
            this.isLoading = true;
            this.errorMessage = '';

            let clubs: BookClub[];
            if (this.selectedTab === 'my-clubs') {
                clubs = await firstValueFrom(this.clubService.userClubs$) || [];
            } else {
                clubs = await this.clubService.searchClubs(this.searchQuery);
            }

            await this.updateClubsList(clubs);
        } catch (error) {
            console.error('Error loading clubs:', error);
            this.errorMessage = 'Failed to load clubs';
        } finally {
            this.isLoading = false;
        }
    }

    private async updateClubsList(clubs: BookClub[]): Promise<void> {
        const currentUser = this.authService.getCurrentUser();
        const clubViewModels: ClubViewModel[] = await Promise.all(
            clubs.map(async club => {
                let currentlyReadingTitle: string | undefined;
                if (club.currentlyReading) {
                    const book = await this.bookService.getBookById(club.currentlyReading);
                    currentlyReadingTitle = book?.title;
                }

                return {
                    ...club,
                    isMember: currentUser ? club.members.includes(currentUser.id) : false,
                    currentlyReadingTitle
                };
            })
        );

        this.clubs = clubViewModels;
    }

    private async filterClubs(): Promise<void> {
        if (this.selectedTab === 'discover') {
            await this.loadClubs(); // Use server-side search for discover tab
            return;
        }

        // Client-side filtering for my clubs
        if (!this.searchQuery.trim()) {
            await this.loadClubs();
            return;
        }

        const query = this.searchQuery.toLowerCase();
        const filtered = this.clubs.filter(club => 
            club.name.toLowerCase().includes(query) ||
            club.description.toLowerCase().includes(query) ||
            club.tags.some(tag => tag.toLowerCase().includes(query))
        );

        this.clubs = filtered;
    }

    private resetNewClubForm(): void {
        this.newClubName = '';
        this.newClubDescription = '';
        this.isNewClubPublic = true;
    }
}
