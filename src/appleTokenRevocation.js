import { supabase } from './supabaseClient';

export function userUsesApple(user) {
  if (user?.app_metadata?.provider === 'apple') return true;
  return (user?.identities || []).some((identity) => identity.provider === 'apple');
}

export async function storeAppleAuthorizationCode(authorizationCode) {
  if (!authorizationCode) return { stored: false, reason: 'credential-unavailable' };
  const { data, error } = await supabase.functions.invoke('apple-token', {
    body: { action: 'store', authorizationCode },
  });
  if (error) throw error;
  return data;
}

export async function revokeAppleAuthorization() {
  const { data, error } = await supabase.functions.invoke('apple-token', {
    body: { action: 'revoke' },
  });
  if (error) throw error;
  return data;
}
