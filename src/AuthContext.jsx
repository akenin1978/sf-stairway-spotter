import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import { clearNativeGoogleSession } from './nativeAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  // `loading` is true only until we've checked whether an existing session
  // is already stored (e.g. the user signed in on a previous visit) -- this
  // avoids a flash of "signed out" UI while that check is in flight.
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const signingOutRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!signingOutRef.current) setSession(session);
      setLoading(false);
    });

    // Keeps session state in sync for every future auth event: sign in,
    // sign out, token refresh, and completing an OAuth (Google) redirect.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // A token/session event already in flight must not restore the account
        // after the person has pressed Log out.
        if (signingOutRef.current && event !== 'SIGNED_OUT') return;
        setSession(session);
        if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const provider = session?.user?.app_metadata?.provider;
    signingOutRef.current = true;
    setSigningOut(true);
    // Clear the app's account immediately so account-scoped work cannot flash
    // stale UI while the network sign-out request is still finishing.
    setSession(null);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      if (provider === 'google') await clearNativeGoogleSession();
    } catch (error) {
      // If sign-out failed, restore the real session rather than leaving the
      // app in a misleading half-signed-out state.
      const { data } = await supabase.auth.getSession();
      setSession(data?.session ?? null);
      throw error;
    } finally {
      signingOutRef.current = false;
      setSigningOut(false);
    }
  }

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signingOut,
    signOut,
    passwordRecovery,
    finishPasswordRecovery: () => setPasswordRecovery(false),
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
