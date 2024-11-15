import { Observable } from '@nativescript/core';
import { ClubService } from '../services/club.service';
import { BookService } from '../../books/services/book.service';
import { AuthService } from '../../../features/auth/services/auth.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { ClubDiscussion, DiscussionReply, ClubPermission } from '../models/club.model';
import { Book } from '../../books/models/book.model';

interface ReplyViewModel extends DiscussionReply {
    authorName: string;
    authorPhotoUrl?: string;
    liked?: boolean;
}

interface DiscussionViewModel extends ClubDiscussion {
    authorName: string;
    authorPhotoUrl?: string;
    liked: boolean;
}

export class DiscussionDetailsViewModel extends Observable {
    private clubService: ClubService;
    private bookService: BookService;
    private authService: AuthService;
    private _discussion: DiscussionViewModel | null = null;
    private _book: Book | null = null;
    private _replies: ReplyViewModel[] = [];
    private _newReplyText: string = '';
    private _isLoading: boolean = false;
    private _errorMessage: string = '';
    private _isShowingOptions: boolean = false;
    private _isShowingReplyOptions: boolean = false;
    private _selectedReplyId: string | null = null;
    private _replyingToId: string | undefined = undefined;

    constructor(private clubId: string, private discussionId: string) {
        super();
        this.clubService = ClubService.getInstance();
        this.bookService = BookService.getInstance();
        this.authService = AuthService.getInstance();
        this.initializeDiscussion();
    }

    // Getters and Setters
    get discussion(): DiscussionViewModel | null {
        return this._discussion;
    }

    set discussion(value: DiscussionViewModel | null) {
        if (this._discussion !== value) {
            this._discussion = value;
            this.notifyPropertyChange('discussion', value);
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

    get replies(): ReplyViewModel[] {
        return this._replies;
    }

    set replies(value: ReplyViewModel[]) {
        if (this._replies !== value) {
            this._replies = value;
            this.notifyPropertyChange('replies', value);
        }
    }

    get newReplyText(): string {
        return this._newReplyText;
    }

    set newReplyText(value: string) {
        if (this._newReplyText !== value) {
            this._newReplyText = value;
            this.notifyPropertyChange('newReplyText', value);
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

    get isShowingReplyOptions(): boolean {
        return this._isShowingReplyOptions;
    }

    set isShowingReplyOptions(value: boolean) {
        if (this._isShowingReplyOptions !== value) {
            this._isShowingReplyOptions = value;
            this.notifyPropertyChange('isShowingReplyOptions', value);
        }
    }

    get canModerate(): boolean {
        return this.hasPermission(ClubPermission.ManageDiscussions);
    }

    // Event Handlers
    public onShowOptions(): void {
        this.isShowingOptions = true;
    }

    public onHideOptions(): void {
        this.isShowingOptions = false;
    }

    public async onTogglePin(): Promise<void> {
        if (!this._discussion) return;
        try {
            await this.clubService.updateDiscussion(this.clubId, this.discussionId, {
                isPinned: !this._discussion.isPinned
            });
            this._discussion.isPinned = !this._discussion.isPinned;
            this.notifyPropertyChange('discussion', this._discussion);
            this.onHideOptions();
        } catch (error) {
            console.error('Error toggling pin:', error);
            this.errorMessage = 'Failed to update discussion';
        }
    }

    public async onToggleLock(): Promise<void> {
        if (!this._discussion) return;
        try {
            await this.clubService.updateDiscussion(this.clubId, this.discussionId, {
                isLocked: !this._discussion.isLocked
            });
            this._discussion.isLocked = !this._discussion.isLocked;
            this.notifyPropertyChange('discussion', this._discussion);
            this.onHideOptions();
        } catch (error) {
            console.error('Error toggling lock:', error);
            this.errorMessage = 'Failed to update discussion';
        }
    }

    public async onDeleteDiscussion(): Promise<void> {
        try {
            await this.clubService.deleteDiscussion(this.clubId, this.discussionId);
            NavigationService.goBack();
        } catch (error) {
            console.error('Error deleting discussion:', error);
            this.errorMessage = 'Failed to delete discussion';
        }
    }

    public async onLikeDiscussion(): Promise<void> {
        if (!this._discussion) return;
        try {
            await this.clubService.toggleDiscussionLike(this.clubId, this.discussionId);
            this._discussion.liked = !this._discussion.liked;
            this._discussion.likes += this._discussion.liked ? 1 : -1;
            this.notifyPropertyChange('discussion', this._discussion);
        } catch (error) {
            console.error('Error liking discussion:', error);
            this.errorMessage = 'Failed to like discussion';
        }
    }

    public onReplyToComment(args: any): void {
        const reply = args.object.bindingContext;
        this._replyingToId = reply.id;
        // TODO: Update UI to show replying to indicator
    }

    public onShowReplyOptions(args: any): void {
        const reply = args.object.bindingContext;
        this._selectedReplyId = reply.id;
        this.isShowingReplyOptions = true;
    }

    public onHideReplyOptions(): void {
        this.isShowingReplyOptions = false;
        this._selectedReplyId = null;
    }

    public async onLikeReply(args: any): Promise<void> {
        const reply = args.object.bindingContext;
        try {
            await this.clubService.toggleReplyLike(this.clubId, this.discussionId, reply.id);
            const replyIndex = this._replies.findIndex(r => r.id === reply.id);
            if (replyIndex !== -1) {
                const isLiked = this._replies[replyIndex].liked || false;
                this._replies[replyIndex].likes += isLiked ? -1 : 1;
                this._replies[replyIndex].liked = !isLiked;
                this.notifyPropertyChange('replies', this._replies);
            }
        } catch (error) {
            console.error('Error liking reply:', error);
            this.errorMessage = 'Failed to like reply';
        }
    }

    public async onSendReply(): Promise<void> {
        if (!this.newReplyText.trim()) return;

        try {
            const reply = await this.clubService.addDiscussionReply(
                this.clubId,
                this.discussionId,
                this.newReplyText,
                this._replyingToId
            );

            // Add author info to reply
            const currentUser = this.authService.getCurrentUser();
            const replyViewModel: ReplyViewModel = {
                ...reply,
                authorName: currentUser?.displayName || 'Unknown',
                authorPhotoUrl: currentUser?.photoUri,
                liked: false
            };

            this._replies = [...this._replies, replyViewModel];
            this.newReplyText = '';
            this._replyingToId = undefined;
            // TODO: Update UI to clear replying to indicator
        } catch (error) {
            console.error('Error sending reply:', error);
            this.errorMessage = 'Failed to send reply';
        }
    }

    public async onEditReply(): Promise<void> {
        // TODO: Implement reply editing
        this.onHideReplyOptions();
    }

    public async onDeleteReply(): Promise<void> {
        if (!this._selectedReplyId) return;

        try {
            await this.clubService.deleteReply(
                this.clubId,
                this.discussionId,
                this._selectedReplyId
            );
            this._replies = this._replies.filter(r => r.id !== this._selectedReplyId);
            this.onHideReplyOptions();
        } catch (error) {
            console.error('Error deleting reply:', error);
            this.errorMessage = 'Failed to delete reply';
        }
    }

    public canModerateReply(reply: ReplyViewModel): boolean {
        const currentUser = this.authService.getCurrentUser();
        return currentUser ? 
            this.canModerate || reply.createdBy === currentUser.id : 
            false;
    }

    // Private Methods
    private async initializeDiscussion(): Promise<void> {
        this.isLoading = true;
        try {
            await Promise.all([
                this.loadDiscussion(),
                this.loadReplies()
            ]);

            if (this._discussion?.bookId) {
                await this.loadBook();
            }
        } catch (error) {
            console.error('Error initializing discussion:', error);
            this.errorMessage = 'Failed to load discussion';
        } finally {
            this.isLoading = false;
        }
    }

    private async loadDiscussion(): Promise<void> {
        const discussion = await this.clubService.getDiscussion(this.clubId, this.discussionId);
        if (!discussion) {
            throw new Error('Discussion not found');
        }

        // Add author info and liked status
        const currentUser = this.authService.getCurrentUser();
        // TODO: Get author info from user service
        this.discussion = {
            ...discussion,
            authorName: 'Author Name', // TODO: Get from user service
            authorPhotoUrl: undefined, // TODO: Get from user service
            liked: currentUser ? this.clubService.isDiscussionLiked(discussion.id) : false
        };
    }

    private async loadReplies(): Promise<void> {
        if (!this._discussion) return;

        // TODO: Get author info for each reply from user service
        this.replies = this._discussion.replies.map(reply => ({
            ...reply,
            authorName: 'Reply Author', // TODO: Get from user service
            authorPhotoUrl: undefined, // TODO: Get from user service
            liked: this.clubService.isReplyLiked(reply.id)
        }));
    }

    private async loadBook(): Promise<void> {
        if (!this._discussion?.bookId) return;

        try {
            this.book = await this.bookService.getBookById(this._discussion.bookId);
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
