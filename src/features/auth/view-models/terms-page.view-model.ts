import { Observable } from '@nativescript/core';
import { NavigationService } from '../../../core/services/navigation.service';

export class TermsPageViewModel extends Observable {
    private navigationService: NavigationService;
    private acceptCallback: ((accepted: boolean) => void) | null = null;

    public lastUpdated: string = '2024-01-01';
    public showAcceptButton: boolean = false;

    constructor() {
        super();
        this.navigationService = NavigationService.getInstance();
    }

    public onNavigatingTo(args: any) {
        const page = args.object;
        const context = page.navigationContext;

        if (context) {
            this.showAcceptButton = context.showAcceptButton || false;
            this.acceptCallback = context.acceptCallback || null;
        }

        this.notifyPropertyChange('showAcceptButton', this.showAcceptButton);
    }

    public onAcceptTerms() {
        if (this.acceptCallback) {
            this.acceptCallback(true);
        }
        this.navigationService.back();
    }

    public onBackButtonTap() {
        if (this.acceptCallback) {
            this.acceptCallback(false);
        }
        this.navigationService.back();
    }
}
