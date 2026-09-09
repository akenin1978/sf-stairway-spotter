-- Apple refresh tokens are retained only so Sign in with Apple authorization
-- can be revoked when the corresponding app account is deleted.
create table if not exists public.apple_auth_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_refresh_token text not null,
  encryption_iv text not null,
  updated_at timestamptz not null default now()
);

alter table public.apple_auth_credentials enable row level security;

-- The Edge Function uses the service role, which bypasses RLS. No browser or
-- signed-in app session may read or write these credentials directly.
revoke all on table public.apple_auth_credentials from public, anon, authenticated;

comment on table public.apple_auth_credentials is
  'Server-only encrypted Apple refresh tokens used for account-deletion revocation.';
