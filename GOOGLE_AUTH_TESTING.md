# Testing Google Authentication

## Prerequisites

Before testing the Google authentication, ensure you have:

1. Set up Google OAuth credentials in your Supabase project
   - Go to Supabase Dashboard > Authentication > Providers
   - Enable Google provider and configure with appropriate credentials
   - Make sure the redirect URL is set correctly (should be `https://[your-project].supabase.co/auth/v1/callback`)

2. Configured environment variables
   - No additional environment variables needed as Supabase handles the OAuth flow

## Testing Checklist

### Basic Authentication Flow

- [ ] Navigate to the sign-in page
- [ ] Verify that the "Google" button appears instead of the previous GitHub button
- [ ] Click on the Google button and check if you're redirected to Google's authentication page
- [ ] Sign in with Google credentials
- [ ] Verify that you're redirected back to the application (to the `/gallery` page)

### User Data Integration

- [ ] Check if a user profile is created in Supabase
- [ ] Verify that user-specific data (like assets, credits, etc.) is accessible
- [ ] Test creating new assets to ensure they're associated with the Google-authenticated user

### Session Management

- [ ] Test if the session persists across page reloads
- [ ] Sign out and verify that you're properly redirected to the sign-in page
- [ ] Confirm that protected routes are no longer accessible after signing out

### Error Handling

- [ ] Test canceling the Google authentication flow (by clicking "Cancel" on Google's auth page)
- [ ] Check if appropriate error messages are displayed
- [ ] Verify that users can retry authentication after errors

## Troubleshooting Common Issues

### Redirect Issues

If the redirect after authentication doesn't work properly:
- Check the OAuth callback route in `/app/auth/callback/route.ts`
- Verify that Supabase project settings have the correct redirect URL

### User Data Access Problems

If user data doesn't appear after authentication:
- Check the `userId` context in the application
- Verify that the Google user ID is correctly associated with the user's data

### Console Errors

- Look for any authentication-related errors in the browser console
- Check Supabase logs for authentication issues

## Notes

- Google authentication provides an email address that's used as the primary identifier
- The user's Google profile information (name, avatar) may be available in the user metadata
- First-time Google sign-ins create new user accounts, returning users will access their existing accounts