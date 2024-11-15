import { Observable } from '@nativescript/core';

interface Book {
    title: string;
    author: string;
    coverUrl: string;
    progress: number;
}

interface BookClub {
    name: string;
    memberCount: number;
    clubImage: string;
}

export class HomePageViewModel extends Observable {
    private _currentlyReading: Book[];
    private _bookClubs: BookClub[];
    private _booksReadCount: number;
    private _reviewsCount: number;

    constructor() {
        super();
        
        // Initialize with mock data
        this._currentlyReading = [
            {
                title: "The Midnight Library",
                author: "Matt Haig",
                coverUrl: "~/assets/images/midnight-library.jpg",
                progress: 65
            },
            {
                title: "Project Hail Mary",
                author: "Andy Weir",
                coverUrl: "~/assets/images/project-hail-mary.jpg",
                progress: 30
            }
        ];

        this._bookClubs = [
            {
                name: "Sci-Fi Enthusiasts",
                memberCount: 128,
                clubImage: "~/assets/images/sci-fi-club.jpg"
            },
            {
                name: "Mystery Readers",
                memberCount: 95,
                clubImage: "~/assets/images/mystery-club.jpg"
            }
        ];

        this._booksReadCount = 23;
        this._reviewsCount = 15;
    }

    get currentlyReading(): Book[] {
        return this._currentlyReading;
    }

    get bookClubs(): BookClub[] {
        return this._bookClubs;
    }

    get booksReadCount(): number {
        return this._booksReadCount;
    }

    get reviewsCount(): number {
        return this._reviewsCount;
    }

    public onMyLibraryTap(): void {
        // TODO: Navigate to library page
        console.log("Navigating to library...");
    }

    public onDiscoverTap(): void {
        // TODO: Navigate to discover page
        console.log("Navigating to discover...");
    }

    public onBookClubTap(args: any): void {
        const club = args.view.bindingContext;
        // TODO: Navigate to book club page
        console.log(`Navigating to ${club.name}...`);
    }

    public onBookTap(args: any): void {
        const book = args.view.bindingContext;
        // TODO: Navigate to book details page
        console.log(`Navigating to ${book.title}...`);
    }
}
