export interface Book {
    id: string;
    title: string;
    authors: string[];
    description: string;
    publishedDate: string;
    publisher: string;
    categories: string[];
    pageCount: number;
    averageRating?: number;
    ratingsCount?: number;
    imageLinks: {
        thumbnail: string;
        smallThumbnail: string;
        small?: string;
        medium?: string;
        large?: string;
        extraLarge?: string;
    };
    language: string;
    previewLink: string;
    infoLink: string;
    isbn?: {
        isbn10?: string;
        isbn13?: string;
    };
}

export interface BookSearchResult {
    items: Book[];
    totalItems: number;
    kind: string;
}

export interface BookSearchParams {
    query: string;
    startIndex?: number;
    maxResults?: number;
    orderBy?: 'relevance' | 'newest';
    filter?: {
        title?: string;
        author?: string;
        publisher?: string;
        subject?: string;
        isbn?: string;
    };
}

export interface UserBook extends Book {
    userId: string;
    status: ReadingStatus;
    progress: number;
    startDate?: Date;
    finishDate?: Date;
    userRating?: number;
    userReview?: string;
    userNotes?: string[];
    addedDate: Date;
    lastUpdated: Date;
    collections: string[];
}

export enum ReadingStatus {
    ToRead = 'to-read',
    Reading = 'reading',
    Completed = 'completed',
    OnHold = 'on-hold',
    Dropped = 'dropped'
}

export interface BookCollection {
    id: string;
    userId: string;
    name: string;
    description?: string;
    isPublic: boolean;
    books: string[]; // Array of book IDs
    createdAt: Date;
    updatedAt: Date;
    coverImage?: string;
}

export interface BookReview {
    id: string;
    bookId: string;
    userId: string;
    rating: number;
    review: string;
    likes: number;
    comments: BookReviewComment[];
    createdAt: Date;
    updatedAt: Date;
    spoilerAlert: boolean;
    readingProgress?: number;
}

export interface BookReviewComment {
    id: string;
    reviewId: string;
    userId: string;
    content: string;
    likes: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ReadingProgress {
    bookId: string;
    userId: string;
    currentPage: number;
    totalPages: number;
    percentage: number;
    minutesRead: number;
    lastReadDate: Date;
    notes: ReadingNote[];
}

export interface ReadingNote {
    id: string;
    bookId: string;
    userId: string;
    page: number;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
}

export interface BookHighlight {
    id: string;
    bookId: string;
    userId: string;
    content: string;
    page: number;
    color: string;
    note?: string;
    createdAt: Date;
}

export interface ReadingStats {
    totalBooksRead: number;
    totalPagesRead: number;
    totalMinutesRead: number;
    averagePagesPerDay: number;
    averageMinutesPerDay: number;
    longestReadingStreak: number;
    currentReadingStreak: number;
    booksReadThisYear: number;
    booksReadThisMonth: number;
    favoriteGenres: Array<{
        genre: string;
        count: number;
    }>;
    readingGoals: {
        yearly: {
            target: number;
            current: number;
        };
        monthly: {
            target: number;
            current: number;
        };
    };
}
