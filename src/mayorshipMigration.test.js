import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL(
    '../supabase/migrations/20260830120000_add_verified_visits_and_mayorships.sql',
    import.meta.url
  ),
  'utf8'
);

describe('verified visit and mayorship database rules', () => {
  it('limits each user to one qualifying visit per stairway and SF day', () => {
    expect(migration).toMatch(
      /unique\s*\(user_id,\s*stairway_id,\s*visit_date\)/i
    );
    expect(migration).toContain("timezone('America/Los_Angeles', now())");
  });

  it('requires two active visits before awarding a mayorship', () => {
    expect(migration).toMatch(/having\s+count\(\*\)\s*>=\s*2/i);
  });

  it('records leaderboard eligibility at the time of each visit', () => {
    expect(migration).toContain('mayorship_eligible boolean not null default false');
    expect(migration).toContain('counts_for_mayorship');
  });

  it('permanently forfeits prior mayorship eligibility after opting out', () => {
    expect(migration).toContain(
      'reset_mayorships_on_leaderboard_opt_out'
    );
    expect(migration).toMatch(
      /update public\.verified_visits\s+set mayorship_eligible = false/i
    );
    expect(migration).toContain(
      'after update of leaderboard_opt_in on public.user_settings'
    );
    expect(migration).toContain(
      'from public.refresh_stairway_mayor(affected_stairway_id)'
    );
  });

  it('keeps private history private and masks blocked display names', () => {
    expect(migration).toContain('(select auth.uid()) = user_id');
    expect(migration).toContain('from public.blocked_users as blocks');
    expect(migration).toContain('current_mayor_name := null');
  });
});
