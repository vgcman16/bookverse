import { Observable } from '@nativescript/core';
import { ClubService } from '../services/club.service';
import { BookService } from '../../books/services/book.service';
import { AuthService } from '../../../features/auth/services/auth.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { ClubEvent, ClubPermission } from '../models/club.model';
import { Book } from '../../books/models/book.model';

interface EventComment {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    authorPhotoUrl?: string;
    createdAt: Date;
}

interface AttendeeViewModel {
    id: string;
    displayName: string;
    photoUrl?: string;
    status: 'going' | 'maybe' | 'notGoing';
    statusIcon: string;
}

export class EventDetailsPageViewModel extends Observable {
    private clubService: ClubService;
    private bookService: BookService;
    private authService: AuthService;
    private _event: ClubEvent | null = null;
    private _book: Book | null = null;
    private _attendees: AttendeeViewModel[] = [];
    private _comments: EventComment[] = [];
    private _newCommentText: string = '';
    private _isLoading: boolean = false;
    private _errorMessage: string = '';
    private _isShowingOptions: boolean = false;
    private _isCommentInputVisible: boolean = false;
    private _attendanceStatus: 'going' | 'maybe' | 'notGoing' | null = null;

    constructor(private clubId: string, private eventId: string) {
        super();
        this.clubService = ClubService.getInstance();
        this.bookService = BookService.getInstance();
        this.authService = AuthService.getInstance();
        this.initializeEvent();
    }

    // Getters and Setters
    get event(): ClubEvent | null {
        return this._event;
    }

    set event(value: ClubEvent | null) {
        if (this._event !== value) {
            this._event = value;
            this.notifyPropertyChange('event', value);
        }
    }

    get book(): Book | null {
        return this._book;
    }

    set book(value: Book | null) {
        if (this._book !== value) {
            this._book = value;
            this.notifyPropertyChange('book', value);
        }
    }

    get attendees(): AttendeeViewModel[] {
        return this._attendees;
    }

    set attendees(value: AttendeeViewModel[]) {
        if (this._attendees !== value) {
            this._attendees = value;
            this.notifyPropertyChange('attendees', value);
        }
    }

    get comments(): EventComment[] {
        return this._comments;
    }

    set comments(value: EventComment[]) {
        if (this._comments !== value) {
            this._comments = value;
            this.notifyPropertyChange('comments', value);
        }
    }

    get newCommentText(): string {
        return this._newCommentText;
    }

    set newCommentText(value: string) {
        if (this._newCommentText !== value) {
            this._newCommentText = value;
            this.notifyPropertyChange('newCommentText', value);
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

    get isCommentInputVisible(): boolean {
        return this._isCommentInputVisible;
    }

    set isCommentInputVisible(value: boolean) {
        if (this._isCommentInputVisible !== value) {
            this._isCommentInputVisible = value;
            this.notifyPropertyChange('isCommentInputVisible', value);
        }
    }

    get attendanceStatus(): string | null {
        return this._attendanceStatus;
    }

    set attendanceStatus(value: 'going' | 'maybe' | 'notGoing' | null) {
        if (this._attendanceStatus !== value) {
            this._attendanceStatus = value;
            this.notifyPropertyChange('attendanceStatus', value);
        }
    }

    get canManageEvent(): boolean {
        return this.hasPermission(ClubPermission.ManageEvents);
    }

    // Event Handlers
    public onShowOptions(): void {
        this.isShowingOptions = true;
    }

    public onHideOptions(): void {
        this.isShowingOptions = false;
    }

    public onEditEvent(): void {
        NavigationService.navigate('clubs/event/edit', {
            clubId: this.clubId,
            eventId: this.eventId
        });
        this.onHideOptions();
    }

    public async onCancelEvent(): Promise<void> {
        try {
            await this.clubService.deleteEvent(this.clubId, this.eventId);
            NavigationService.goBack();
        } catch (error) {
            console.error('Error canceling event:', error);
            this.errorMessage = 'Failed to cancel event';
        }
    }

    public async onUpdateAttendance(args: any): void {
        const status = args.object.text.toLowerCase() as 'going' | 'maybe' | 'notGoing';
        try {
            await this.clubService.updateEventAttendance(
                this.clubId,
                this.eventId,
                status
            );
            this.attendanceStatus = status;
            await this.loadAttendees();
        } catch (error) {
            console.error('Error updating attendance:', error);
            this.errorMessage = 'Failed to update attendance';
        }
    }

    public async onSendComment(): Promise<void> {
        if (!this.newCommentText.trim()) return;

        try {
            const comment = await this.clubService.addEventComment(
                this.clubId,
                this.eventId,
                this.newCommentText
            );

            const currentUser = this.authService.getCurrentUser();
            const commentViewModel: EventComment = {
                ...comment,
                authorName: currentUser?.displayName || 'Unknown',
                authorPhotoUrl: currentUser?.photoUri
            };

            this._comments = [...this._comments, commentViewModel];
            this.newCommentText = '';
        } catch (error) {
            console.error('Error sending comment:', error);
            this.errorMessage = 'Failed to send comment';
        }
    }

    // Private Methods
    private async initializeEvent(): Promise<void> {
        this.isLoading = true;
        try {
            await Promise.all([
                this.loadEvent(),
                this.loadAttendees(),
                this.loadComments()
            ]);

            if (this._event?.bookId) {
                await this.loadBook();
            }
        } catch (error) {
            console.error('Error initializing event:', error);
            this.errorMessage = 'Failed to load event details';
        } finally {
            this.isLoading = false;
        }
    }

    private async loadEvent(): Promise<void> {
        const event = await this.clubService.getEvent(this.clubId, this.eventId);
        if (!event) {
            throw new Error('Event not found');
        }
        this.event = event;

        // Set current user's attendance status
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
            if (event.attendees.going.includes(currentUser.id)) {
                this.attendanceStatus = 'going';
            } else if (event.attendees.maybe.includes(currentUser.id)) {
                this.attendanceStatus = 'maybe';
            } else if (event.attendees.notGoing.includes(currentUser.id)) {
                this.attendanceStatus = 'notGoing';
            }
        }
    }

    private async loadAttendees(): Promise<void> {
        if (!this._event) return;

        // TODO: Get user details from user service
        const getStatusIcon = (status: string) => {
            switch (status) {
                case 'going': return '✅';
                case 'maybe': return '❓';
                case 'notGoing': return '❌';
                default: return '';
            }
        };

        const attendees: AttendeeViewModel[] = [];

        // Add going attendees
        for (const userId of this._event.attendees.going) {
            attendees.push({
                id: userId,
                displayName: 'User ' + userId,
                status: 'going',
                statusIcon: getStatusIcon('going')
            });
        }

        // Add maybe attendees
        for (const userId of this._event.attendees.maybe) {
            attendees.push({
                id: userId,
                displayName: 'User ' + userId,
                status: 'maybe',
                statusIcon: getStatusIcon('maybe')
            });
        }

        // Add not going attendees
        for (const userId of this._event.attendees.notGoing) {
            attendees.push({
                id: userId,
                displayName: 'User ' + userId,
                status: 'notGoing',
                statusIcon: getStatusIcon('notGoing')
            });
        }

        this.attendees = attendees;
    }

    private async loadComments(): Promise<void> {
        // TODO: Implement comments loading from backend
        this.comments = [];
    }

    private async loadBook(): Promise<void> {
        if (!this._event?.bookId) return;

        try {
            this.book = await this.bookService.getBookById(this._event.bookId);
        } catch (error) {
            console.error('Error loading book:', error);
            // Non-critical error, don't show error message
        }
    }

    private hasPermission(permission: ClubPermission): boolean {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) return false;

        // TODO: Implement proper permission checking
        return true;
    }
}
