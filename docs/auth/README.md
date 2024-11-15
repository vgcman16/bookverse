# Authentication System

The BookVerse authentication system provides a secure and user-friendly way to manage user accounts and access. It includes email/password authentication, Google sign-in integration, and comprehensive user agreement handling.

## Features

### Sign Up
- Email/password registration with validation
- Display name customization
- Password strength requirements
- Terms and Conditions acceptance
- Privacy Policy acceptance
- Google sign-in integration

### Login
- Email/password authentication
- Remember me functionality
- Google sign-in option
- Password reset capability

### Password Reset
- Email-based password reset
- Secure reset link generation
- User-friendly reset flow

### User Agreements
- Terms and Conditions page
- Privacy Policy page
- Agreement acceptance tracking
- Dark mode support

## Implementation Details

### Authentication Service
The `AuthService` class handles all authentication-related operations:
```typescript
class AuthService {
    // Core authentication methods
    signUpWithEmailAndPassword(registration: UserRegistration): Promise<void>
    signInWithEmailAndPassword(email: string, password: string): Promise<void>
    signInWithGoogle(): Promise<void>
    resetPassword(email: string): Promise<void>
    signOut(): Promise<void>

    // User management
    getCurrentUser(): User | null
    updateUserProfile(updates: Partial<User>): Promise<void>
}
```

### View Models
Each authentication screen has its dedicated view model:
- `LoginPageViewModel`: Handles login logic and navigation
- `SignupPageViewModel`: Manages registration and agreement acceptance
- `ForgotPasswordPageViewModel`: Controls password reset flow
- `TermsPageViewModel`: Displays and handles terms acceptance
- `PrivacyPolicyPageViewModel`: Manages privacy policy display and acceptance

### Navigation
Authentication flows use the `NavigationService` for consistent navigation:
```typescript
NavigationService.navigate('features/auth/views/login-page')
NavigationService.navigate('features/auth/views/signup-page')
NavigationService.navigate('features/auth/views/forgot-password-page')
```

## Testing

### Unit Tests
Authentication components are thoroughly tested using Jest:
```typescript
describe('SignupPageViewModel', () => {
    // Form validation tests
    it('should validate display name')
    it('should validate email format')
    it('should validate password requirements')
    it('should validate password confirmation')
    it('should validate terms acceptance')

    // Authentication flow tests
    it('should handle successful registration')
    it('should handle existing email error')
    it('should navigate after successful signup')
})
```

### End-to-End Tests
Detox is used for comprehensive E2E testing:
```typescript
describe('Sign Up Flow', () => {
    it('should show validation errors for empty form')
    it('should validate email format')
    it('should validate password requirements')
    it('should handle terms and privacy policy flow')
    it('should complete successful sign up')
})
```

## Styling

Authentication screens use a consistent styling approach:
- Responsive layouts
- Form validation feedback
- Loading state indicators
- Dark mode support
- Accessibility considerations

### CSS Example
```css
.input {
    border-width: 1;
    border-color: #e0e0e0;
    border-radius: 4;
    padding: 12;
    font-size: 16;
    background-color: #f5f5f5;
}

.error-message {
    color: #dc3545;
    font-size: 14;
    margin-top: 5;
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
    .input {
        background-color: #333333;
        border-color: #444444;
        color: #ffffff;
    }
}
```

## Usage

### Sign Up
```typescript
const authService = AuthService.getInstance();

try {
    await authService.signUpWithEmailAndPassword({
        email: 'user@example.com',
        password: 'securePassword123',
        displayName: 'John Doe'
    });
} catch (error) {
    console.error('Sign up failed:', error);
}
```

### Login
```typescript
try {
    await authService.signInWithEmailAndPassword(
        'user@example.com',
        'password123'
    );
} catch (error) {
    console.error('Login failed:', error);
}
```

### Password Reset
```typescript
try {
    await authService.resetPassword('user@example.com');
    // Show success message
} catch (error) {
    console.error('Password reset failed:', error);
}
```

## Security Considerations

1. Password Requirements
   - Minimum 6 characters
   - Must contain letters and numbers
   - Validated on client and server side

2. Rate Limiting
   - Login attempts limited
   - Password reset requests throttled
   - Account lockout after multiple failures

3. Data Protection
   - Passwords hashed using Firebase Auth
   - Secure session management
   - HTTPS for all communications

4. Error Handling
   - Generic error messages to prevent information leakage
   - Detailed server-side logging
   - Graceful failure recovery

## Future Improvements

1. Additional Authentication Methods
   - Apple Sign-in
   - Phone number verification
   - Two-factor authentication

2. Enhanced Security
   - Biometric authentication
   - Session management improvements
   - Advanced password policies

3. User Experience
   - Social login expansion
   - Progressive form validation
   - Improved error messaging

4. Testing
   - Expanded E2E test coverage
   - Performance testing
   - Security penetration testing
