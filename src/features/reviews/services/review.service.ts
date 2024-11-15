import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { BookReview, BookReviewComment } from '../../books/models/book.model';

export class ReviewService {
    private static instance: ReviewService;
    private authService: AuthService;
    private reviews: Map<string, BookReview> = new Map();
    private comments: Map<string, BookReviewComment[]> = new Map();
    private userReviewsSubject: BehaviorSubject<BookReview[]>;

    private constructor() {
        this.authService = AuthService.getInstance();
        this.userReviewsSubject = new BehaviorSubject<BookReview[]>([]);
    }

    public static getInstance(): ReviewService {
        if (!ReviewService.instance) {
            ReviewService.instance = new ReviewService();
        }
        return ReviewService.instance;
    }

    // Review Operations
    public async createReview(bookId: string, rating: number, review: string, spoilerAlert: boolean = false): Promise<BookReview> {
        const user = this.authService.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated to create reviews');
        }

        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        const newReview: BookReview = {
            id: Date.now().toString(), // TODO: Use proper ID generation
            bookId,
            userId: user.id,
            rating,
            review,
            likes: 0,
            comments: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            spoilerAlert
        };

        await this.saveReview(newReview);
        await this.updateUserReviews();
        return newReview;
    }

    public async updateReview(reviewId: string, updates: Partial<BookReview>): Promise<BookReview> {
        const review = await this.getReview(reviewId);
        if (!review) {
            throw new Error('Review not found');
        }

        const user = this.authService.getCurrentUser();
        if (!user || review.userId !== user.id) {
            throw new Error('Unauthorized to update this review');
        }

        const updatedReview: BookReview = {
            ...review,
            ...updates,
            updatedAt: new Date()
        };

        await this.saveReview(updatedReview);
        await this.updateUserReviews();
        return updatedReview;
    }

    public async deleteReview(reviewId: string): Promise<void> {
        const review = await this.getReview(reviewId);
        if (!review) {
            throw new Error('Review not found');
        }

        const user = this.authService.getCurrentUser();
        if (!user || review.userId !== user.id) {
            throw new Error('Unauthorized to delete this review');
        }

        this.reviews.delete(reviewId);
        await this.updateUserReviews();
        // TODO: Implement backend/database delete
    }

    public async getReview(reviewId: string): Promise<BookReview | null> {
        // TODO: Implement backend/database fetch
        return this.reviews.get(reviewId) || null;
    }

    public async getBookReviews(bookId: string): Promise<BookReview[]> {
        // TODO: Implement backend/database fetch
        return Array.from(this.reviews.values())
            .filter(review => review.bookId === bookId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    public async getUserReviews(userId?: string): Promise<BookReview[]> {
        const targetUserId = userId || this.authService.getCurrentUser()?.id;
        if (!targetUserId) {
            throw new Error('User ID is required');
        }

        // TODO: Implement backend/database fetch
        return Array.from(this.reviews.values())
            .filter(review => review.userId === targetUserId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    // Comment Operations
    public async addComment(reviewId: string, content: string): Promise<BookReviewComment> {
        const user = this.authService.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated to comment');
        }

        const review = await this.getReview(reviewId);
        if (!review) {
            throw new Error('Review not found');
        }

        const comment: BookReviewComment = {
            id: Date.now().toString(), // TODO: Use proper ID generation
            reviewId,
            userId: user.id,
            content,
            likes: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const comments = this.comments.get(reviewId) || [];
        comments.push(comment);
        this.comments.set(reviewId, comments);

        review.comments = comments;
        await this.saveReview(review);

        return comment;
    }

    public async updateComment(commentId: string, content: string): Promise<BookReviewComment> {
        const user = this.authService.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated to update comments');
        }

        let updatedComment: BookReviewComment | null = null;
        for (const [reviewId, comments] of this.comments.entries()) {
            const commentIndex = comments.findIndex(c => c.id === commentId);
            if (commentIndex !== -1) {
                if (comments[commentIndex].userId !== user.id) {
                    throw new Error('Unauthorized to update this comment');
                }

                updatedComment = {
                    ...comments[commentIndex],
                    content,
                    updatedAt: new Date()
                };
                comments[commentIndex] = updatedComment;
                this.comments.set(reviewId, comments);

                const review = await this.getReview(reviewId);
                if (review) {
                    review.comments = comments;
                    await this.saveReview(review);
                }
                break;
            }
        }

        if (!updatedComment) {
            throw new Error('Comment not found');
        }

        return updatedComment;
    }

    public async deleteComment(commentId: string): Promise<void> {
        const user = this.authService.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated to delete comments');
        }

        for (const [reviewId, comments] of this.comments.entries()) {
            const comment = comments.find(c => c.id === commentId);
            if (comment) {
                if (comment.userId !== user.id) {
                    throw new Error('Unauthorized to delete this comment');
                }

                const updatedComments = comments.filter(c => c.id !== commentId);
                this.comments.set(reviewId, updatedComments);

                const review = await this.getReview(reviewId);
                if (review) {
                    review.comments = updatedComments;
                    await this.saveReview(review);
                }
                break;
            }
        }
    }

    // Like Operations
    public async toggleReviewLike(reviewId: string): Promise<BookReview> {
        const user = this.authService.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated to like reviews');
        }

        const review = await this.getReview(reviewId);
        if (!review) {
            throw new Error('Review not found');
        }

        // TODO: Implement proper like tracking per user
        review.likes = review.likes ? review.likes + 1 : 1;
        await this.saveReview(review);
        return review;
    }

    public async toggleCommentLike(commentId: string): Promise<BookReviewComment> {
        const user = this.authService.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated to like comments');
        }

        let updatedComment: BookReviewComment | null = null;
        for (const [reviewId, comments] of this.comments.entries()) {
            const commentIndex = comments.findIndex(c => c.id === commentId);
            if (commentIndex !== -1) {
                updatedComment = {
                    ...comments[commentIndex],
                    likes: comments[commentIndex].likes + 1, // TODO: Implement proper like tracking per user
                    updatedAt: new Date()
                };
                comments[commentIndex] = updatedComment;
                this.comments.set(reviewId, comments);

                const review = await this.getReview(reviewId);
                if (review) {
                    review.comments = comments;
                    await this.saveReview(review);
                }
                break;
            }
        }

        if (!updatedComment) {
            throw new Error('Comment not found');
        }

        return updatedComment;
    }

    // Observables
    public get userReviews$(): Observable<BookReview[]> {
        return this.userReviewsSubject.asObservable();
    }

    // Private Helper Methods
    private async saveReview(review: BookReview): Promise<void> {
        this.reviews.set(review.id, review);
        // TODO: Implement backend/database save
    }

    private async updateUserReviews(): Promise<void> {
        const userId = this.authService.getCurrentUser()?.id;
        if (userId) {
            const reviews = await this.getUserReviews(userId);
            this.userReviewsSubject.next(reviews);
        }
    }
}
