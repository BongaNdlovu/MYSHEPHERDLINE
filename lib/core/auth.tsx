import { Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { envValidation } from '@/lib/core/env';
import type { AppError } from '@/lib/core/errors';
import { fromAuthError } from '@/lib/core/errors';
import { registerForPushNotifications } from '@/lib/core/notifications';
import { SUPABASE_AUTH_STORAGE_KEY, supabaseAuthStorage } from '@/lib/core/supabase-storage';
import { requireSupabase } from '@/lib/core/supabase';
import { isProfileActive } from '@/lib/core/admin';
import type { Profile } from '@/types/database';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AppError | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: AppError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error || !data) return null;
  return data as Profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }
    const next = await fetchProfile(session.user.id);
    if (next && !isProfileActive(next)) {
      const supabase = requireSupabase();
      await supabase.auth.signOut();
      await supabaseAuthStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
      setProfile(null);
      return;
    }
    setProfile(next);
  }, [session?.user?.id]);

  useEffect(() => {
    if (!envValidation.ok) {
      setLoading(false);
      return;
    }

    const supabase = requireSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }

    void refreshProfile();
    void registerForPushNotifications(session.access_token);
  }, [session?.user?.id, session?.access_token, refreshProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      refreshProfile,
      signIn: async (email, password) => {
        const supabase = requireSupabase();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: fromAuthError(error) };
      },
      signUp: async (email, password, displayName) => {
        const supabase = requireSupabase();
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        return { error: fromAuthError(error) };
      },
      signOut: async () => {
        const supabase = requireSupabase();
        await supabase.auth.signOut();
        await supabaseAuthStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
        setProfile(null);
      },
    }),
    [session, profile, loading, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
