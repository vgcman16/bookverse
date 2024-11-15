import { Http, HttpResponse } from '@nativescript/core';
import { Book, BookSearchParams, BookSearchResult } from '../models/book.model';

export class GoogleBooksService {
    private static instance: GoogleBooksService;
    private readonly baseUrl = 'https://www.googleapis.com/books/v1';
    private readonly apiKey = 'YOUR_GOOGLE_BOOKS_API_KEY'; // TODO: Move to environment config

    private constructor() {}

    public static getInstance(): GoogleBooksService {
        if (!GoogleBooksService.instance) {
            GoogleBooksService.instance = new GoogleBooksService();
        }
        return GoogleBooksService.instance;
    }

    public async searchBooks(params: BookSearchParams): Promise<BookSearchResult> {
        try {
            const queryParams = this.buildSearchQuery(params);
            const url = `${this.baseUrl}/volumes?${queryParams}&key=${this.apiKey}`;
            
            const response: HttpResponse = await Http.request({
                url,
                method: 'GET'
            });

            if (!response || !response.content || response.statusCode !== 200) {
                throw new Error(`API request failed with status ${response?.statusCode || 'unknown'}`);
            }

            const content = response.content.toJSON();
            if (!content) {
                throw new Error('Invalid response format');
            }

            return this.mapSearchResponse(content);
        } catch (error) {
            console.error('Error searching books:', error);
            throw new Error('Failed to search books');
        }
    }

    public async getBookById(bookId: string): Promise<Book> {
        try {
            const url = `${this.baseUrl}/volumes/${bookId}?key=${this.apiKey}`;
            
            const response: HttpResponse = await Http.request({
                url,
                method: 'GET'
            });

            if (!response || !response.content || response.statusCode !== 200) {
                throw new Error(`API request failed with status ${response?.statusCode || 'unknown'}`);
            }

            const content = response.content.toJSON();
            if (!content) {
                throw new Error('Invalid response format');
            }

            return this.mapBookData(content);
        } catch (error) {
            console.error('Error fetching book:', error);
            throw new Error('Failed to fetch book details');
        }
    }

    private buildSearchQuery(params: BookSearchParams): string {
        const queryParts: string[] = [];

        // Add main search query
        if (params.query) {
            queryParts.push(`q=${encodeURIComponent(params.query)}`);
        }

        // Add filters
        if (params.filter) {
            if (params.filter.title) {
                queryParts.push(`intitle:${encodeURIComponent(params.filter.title)}`);
            }
            if (params.filter.author) {
                queryParts.push(`inauthor:${encodeURIComponent(params.filter.author)}`);
            }
            if (params.filter.publisher) {
                queryParts.push(`inpublisher:${encodeURIComponent(params.filter.publisher)}`);
            }
            if (params.filter.subject) {
                queryParts.push(`subject:${encodeURIComponent(params.filter.subject)}`);
            }
            if (params.filter.isbn) {
                queryParts.push(`isbn:${encodeURIComponent(params.filter.isbn)}`);
            }
        }

        // Add pagination
        if (params.startIndex !== undefined) {
            queryParts.push(`startIndex=${params.startIndex}`);
        }
        if (params.maxResults !== undefined) {
            queryParts.push(`maxResults=${params.maxResults}`);
        }

        // Add ordering
        if (params.orderBy) {
            queryParts.push(`orderBy=${params.orderBy}`);
        }

        return queryParts.join('&');
    }

    private mapSearchResponse(data: any): BookSearchResult {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid search response data');
        }

        return {
            items: Array.isArray(data.items) ? data.items.map((item: any) => this.mapBookData(item)) : [],
            totalItems: typeof data.totalItems === 'number' ? data.totalItems : 0,
            kind: typeof data.kind === 'string' ? data.kind : 'unknown'
        };
    }

    private mapBookData(item: any): Book {
        if (!item || typeof item !== 'object') {
            throw new Error('Invalid book data');
        }

        const volumeInfo = item.volumeInfo || {};
        const imageLinks = volumeInfo.imageLinks || {};

        return {
            id: item.id || '',
            title: volumeInfo.title || '',
            authors: Array.isArray(volumeInfo.authors) ? volumeInfo.authors : [],
            description: volumeInfo.description || '',
            publishedDate: volumeInfo.publishedDate || '',
            publisher: volumeInfo.publisher || '',
            categories: Array.isArray(volumeInfo.categories) ? volumeInfo.categories : [],
            pageCount: typeof volumeInfo.pageCount === 'number' ? volumeInfo.pageCount : 0,
            averageRating: volumeInfo.averageRating,
            ratingsCount: volumeInfo.ratingsCount,
            imageLinks: {
                thumbnail: imageLinks.thumbnail || '',
                smallThumbnail: imageLinks.smallThumbnail || '',
                small: imageLinks.small,
                medium: imageLinks.medium,
                large: imageLinks.large,
                extraLarge: imageLinks.extraLarge
            },
            language: volumeInfo.language || '',
            previewLink: volumeInfo.previewLink || '',
            infoLink: volumeInfo.infoLink || '',
            isbn: this.extractIsbn(volumeInfo.industryIdentifiers)
        };
    }

    private extractIsbn(identifiers: any[] = []): { isbn10?: string; isbn13?: string } {
        const result: { isbn10?: string; isbn13?: string } = {};
        
        if (Array.isArray(identifiers)) {
            identifiers.forEach(identifier => {
                if (identifier && typeof identifier === 'object') {
                    if (identifier.type === 'ISBN_10') {
                        result.isbn10 = identifier.identifier;
                    } else if (identifier.type === 'ISBN_13') {
                        result.isbn13 = identifier.identifier;
                    }
                }
            });
        }

        return result;
    }

    // Helper method to validate API key
    public async validateApiKey(): Promise<boolean> {
        try {
            const response = await this.searchBooks({ query: 'test', maxResults: 1 });
            return response.kind === 'books#volumes';
        } catch {
            return false;
        }
    }
}
