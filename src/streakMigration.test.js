import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL(
    '../supabase/migrations/20260909170000_fix_verified_streak_history.sql',
    import.meta.url
  ),
  'utf8'
);

describe('verified streak history migration', () => {
  it('combines legacy and repeat visits in the San Francisco calendar', () => {
    expect(migration).toContain('public.check_ins');
    expect(migration).toContain('public.verified_visits');
    expect(migration).toContain("timezone('America/Los_Angeles'");
    expect(migration).toContain("verification_method = 'photo-verified'");
  });

  it('keeps the streak private to the authenticated user', () => {
    expect(migration.match(/auth\.uid\(\)/g)).toHaveLength(2);
    expect(migration).toContain('security definer');
    expect(migration).toContain(
      'revoke execute on function public.get_my_streak() from anon'
    );
    expect(migration).toContain(
      'grant execute on function public.get_my_streak() to authenticated'
    );
  });
});
