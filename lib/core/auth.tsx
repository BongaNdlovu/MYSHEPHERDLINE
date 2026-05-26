import { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

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
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, organization_id, email, display_name, role, is_active, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<Session | null>(null);
  sessionRef.current = session;

  const refreshProfile = useCallback(async () => {
    const userId = sessionRef.current?.user?.id;
    if (!userId) {
      setProfile(null);
      return;
    }

    try {
      const next = await fetchProfile(userId);
      if (next && !isProfileActive(next)) {
        const supabase = requireSupabase();
        await supabase.auth.signOut();
        await supabaseAuthStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
        setProfile(null);
        return;
      }
      setProfile(next);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!envValidation.ok) {
      setLoading(false);
      return;
    }

    let active = true;
    const supabase = requireSupabase();

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }

    void refreshProfile().catch(() => undefined);
    void registerForPushNotifications(session.access_token).catch(() => null);
  }, [session?.user?.id, session?.access_token, refreshProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = requireSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: fromAuthError(error) };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = requireSupabase();
    await supabase.auth.signOut();
    await supabaseAuthStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      refreshProfile,
      signIn,
      signOut,
    }),
    [session, profile, loading, refreshProfile, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
