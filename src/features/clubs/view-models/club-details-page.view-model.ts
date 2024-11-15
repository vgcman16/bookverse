import { Observable } from '@nativescript/core';
import { ClubService } from '../services/club.service';
import { BookService } from '../../books/services/book.service';
import { AuthService } from '../../../features/auth/services/auth.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { 
    BookClub, 
    ClubDiscussion, 
    ClubEvent, 
    ClubRole, 
    ClubPermission,
    ReadingMilestone
} from '../models/club.model';
import { Book } from '../../books/models/book.model';

interface ClubMemberViewModel {
    id: string;
    displayName: string;
    photoUrl?: string;
    roles: string[];
    isAdmin: boolean;
}

export class ClubDetailsPageViewModel extends Observable {
    private clubService: ClubService;
    private bookService: BookService;
    private authService: AuthService;
    private _club: BookClub | null = null;
    private _currentBook: Book | null = null;
    private _discussions: ClubDiscussion[] = [];
    private _events: ClubEvent[] = [];
    private _members: ClubMemberViewModel[] = [];
    private _selectedTabIndex: number = 0;
    private _readingProgress: number = 0;
    private _isLoading: boolean = false;
    private _errorMessage: string = '';
    private _isShowingOptions: boolean = false;
    private _isShowingMemberOptions: boolean = false;
    private _selectedMemberId: string | null = null;

    constructor(private clubId: string) {
        super();
        this.clubService = ClubService.getInstance();
        this.bookService = BookService.getInstance();
        this.authService = AuthService.getInstance();
        this.initializeClub();
    }

    // Getters and Setters
    get club(): BookClub | null {
        return this._club;
    }

    set club(value: BookClub | null) {
        if (this._club !== value) {
            this._club = value;
            this.notifyPropertyChange('club', value);
        }
    }

    get currentBook(): Book | null {
        return this._currentBook;
    }

    set currentBook(value: Book | null) {
        if (this._currentBook !== value) {
            this._currentBook = value;
            this.notifyPropertyChange('currentBook', value);
        }
    }

    get discussions(): ClubDiscussion[] {
        return this._discussions;
    }

    set discussions(value: ClubDiscussion[]) {
        if (this._discussions !== value) {
            this._discussions = value;
            this.notifyPropertyChange('discussions', value);
        }
    }

    get events(): ClubEvent[] {
        return this._events;
    }

    set events(value: ClubEvent[]) {
        if (this._events !== value) {
            this._events = value;
            this.notifyPropertyChange('events', value);
        }
    }

    get members(): ClubMemberViewModel[] {
        return this._members;
    }

    set members(value: ClubMemberViewModel[]) {
        if (this._members !== value) {
            this._members = value;
            this.notifyPropertyChange('members', value);
        }
    }

    get selectedTabIndex(): number {
        return this._selectedTabIndex;
    }

    set selectedTabIndex(value: number) {
        if (this._selectedTabIndex !== value) {
            this._selectedTabIndex = value;
            this.notifyPropertyChange('selectedTabIndex', value);
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

    get isShowingOptions(): boolean {
        return this._isShowingOptions;
    }

    set isShowingOptions(value: boolean) {
        if (this._isShowingOptions !== value) {
            this._isShowingOptions = value;
            this.notifyPropertyChange('isShowingOptions', value);
        }
    }

    get isShowingMemberOptions(): boolean {
        return this._isShowingMemberOptions;
    }

    set isShowingMemberOptions(value: boolean) {
        if (this._isShowingMemberOptions !== value) {
            this._isShowingMemberOptions = value;
            this.notifyPropertyChange('isShowingMemberOptions', value);
        }
    }

    get isAdmin(): boolean {
        const currentUser = this.authService.getCurrentUser();
        return currentUser ? this._club?.admins.includes(currentUser.id) || false : false;
    }

    get canManageMembers(): boolean {
        return this.hasPermission(ClubPermission.ManageMembers);
    }

    // Event Handlers
    public onShowOptions(): void {
        this.isShowingOptions = true;
    }

    public onHideOptions(): void {
        this.isShowingOptions = false;
    }

    public onShowMemberOptions(args: any): void {
        const member = args.object.bindingContext;
        this._selectedMemberId = member.id;
        this.isShowingMemberOptions = true;
    }

    public onHideMemberOptions(): void {
        this.isShowingMemberOptions = false;
        this._selectedMemberId = null;
    }

    public async onSelectBook(): Promise<void> {
        if (!this.hasPermission(ClubPermission.UpdateClubInfo)) return;
        NavigationService.navigate('books/search', { 
            mode: 'select',
            onSelect: async (book: Book) => {
                try {
                    if (!this._club) return;
                    await this.clubService.updateClub(this._club.id, {
                        currentlyReading: book.id
                    });
                    this.currentBook = book;
                } catch (error) {
                    console.error('Error selecting book:', error);
                    this.errorMessage = 'Failed to select book';
                }
            }
        });
    }

    public onNewDiscussion(): void {
        NavigationService.navigate('clubs/discussion/create', { clubId: this.clubId });
    }

    public onDiscussionTap(args: any): void {
        const discussion = this.discussions[args.index];
        NavigationService.navigate('clubs/discussion/details', { 
            clubId: this.clubId,
            discussionId: discussion.id 
        });
    }

    public onNewEvent(): void {
        NavigationService.navigate('clubs/event/create', { clubId: this.clubId });
    }

    public onEventTap(args: any): void {
        const event = this.events[args.index];
        NavigationService.navigate('clubs/event/details', { 
            clubId: this.clubId,
            eventId: event.id 
        });
    }

    public onMemberTap(args: any): void {
        const member = this.members[args.index];
        NavigationService.navigate('profile/details', { userId: member.id });
    }

    public onInviteMembers(): void {
        NavigationService.navigate('clubs/invite', { clubId: this.clubId });
    }

    public async onAssignRole(): Promise<void> {
        if (!this._selectedMemberId || !this.hasPermission(ClubPermission.ManageRoles)) return;
        // TODO: Implement role assignment dialog
        this.onHideMemberOptions();
    }

    public async onRemoveMember(): Promise<void> {
        if (!this._selectedMemberId || !this.hasPermission(ClubPermission.ManageMembers)) return;
        try {
            await this.clubService.leaveClub(this.clubId);
            await this.loadMembers();
            this.onHideMemberOptions();
        } catch (error) {
            console.error('Error removing member:', error);
            this.errorMessage = 'Failed to remove member';
        }
    }

    public onEditClub(): void {
        NavigationService.navigate('clubs/edit', { clubId: this.clubId });
        this.onHideOptions();
    }

    public onManageRoles(): void {
        NavigationService.navigate('clubs/roles', { clubId: this.clubId });
        this.onHideOptions();
    }

    public async onDeleteClub(): Promise<void> {
        try {
            await this.clubService.deleteClub(this.clubId);
            NavigationService.goBack();
        } catch (error) {
            console.error('Error deleting club:', error);
            this.errorMessage = 'Failed to delete club';
        }
    }

    // Private Methods
    private async initializeClub(): Promise<void> {
        this.isLoading = true;
        try {
            await this.loadClub();
            await Promise.all([
                this.loadCurrentBook(),
                this.loadDiscussions(),
                this.loadEvents(),
                this.loadMembers()
            ]);
        } catch (error) {
            console.error('Error initializing club:', error);
            this.errorMessage = 'Failed to load club details';
        } finally {
            this.isLoading = false;
        }
    }

    private async loadClub(): Promise<void> {
        const club = await this.clubService.getClub(this.clubId);
        if (!club) {
            throw new Error('Club not found');
        }
        this.club = club;
    }

    private async loadCurrentBook(): Promise<void> {
        if (!this._club?.currentlyReading) return;
        try {
            const book = await this.bookService.getBookById(this._club.currentlyReading);
            this.currentBook = book;
            // TODO: Load reading progress
            this.readingProgress = 0;
        } catch (error) {
            console.error('Error loading current book:', error);
        }
    }

    private async loadDiscussions(): Promise<void> {
        // TODO: Implement discussions loading
        this.discussions = [];
    }

    private async loadEvents(): Promise<void> {
        // TODO: Implement events loading
        this.events = [];
    }

    private async loadMembers(): Promise<void> {
        if (!this._club) return;
        // TODO: Load member details from user service
        this.members = this._club.members.map(id => ({
            id,
            displayName: 'Member ' + id,
            roles: [],
            isAdmin: this._club?.admins.includes(id) || false
        }));
    }

    private hasPermission(permission: ClubPermission): boolean {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser || !this._club) return false;

        // Club creator and admins have all permissions
        if (this._club.createdBy === currentUser.id || 
            this._club.admins.includes(currentUser.id)) {
            return true;
        }

        // TODO: Check role-based permissions
        return false;
    }
}
