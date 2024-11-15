import { Observable } from '@nativescript/core';
import { ChallengeService } from '../services/challenge.service';
import { AuthService } from '../../../features/auth/services/auth.service';
import { NavigationService } from '../../../core/services/navigation.service';
import {
    ReadingChallenge,
    ChallengeType,
    ChallengeStatus,
    ChallengeDifficulty,
    ChallengeFilters
} from '../models/challenge.model';

interface ChallengeViewModel extends ReadingChallenge {
    isParticipating: boolean;
    currentProgress: number;
    status: ChallengeStatus;
}

export class ChallengesPageViewModel extends Observable {
    private challengeService: ChallengeService;
    private authService: AuthService;
    private _challenges: ChallengeViewModel[] = [];
    private _isLoading: boolean = false;
    private _searchQuery: string = '';
    private _isShowingFilters: boolean = false;
    private _selectedType: ChallengeType | undefined = undefined;
    private _selectedStatus: ChallengeStatus | undefined = undefined;
    private _selectedDifficulty: ChallengeDifficulty | undefined = undefined;

    constructor() {
        super();
        this.challengeService = ChallengeService.getInstance();
        this.authService = AuthService.getInstance();
        this.loadChallenges();
    }

    // Getters and Setters
    get challenges(): ChallengeViewModel[] {
        return this._challenges;
    }

    set challenges(value: ChallengeViewModel[]) {
        if (this._challenges !== value) {
            this._challenges = value;
            this.notifyPropertyChange('challenges', value);
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

    get searchQuery(): string {
        return this._searchQuery;
    }

    set searchQuery(value: string) {
        if (this._searchQuery !== value) {
            this._searchQuery = value;
            this.notifyPropertyChange('searchQuery', value);
        }
    }

    get isShowingFilters(): boolean {
        return this._isShowingFilters;
    }

    set isShowingFilters(value: boolean) {
        if (this._isShowingFilters !== value) {
            this._isShowingFilters = value;
            this.notifyPropertyChange('isShowingFilters', value);
        }
    }

    get selectedType(): ChallengeType | undefined {
        return this._selectedType;
    }

    set selectedType(value: ChallengeType | undefined) {
        if (this._selectedType !== value) {
            this._selectedType = value;
            this.notifyPropertyChange('selectedType', value);
        }
    }

    get selectedStatus(): ChallengeStatus | undefined {
        return this._selectedStatus;
    }

    set selectedStatus(value: ChallengeStatus | undefined) {
        if (this._selectedStatus !== value) {
            this._selectedStatus = value;
            this.notifyPropertyChange('selectedStatus', value);
        }
    }

    get selectedDifficulty(): ChallengeDifficulty | undefined {
        return this._selectedDifficulty;
    }

    set selectedDifficulty(value: ChallengeDifficulty | undefined) {
        if (this._selectedDifficulty !== value) {
            this._selectedDifficulty = value;
            this.notifyPropertyChange('selectedDifficulty', value);
        }
    }

    get canCreateChallenge(): boolean {
        return this.authService.getCurrentUser() !== null;
    }

    get challengeTypes(): string[] {
        return Object.values(ChallengeType);
    }

    get challengeStatuses(): string[] {
        return Object.values(ChallengeStatus);
    }

    get challengeDifficulties(): string[] {
        return Object.values(ChallengeDifficulty);
    }

    // Event Handlers
    public onCreateChallenge(): void {
        NavigationService.navigate('challenges/create');
    }

    public onSearch(args: any): void {
        const searchBar = args.object;
        this.searchQuery = searchBar.text;
        this.applyFilters();
    }

    public onClearSearch(): void {
        this.searchQuery = '';
        this.applyFilters();
    }

    public onShowFilters(): void {
        this.isShowingFilters = true;
    }

    public onHideFilters(): void {
        this.isShowingFilters = false;
    }

    public onSelectType(args: any): void {
        const button = args.object;
        this.selectedType = button.text === 'All Types' ? undefined : button.text as ChallengeType;
    }

    public onSelectStatus(args: any): void {
        const button = args.object;
        this.selectedStatus = button.text === 'All Status' ? undefined : button.text as ChallengeStatus;
    }

    public onSelectDifficulty(args: any): void {
        const button = args.object;
        this.selectedDifficulty = button.text === 'All Difficulties' ? undefined : button.text as ChallengeDifficulty;
    }

    public onApplyFilters(): void {
        this.isShowingFilters = false;
        this.applyFilters();
    }

    public async onJoinChallenge(args: any): Promise<void> {
        const challenge = args.object.bindingContext as ChallengeViewModel;
        if (!challenge.isActive) return;

        try {
            await this.challengeService.joinChallenge(challenge.id);
            await this.loadChallenges(); // Refresh list to update status
        } catch (error) {
            console.error('Error joining challenge:', error);
            // TODO: Show error message to user
        }
    }

    public onChallengeItemTap(args: any): void {
        const challenge = args.view.bindingContext as ChallengeViewModel;
        NavigationService.navigate('challenges/details', {
            challengeId: challenge.id
        });
    }

    // Private Helper Methods
    private async loadChallenges(): Promise<void> {
        this.isLoading = true;
        try {
            const user = this.authService.getCurrentUser();
            const challenges = await this.challengeService.getChallenges();
            
            this.challenges = await Promise.all(challenges.map(async challenge => {
                const progress = user ? 
                    await this.challengeService.getChallengeProgress(challenge.id, user.id) :
                    null;

                return {
                    ...challenge,
                    isParticipating: progress !== null,
                    currentProgress: progress?.currentProgress || 0,
                    status: progress?.status || ChallengeStatus.NotStarted
                };
            }));

            this.applyFilters();
        } catch (error) {
            console.error('Error loading challenges:', error);
            // TODO: Show error message to user
        } finally {
            this.isLoading = false;
        }
    }

    private applyFilters(): void {
        const filters: ChallengeFilters = {
            type: this.selectedType,
            status: this.selectedStatus,
            difficulty: this.selectedDifficulty,
            isActive: true
        };

        let filteredChallenges = this._challenges;

        // Apply search query
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filteredChallenges = filteredChallenges.filter(challenge =>
                challenge.title.toLowerCase().includes(query) ||
                challenge.description.toLowerCase().includes(query)
            );
        }

        // Apply type filter
        if (filters.type) {
            filteredChallenges = filteredChallenges.filter(challenge =>
                challenge.type === filters.type
            );
        }

        // Apply status filter
        if (filters.status) {
            filteredChallenges = filteredChallenges.filter(challenge =>
                challenge.status === filters.status
            );
        }

        // Apply difficulty filter
        if (filters.difficulty) {
            filteredChallenges = filteredChallenges.filter(challenge =>
                challenge.difficulty === filters.difficulty
            );
        }

        // Update the challenges list
        this.challenges = filteredChallenges;
    }
}
