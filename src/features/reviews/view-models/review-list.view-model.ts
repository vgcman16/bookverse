import { Observable } from '@nativescript/core';
import { ReviewService } from '../services/review.service';
import { AuthService } from '../../auth/services/auth.service';
import { BookReview } from '../../books/models/book.model';
import { NavigationService } from '../../../core/services/navigation.service';

interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    ratingCounts: Record<number, number>;
    ratingPercentages: Record<number, number>;
}

export class ReviewListViewModel extends Observable {
    private reviewService: ReviewService;
    private authService: AuthService;
    private _reviews: BookReview[] = [];
    private _isLoading: boolean = false;
    private _errorMessage: string = '';
    private _isShowingOptions: boolean = false;
    private _selectedReviewId: string | null = null;
    private _stats: ReviewStats = {
        averageRating: 0,
        totalReviews: 0,
        ratingCounts: {},
        ratingPercentages: {}
    };

    constructor(private bookId: string) {
        super();
        this.reviewService = ReviewService.getInstance();
        this.authService = AuthService.getInstance();
        this.loadReviews();
    }

    // Getters and Setters
    get reviews(): BookReview[] {
        return this._reviews;
    }

    set reviews(value: BookReview[]) {
        if (this._reviews !== value) {
            this._reviews = value;
            this.notifyPropertyChange('reviews', value);
            this.calculateStats();
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

    // Stats Getters
    get averageRating(): string {
        return this._stats.averageRating.toFixed(1);
    }

    get totalReviews(): number {
        return this._stats.totalReviews;
    }

    get ratingStars(): string[] {
        const rating = Math.round(this._stats.averageRating);
        return Array(5).fill('').map((_, i) => i < rating ? '⭐' : '☆');
    }

    get fiveStarCount(): number {
        return this._stats.ratingCounts[5] || 0;
    }

    get fourStarCount(): number {
        return this._stats.ratingCounts[4] || 0;
    }

    get threeStarCount(): number {
        return this._stats.ratingCounts[3] || 0;
    }

    get twoStarCount(): number {
        return this._stats.ratingCounts[2] || 0;
    }

    get oneStarCount(): number {
        return this._stats.ratingCounts[1] || 0;
    }

    get fiveStarPercentage(): number {
        return this._stats.ratingPercentages[5] || 0;
    }

    get fourStarPercentage(): number {
        return this._stats.ratingPercentages[4] || 0;
    }

    get threeStarPercentage(): number {
        return this._stats.ratingPercentages[3] || 0;
    }

    get twoStarPercentage(): number {
        return this._stats.ratingPercentages[2] || 0;
    }

    get oneStarPercentage(): number {
        return this._stats.ratingPercentages[1] || 0;
    }

    // Event Handlers
    public onReviewTap(args: any): void {
        const review = this.reviews[args.index];
        NavigationService.navigate('reviews/details', { reviewId: review.id });
    }

    public async onLikeReview(args: any): Promise<void> {
        try {
            const review = args.object.bindingContext;
            await this.reviewService.toggleReviewLike(review.id);
            await this.loadReviews(); // Refresh reviews to get updated like count
        } catch (error) {
            console.error('Error liking review:', error);
            this.errorMessage = 'Failed to like review';
        }
    }

    public onViewComments(args: any): void {
        const review = args.object.bindingContext;
        NavigationService.navigate('reviews/comments', { reviewId: review.id });
    }

    public onShowReviewOptions(args: any): void {
        const review = args.object.bindingContext;
        this._selectedReviewId = review.id;
        this.isShowingOptions = true;
    }

    public onHideOptions(): void {
        this.isShowingOptions = false;
        this._selectedReviewId = null;
    }

    public onWriteReview(): void {
        NavigationService.navigate('reviews/create', { bookId: this.bookId });
    }

    public onEditReview(): void {
        if (this._selectedReviewId) {
            NavigationService.navigate('reviews/edit', { reviewId: this._selectedReviewId });
            this.onHideOptions();
        }
    }

    public async onDeleteReview(): Promise<void> {
        if (!this._selectedReviewId) return;

        try {
            await this.reviewService.deleteReview(this._selectedReviewId);
            await this.loadReviews();
            this.onHideOptions();
        } catch (error) {
            console.error('Error deleting review:', error);
            this.errorMessage = 'Failed to delete review';
        }
    }

    public onRetry(): void {
        this.loadReviews();
    }

    // Private Methods
    private async loadReviews(): Promise<void> {
        try {
            this.isLoading = true;
            this.errorMessage = '';

            this.reviews = await this.reviewService.getBookReviews(this.bookId);

            if (this.reviews.length === 0) {
                this.calculateStats(); // Reset stats for empty reviews
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.errorMessage = 'Failed to load reviews';
        } finally {
            this.isLoading = false;
        }
    }

    private calculateStats(): void {
        if (this.reviews.length === 0) {
            this._stats = {
                averageRating: 0,
                totalReviews: 0,
                ratingCounts: {},
                ratingPercentages: {}
            };
            return;
        }

        // Calculate rating counts
        const ratingCounts: Record<number, number> = {};
        let totalRating = 0;

        this.reviews.forEach(review => {
            const rating = review.rating;
            ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
            totalRating += rating;
        });

        // Calculate percentages
        const ratingPercentages: Record<number, number> = {};
        for (let rating = 1; rating <= 5; rating++) {
            ratingPercentages[rating] = ((ratingCounts[rating] || 0) / this.reviews.length) * 100;
        }

        this._stats = {
            averageRating: totalRating / this.reviews.length,
            totalReviews: this.reviews.length,
            ratingCounts,
            ratingPercentages
        };

        // Notify all stats properties
        this.notifyPropertyChange('averageRating', this.averageRating);
        this.notifyPropertyChange('totalReviews', this.totalReviews);
        this.notifyPropertyChange('ratingStars', this.ratingStars);
        this.notifyPropertyChange('fiveStarCount', this.fiveStarCount);
        this.notifyPropertyChange('fourStarCount', this.fourStarCount);
        this.notifyPropertyChange('threeStarCount', this.threeStarCount);
        this.notifyPropertyChange('twoStarCount', this.twoStarCount);
        this.notifyPropertyChange('oneStarCount', this.oneStarCount);
        this.notifyPropertyChange('fiveStarPercentage', this.fiveStarPercentage);
        this.notifyPropertyChange('fourStarPercentage', this.fourStarPercentage);
        this.notifyPropertyChange('threeStarPercentage', this.threeStarPercentage);
        this.notifyPropertyChange('twoStarPercentage', this.twoStarPercentage);
        this.notifyPropertyChange('oneStarPercentage', this.oneStarPercentage);
    }
}
