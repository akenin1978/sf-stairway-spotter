const SUPPORTED_IDENTITY_PROVIDERS = new Set(['apple', 'google', 'email']);

export function currentIdentityProvider(user) {
  const sessionProvider = user?.app_metadata?.provider;
  if (SUPPORTED_IDENTITY_PROVIDERS.has(sessionProvider)) return sessionProvider;

  const identityProviders = (user?.identities || []).map(
    (identity) => identity.provider
  );
  if (identityProviders.includes('google')) return 'google';
  if (identityProviders.includes('apple')) return 'apple';
  return identityProviders[0] || 'email';
}
