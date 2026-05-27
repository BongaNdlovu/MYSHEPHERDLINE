import { useCallback } from 'react';

import {
  fetchProfilesPage,
  updateProfileAccess,
  updateProfileRole,
} from '@/features/admin/services/profiles.service';
import type { AppError } from '@/lib/core/errors';
import { toAppError } from '@/lib/core/errors';
import { usePaginatedQuery } from '@/lib/core/usePaginatedQuery';
import type { PaginatedQueryState } from '@/lib/core/query-types';
import type { Profile, UserRole } from '@/types/database';

export function useAdminProfiles(): PaginatedQueryState<Profile> & {
  setRole: (userId: string, role: UserRole) => Promise<{ error: AppError | null }>;
  setAccess: (userId: string, isActive: boolean) => Promise<{ error: AppError | null }>;
} {
  const fetchPage = useCallback((page: number) => fetchProfilesPage({ page }), []);

  const {
    data,
    setData,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
    page,
    hasMore,
    lastLoadedAt,
    isStale,
  } = usePaginatedQuery({
    fetchPage,
    deps: [],
    errorMessage: 'Unable to load users.',
  });

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
    [setData],
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
    [setData],
  );

  return {
    data,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
    page,
    hasMore,
    lastLoadedAt,
    isStale,
    setRole,
    setAccess,
  };
}
