import { SignupPageViewModel } from '../signup-page.view-model';
import { AuthService } from '../../services/auth.service';
import { NavigationService } from '../../../../core/services/navigation.service';

jest.mock('../../services/auth.service');
jest.mock('../../../../core/services/navigation.service');

describe('SignupPageViewModel', () => {
    let viewModel: SignupPageViewModel;
    let mockAuthService: jest.Mocked<AuthService>;
    let mockNavigationService: jest.Mocked<NavigationService>;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup mocks
        mockAuthService = {
            getInstance: jest.fn().mockReturnThis(),
            signUpWithEmailAndPassword: jest.fn()
        } as unknown as jest.Mocked<AuthService>;

        mockNavigationService = {
            getInstance: jest.fn().mockReturnThis(),
            navigate: jest.fn()
        } as unknown as jest.Mocked<NavigationService>;

        // Mock static getInstance methods
        (AuthService.getInstance as jest.Mock).mockReturnValue(mockAuthService);
        (NavigationService.getInstance as jest.Mock).mockReturnValue(mockNavigationService);

        viewModel = new SignupPageViewModel();
    });

    describe('Form Validation', () => {
        it('should validate display name', async () => {
            // Empty display name
            viewModel.displayName = '';
            await viewModel.onSignUp();
            expect(viewModel.displayNameError).toBe('Display name is required');

            // Too short display name
            viewModel.displayName = 'a';
            await viewModel.onSignUp();
            expect(viewModel.displayNameError).toBe('Display name must be at least 2 characters');

            // Valid display name
            viewModel.displayName = 'John Doe';
            await viewModel.onSignUp();
            expect(viewModel.displayNameError).toBe('');
        });

        it('should validate email', async () => {
            // Empty email
            viewModel.email = '';
            await viewModel.onSignUp();
            expect(viewModel.emailError).toBe('Email is required');

            // Invalid email format
            viewModel.email = 'invalid-email';
            await viewModel.onSignUp();
            expect(viewModel.emailError).toBe('Please enter a valid email address');

            // Valid email
            viewModel.email = 'test@example.com';
            await viewModel.onSignUp();
            expect(viewModel.emailError).toBe('');
        });

        it('should validate password', async () => {
            // Empty password
            viewModel.password = '';
            await viewModel.onSignUp();
            expect(viewModel.passwordError).toBe('Password is required');

            // Too short password
            viewModel.password = '12345';
            await viewModel.onSignUp();
            expect(viewModel.passwordError).toBe('Password must be at least 6 characters');

            // Password without letters
            viewModel.password = '123456';
            await viewModel.onSignUp();
            expect(viewModel.passwordError).toBe('Password must contain both letters and numbers');

            // Password without numbers
            viewModel.password = 'abcdef';
            await viewModel.onSignUp();
            expect(viewModel.passwordError).toBe('Password must contain both letters and numbers');

            // Valid password
            viewModel.password = 'abc123';
            await viewModel.onSignUp();
            expect(viewModel.passwordError).toBe('');
        });

        it('should validate password confirmation', async () => {
            // Empty confirmation
            viewModel.password = 'abc123';
            viewModel.confirmPassword = '';
            await viewModel.onSignUp();
            expect(viewModel.confirmPasswordError).toBe('Please confirm your password');

            // Mismatched passwords
            viewModel.confirmPassword = 'abc124';
            await viewModel.onSignUp();
            expect(viewModel.confirmPasswordError).toBe('Passwords do not match');

            // Matching passwords
            viewModel.confirmPassword = 'abc123';
            await viewModel.onSignUp();
            expect(viewModel.confirmPasswordError).toBe('');
        });

        it('should validate terms and privacy acceptance', async () => {
            // Neither accepted
            viewModel.acceptTerms = false;
            viewModel.acceptPrivacy = false;
            await viewModel.onSignUp();
            expect(viewModel.errorMessage).toBe('Please accept both Terms and Conditions and Privacy Policy');

            // Only terms accepted
            viewModel.acceptTerms = true;
            viewModel.acceptPrivacy = false;
            await viewModel.onSignUp();
            expect(viewModel.errorMessage).toBe('Please accept both Terms and Conditions and Privacy Policy');

            // Only privacy accepted
            viewModel.acceptTerms = false;
            viewModel.acceptPrivacy = true;
            await viewModel.onSignUp();
            expect(viewModel.errorMessage).toBe('Please accept both Terms and Conditions and Privacy Policy');

            // Both accepted
            viewModel.acceptTerms = true;
            viewModel.acceptPrivacy = true;
            await viewModel.onSignUp();
            expect(viewModel.errorMessage).toBe('');
        });
    });

    describe('Sign Up Process', () => {
        beforeEach(() => {
            // Set valid form data
            viewModel.displayName = 'John Doe';
            viewModel.email = 'test@example.com';
            viewModel.password = 'abc123';
            viewModel.confirmPassword = 'abc123';
            viewModel.acceptTerms = true;
            viewModel.acceptPrivacy = true;
        });

        it('should call auth service with correct data on successful validation', async () => {
            await viewModel.onSignUp();

            expect(mockAuthService.signUpWithEmailAndPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'abc123',
                displayName: 'John Doe'
            });
        });

        it('should navigate to home page on successful sign up', async () => {
            await viewModel.onSignUp();

            expect(mockNavigationService.navigate).toHaveBeenCalledWith(
                'features/home/views/home-page',
                expect.objectContaining({ clearHistory: true })
            );
        });

        it('should handle auth service errors', async () => {
            const error = { code: 'auth/email-already-in-use' };
            mockAuthService.signUpWithEmailAndPassword.mockRejectedValue(error);

            await viewModel.onSignUp();

            expect(viewModel.emailError).toBe('This email is already registered');
            expect(mockNavigationService.navigate).not.toHaveBeenCalled();
        });
    });

    describe('Navigation', () => {
        it('should navigate to terms page with callback', () => {
            viewModel.onViewTerms();

            expect(mockNavigationService.navigate).toHaveBeenCalledWith(
                'features/auth/views/terms-page',
                expect.objectContaining({
                    showAcceptButton: true,
                    acceptCallback: expect.any(Function)
                })
            );
        });

        it('should navigate to privacy policy page with callback', () => {
            viewModel.onViewPrivacy();

            expect(mockNavigationService.navigate).toHaveBeenCalledWith(
                'features/auth/views/privacy-policy-page',
                expect.objectContaining({
                    showAcceptButton: true,
                    acceptCallback: expect.any(Function)
                })
            );
        });

        it('should navigate to login page', () => {
            viewModel.onBackToLogin();

            expect(mockNavigationService.navigate).toHaveBeenCalledWith(
                'features/auth/views/login-page'
            );
        });
    });
});
