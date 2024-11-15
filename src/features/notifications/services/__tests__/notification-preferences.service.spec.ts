import { NotificationPreferencesService } from '../notification-preferences.service';
import { AuthService } from '../../../auth/services/auth.service';
import { AuthState } from '../../../auth/models/user.model';
import { NotificationType, NotificationPriority } from '../../models/notification.model';
import { createMockUser, createMockNotificationPreferences } from '../../../../test/utils/test-utils';

// Mock the entire AuthService module
jest.mock('../../../auth/services/auth.service', () => {
    const mockAuthService = {
        getCurrentUser: jest.fn(),
        authState$: {
            subscribe: jest.fn()
        }
    };
    return {
        AuthService: {
            getInstance: jest.fn(() => mockAuthService)
        }
    };
});

describe('NotificationPreferencesService', () => {
    let service: NotificationPreferencesService;
    let mockAuthService: any;
    const mockUser = createMockUser();

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Get the mocked auth service instance
        mockAuthService = (AuthService.getInstance as jest.Mock)();

        // Setup mock implementations
        mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
        mockAuthService.authState$.subscribe.mockImplementation((callback: (state: AuthState) => void) => {
            callback({ user: mockUser, isAuthenticated: true, isLoading: false, error: null });
            return { unsubscribe: jest.fn() };
        });

        // Initialize service
        service = NotificationPreferencesService.getInstance();
    });

    describe('initialization', () => {
        it('should load user preferences on initialization', async () => {
            const prefs = await service.getCurrentPreferences();
            expect(prefs).toBeTruthy();
            expect(prefs?.globalEnabled).toBe(true);
        });

        it('should handle unauthenticated state', async () => {
            mockAuthService.getCurrentUser.mockResolvedValueOnce(null);
            const prefs = await service.getCurrentPreferences();
            expect(prefs).toBeNull();
        });
    });

    describe('preference updates', () => {
        it('should update global enabled state', async () => {
            const result = await service.updatePreferences({
                globalEnabled: false
            });

            expect(result.success).toBe(true);
            expect(result.updatedPreferences?.globalEnabled).toBe(false);
        });

        it('should update category preferences', async () => {
            const result = await service.updateCategoryPreference(
                NotificationType.NewFollower,
                {
                    enabled: false,
                    priority: NotificationPriority.High
                }
            );

            expect(result.success).toBe(true);
            const category = result.updatedPreferences?.categories[NotificationType.NewFollower];
            expect(category?.enabled).toBe(false);
            expect(category?.priority).toBe(NotificationPriority.High);
        });

        it('should update delivery preferences', async () => {
            const result = await service.updateDeliveryPreference(
                NotificationType.NewFollower,
                {
                    push: false,
                    email: false
                }
            );

            expect(result.success).toBe(true);
            const delivery = result.updatedPreferences?.categories[NotificationType.NewFollower].delivery;
            expect(delivery?.push).toBe(false);
            expect(delivery?.email).toBe(false);
            expect(delivery?.inApp).toBe(true); // Unchanged
        });

        it('should update quiet hours', async () => {
            const result = await service.updateQuietHours({
                enabled: true,
                startTime: '23:00',
                endTime: '07:00'
            });

            expect(result.success).toBe(true);
            expect(result.updatedPreferences?.quietHours).toEqual(
                expect.objectContaining({
                    enabled: true,
                    startTime: '23:00',
                    endTime: '07:00'
                })
            );
        });

        it('should update email settings', async () => {
            const result = await service.updateEmailSettings({
                digestFrequency: 'weekly',
                digestTime: '08:00',
                digestDays: ['monday', 'friday']
            });

            expect(result.success).toBe(true);
            expect(result.updatedPreferences?.emailSettings).toEqual(
                expect.objectContaining({
                    digestFrequency: 'weekly',
                    digestTime: '08:00',
                    digestDays: ['monday', 'friday']
                })
            );
        });
    });

    describe('device token management', () => {
        it('should register new device token', async () => {
            const token = 'test-device-token';
            const result = await service.registerDeviceToken(token);

            expect(result.success).toBe(true);
            expect(result.updatedPreferences?.deviceTokens).toContain(token);
        });

        it('should not duplicate existing device token', async () => {
            const token = 'test-device-token';
            await service.registerDeviceToken(token);
            const result = await service.registerDeviceToken(token);

            expect(result.success).toBe(true);
            expect(result.updatedPreferences?.deviceTokens.filter(t => t === token)).toHaveLength(1);
        });

        it('should unregister device token', async () => {
            const token = 'test-device-token';
            await service.registerDeviceToken(token);
            const result = await service.unregisterDeviceToken(token);

            expect(result.success).toBe(true);
            expect(result.updatedPreferences?.deviceTokens).not.toContain(token);
        });
    });

    describe('error handling', () => {
        it('should handle errors when user is not authenticated', async () => {
            mockAuthService.getCurrentUser.mockResolvedValueOnce(null);
            const result = await service.updatePreferences({ globalEnabled: false });

            expect(result.success).toBe(false);
            expect(result.error).toBe('No authenticated user');
        });

        it('should validate preferences before updating', async () => {
            const result = await service.updatePreferences({
                quietHours: {
                    enabled: true,
                    startTime: 'invalid-time', // Invalid time format
                    endTime: '07:00',
                    days: ['monday']
                }
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid preference update');
        });
    });
});
