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
import { createAppError, fromAuthError, fromSupabaseError } from '@/lib/core/errors';
import { registerForPushNotifications } from '@/lib/core/notifications';
import { shouldRegisterPushForSession } from '@/lib/core/push-registration';
import { SUPABASE_AUTH_STORAGE_KEY, supabaseAuthStorage } from '@/lib/core/supabase-storage';
import { requireSupabase } from '@/lib/core/supabase';
import { isProfileActive } from '@/lib/core/admin';
import type { Profile } from '@/types/database';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  profileError: AppError | null;
  signIn: (email: string, password: string) => Promise<{ error: AppError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<AppError | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type FetchProfileResult =
  | { kind: 'ok'; profile: Profile }
  | { kind: 'missing' }
  | { kind: 'error'; error: AppError };

async function fetchProfile(userId: string): Promise<FetchProfileResult> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, organization_id, email, display_name, role, is_active, preferred_district_id, preferred_organization_id, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return { kind: 'error', error: fromSupabaseError(error, 'Unable to load your profile.') };
  }
  if (!data) return { kind: 'missing' };
  return { kind: 'ok', profile: data as Profile };
}

const DEACTIVATED_ACCOUNT_MESSAGE =
  'Your account is not active. Contact your congregation administrator for access.';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(envValidation.ok);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<AppError | null>(null);
  const lastRegisteredPushUserIdRef = useRef<string | null>(null);
  const pushRegistrationInFlightUserIdRef = useRef<string | null>(null);

  const clearInactiveSession = useCallback(async () => {
    const supabase = requireSupabase();
    await supabase.auth.signOut();
    await supabaseAuthStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
    setProfile(null);
    setSession(null);
    setProfileLoading(false);
    setProfileError(null);
  }, []);

  const applyProfileResult = useCallback(
    async (result: FetchProfileResult): Promise<AppError | null> => {
      if (result.kind === 'error') {
        return result.error;
      }
      if (result.kind === 'missing' || !isProfileActive(result.profile)) {
        await clearInactiveSession();
        return createAppError('auth', DEACTIVATED_ACCOUNT_MESSAGE);
      }
      setProfile(result.profile);
      return null;
    },
    [clearInactiveSession],
  );

  const refreshProfile = useCallback(async (): Promise<AppError | null> => {
    const userId = session?.user?.id;
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      setProfileError(null);
      return null;
    }

    setProfileLoading(true);
    setProfileError(null);
    try {
      const result = await fetchProfile(userId);
      if (result.kind === 'error') {
        console.warn('[auth] refreshProfile failed:', result.error.message);
        setProfileError(result.error);
        return result.error;
      }
      if (result.kind === 'missing' || !isProfileActive(result.profile)) {
        await clearInactiveSession();
        const error = createAppError('auth', DEACTIVATED_ACCOUNT_MESSAGE);
        setProfileError(error);
        return error;
      }
      setProfile(result.profile);
      return null;
    } catch (err) {
      console.warn('[auth] refreshProfile unexpected error:', err);
      const error = createAppError('unknown', 'Unable to load your profile.');
      setProfileError(error);
      return error;
    } finally {
      setProfileLoading(false);
    }
  }, [clearInactiveSession, session?.user?.id]);

  useEffect(() => {
    if (!envValidation.ok) return;

    let active = true;
    const supabase = requireSupabase();

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        if (!data.session) setProfile(null);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[auth] getSession failed:', err);
        if (!active) return;
        setSession(null);
        setProfile(null);
        setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setProfileLoading(false);
        setProfileError(null);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = session?.user?.id ?? null;
    const accessToken = session?.access_token ?? null;

    if (!userId) {
      lastRegisteredPushUserIdRef.current = null;
      pushRegistrationInFlightUserIdRef.current = null;
      return;
    }

    const timer = setTimeout(() => {
      void refreshProfile().catch((err) => {
        console.warn('[auth] refreshProfile rejected:', err);
      });
    }, 0);

    if (
      shouldRegisterPushForSession({
        userId,
        accessToken,
        lastRegisteredUserId: lastRegisteredPushUserIdRef.current,
        inFlightUserId: pushRegistrationInFlightUserIdRef.current,
      })
    ) {
      if (!accessToken) return () => clearTimeout(timer);
      pushRegistrationInFlightUserIdRef.current = userId;
      void registerForPushNotifications(accessToken)
        .then((result) => {
          if (pushRegistrationInFlightUserIdRef.current === userId) {
            pushRegistrationInFlightUserIdRef.current = null;
            if (!result.error) {
              lastRegisteredPushUserIdRef.current = userId;
            }
          }

          if (result.error) {
            console.warn('[notifications] registration failed:', result.error);
          }
        })
        .catch((err) => {
          if (pushRegistrationInFlightUserIdRef.current === userId) {
            pushRegistrationInFlightUserIdRef.current = null;
          }
          console.warn('[notifications] registration rejected:', err);
        });
    }

    return () => clearTimeout(timer);
  }, [session?.user?.id, session?.access_token, refreshProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const supabase = requireSupabase();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          return { error: fromAuthError(error) };
        }
        const userId = data.user?.id;
        if (!userId) {
          return { error: createAppError('auth', 'Unable to sign in. Please try again.') };
        }
        return { error: await applyProfileResult(await fetchProfile(userId)) };
      } catch (err) {
        console.warn('[auth] signIn failed:', err);
        return { error: createAppError('unknown', 'Unable to sign in. Please try again.') };
      }
    },
    [applyProfileResult],
  );

  const signOut = useCallback(async () => {
    try {
      const supabase = requireSupabase();
      await supabase.auth.signOut();
      await supabaseAuthStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
      setProfile(null);
      setProfileLoading(false);
      setProfileError(null);
    } catch (err) {
      console.warn('[auth] signOut failed:', err);
      setProfile(null);
      setProfileLoading(false);
      setProfileError(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      profileLoading,
      profileError,
      refreshProfile,
      signIn,
      signOut,
    }),
    [session, profile, loading, profileLoading, profileError, refreshProfile, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
