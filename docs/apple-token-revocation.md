# Sign in with Apple token revocation

The `apple-token` Supabase Edge Function exchanges the short-lived Apple
authorization code after sign-in, encrypts the resulting refresh token, and
revokes it when that user deletes their account.

Before deploying the App Store candidate:

1. Apply `supabase/migrations/20260909130000_add_apple_auth_credentials.sql`.
2. Generate a random 32-byte encryption key and Base64-encode it.
3. Add these Supabase Edge Function secrets:
   - `APPLE_TEAM_ID`
   - `APPLE_KEY_ID`
   - `APPLE_CLIENT_ID` (`com.sfstairwayspotter.app`)
   - `APPLE_PRIVATE_KEY` (the contents of the Apple `.p8` key)
   - `APPLE_TOKEN_ENCRYPTION_KEY` (the Base64-encoded 32-byte key)
4. Deploy the `apple-token` function with JWT verification enabled.
5. On a physical iPhone, create a disposable Sign in with Apple account,
   delete it in Settings, and confirm the authorization is removed under the
   Apple Account's Sign in with Apple settings.

Never put the `.p8` key, encryption key, service-role key, or Apple client
secret in the app bundle or a `VITE_` environment variable.
