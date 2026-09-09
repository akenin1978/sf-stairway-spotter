import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');

describe('loading recovery and deletion security', () => {
  it('offers retry actions for major loading failures', () => {
    const map = read('./components/StairwayMap.jsx');
    const friends = read('./components/FriendsModal.jsx');
    const leaderboard = read('./components/LeaderboardModal.jsx');
    const stats = read('./components/StatsModal.jsx');
    const badges = read('./components/BadgesModal.jsx');
    const settings = read('./components/SettingsModal.jsx');
    expect(map).toContain('setLoadAttempt((attempt) => attempt + 1)');
    expect(map).toContain('onClick={handleCheckInNearby}>Retry');
    expect(friends).toContain('onClick={refresh}>Retry');
    expect(leaderboard).toContain('onClick={loadLeaderboard}>Retry');
    expect(stats).toContain('setLoadAttempt((attempt) => attempt + 1)');
    expect(badges).toContain('setLoadAttempt((attempt) => attempt + 1)');
    expect(settings).toContain('setSettingsLoadAttempt((attempt) => attempt + 1)');
  });

  it('requires fresh identity confirmation before account deletion', () => {
    const settings = read('./components/SettingsModal.jsx');
    expect(settings).toContain('Confirm your identity');
    expect(settings).toContain('signInWithPassword');
    expect(settings).toContain('signInWithNativeProvider(provider)');
    expect(settings).toContain('await onConfirmed()');
  });

  it('defines a private self-service account deletion function', () => {
    const migration = read(
      '../supabase/migrations/20260909160000_add_account_deletion.sql'
    );
    expect(migration).toContain('security definer');
    expect(migration).toContain('current_user_id uuid := auth.uid()');
    expect(migration).toContain('delete from auth.users');
    expect(migration).toContain('revoke execute on function public.delete_my_account() from anon');
    expect(migration).toContain('grant execute on function public.delete_my_account() to authenticated');
  });

  it('keeps friend removal inside the overflow menu', () => {
    const friends = read('./components/FriendsModal.jsx');
    const safetyMenu = read('./components/ReportUserModal.jsx');
    expect(friends).toContain('onRemove={() => confirmRemoveFriend(f)}');
    expect(safetyMenu).toContain('Remove friend');
  });

  it('stores and revokes Apple authorization credentials server-side', () => {
    const nativeAuth = read('./nativeAuth.js');
    const settings = read('./components/SettingsModal.jsx');
    const client = read('./appleTokenRevocation.js');
    const edgeFunction = read('../supabase/functions/apple-token/index.ts');
    const migration = read('../supabase/migrations/20260909130000_add_apple_auth_credentials.sql');

    expect(nativeAuth).toContain('storeAppleAuthorizationCode');
    expect(settings).toContain('await revokeAppleAuthorization()');
    expect(client).toContain("body: { action: 'revoke' }");
    expect(edgeFunction).toContain("appleRequest('revoke'");
    expect(edgeFunction).toContain('AES-GCM');
    expect(migration).toContain('revoke all on table public.apple_auth_credentials');
  });
});
