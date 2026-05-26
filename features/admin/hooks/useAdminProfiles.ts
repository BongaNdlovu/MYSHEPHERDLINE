import { useCallback, useEffect, useState } from 'react';

import {
  fetchProfiles,
  updateProfileAccess,
  updateProfileRole,
} from '@/features/admin/services/profiles.service';
import type { AppError } from '@/lib/core/errors';
import { toAppError } from '@/lib/core/errors';
import type { QueryState } from '@/lib/core/query-types';
import type { Profile, UserRole } from '@/types/database';

export function useAdminProfiles(): QueryState<Profile[]> & {
  setRole: (userId: string, role: UserRole) => Promise<{ error: AppError | null }>;
  setAccess: (userId: string, isActive: boolean) => Promise<{ error: AppError | null }>;
} {
  const [data, setData] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchProfiles());
      setLastLoadedAt(Date.now());
    } catch (err) {
      setError(toAppError(err, 'Unable to load users.'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setRole = useCallback(
    async (userId: string, role: UserRole) => {
      try {
        const updated = await updateProfileRole(userId, role);
        setData((prev) => prev.map((p) => (p.id === userId ? updated : p)));
        return { error: null };
      } catch (err) {
        return { error: toAppError(err, 'Unable to update role.') };
      }
    },
    [],
  );

  const setAccess = useCallback(
    async (userId: string, isActive: boolean) => {
      try {
        const updated = await updateProfileAccess(userId, isActive);
        setData((prev) => prev.map((p) => (p.id === userId ? updated : p)));
        return { error: null };
      } catch (err) {
        return { error: toAppError(err, 'Unable to update access.') };
      }
    },
    [],
  );

  return { data, loading, error, refresh, lastLoadedAt, isStale: false, setRole, setAccess };
}
