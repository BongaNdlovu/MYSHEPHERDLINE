import { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { registerForPushNotifications } from '@/lib/notifications';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error || !data) return null;
  return data as Profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }
    setProfile(await fetchProfile(session.user.id));
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

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
  }, [session?.user?.id, session?.access_token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      refreshProfile,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      signUp: async (email, password, displayName) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) return { error: error.message };
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            display_name: displayName,
            role: 'shepherd',
          });
        }
        return { error: null };
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
      },
    }),
    [session, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
