import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { clearNativeGoogleSession } from './nativeAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  // `loading` is true only until we've checked whether an existing session
  // is already stored (e.g. the user signed in on a previous visit) -- this
  // avoids a flash of "signed out" UI while that check is in flight.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Keeps session state in sync for every future auth event: sign in,
    // sign out, token refresh, and completing an OAuth (Google) redirect.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const provider = session?.user?.app_metadata?.provider;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    if (provider === 'google') await clearNativeGoogleSession();
  }

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
