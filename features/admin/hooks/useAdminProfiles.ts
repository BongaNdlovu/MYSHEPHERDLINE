import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  fetchProfilesPage,
  updateProfileAccess,
  updateProfileRole,
} from '@/features/admin/services/profiles.service';
import type { AppError } from '@/lib/core/errors';
import { toAppError } from '@/lib/core/errors';
import { computeIsStale, type PaginatedQueryState } from '@/lib/core/query-types';
import type { Profile, UserRole } from '@/types/database';

export function useAdminProfiles(): PaginatedQueryState<Profile> & {
  setRole: (userId: string, role: UserRole) => Promise<{ error: AppError | null }>;
  setAccess: (userId: string, isActive: boolean) => Promise<{ error: AppError | null }>;
} {
  const [data, setData] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const loadingMoreRef = useRef(false);

  const loadPage = useCallback(async (pageToLoad: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else {
      setLoading(true);
      setError(null);
    }

    try {
      const result = await fetchProfilesPage({ page: pageToLoad });
      setData((current) => (append ? [...current, ...result.items] : result.items));
      setPage(result.page);
      setHasMore(result.hasMore);
      setLastLoadedAt(Date.now());
    } catch (err) {
      setError(toAppError(err, 'Unable to load users.'));
      if (!append) setData([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadPage(0, false);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    try {
      await loadPage(page + 1, true);
    } finally {
      loadingMoreRef.current = false;
    }
  }, [hasMore, loadPage, loading, loadingMore, page]);

  useEffect(() => {
    void loadPage(0, false);
  }, [loadPage]);

  const setRole = useCallback(async (userId: string, role: UserRole) => {
    try {
      const updated = await updateProfileRole(userId, role);
      setData((prev) => prev.map((p) => (p.id === userId ? updated : p)));
      return { error: null };
    } catch (err) {
      return { error: toAppError(err, 'Unable to update role.') };
    }
  }, []);

  const setAccess = useCallback(async (userId: string, isActive: boolean) => {
    try {
      const updated = await updateProfileAccess(userId, isActive);
      setData((prev) => prev.map((p) => (p.id === userId ? updated : p)));
      return { error: null };
    } catch (err) {
      return { error: toAppError(err, 'Unable to update access.') };
    }
  }, []);

  const isStale = useMemo(
    () => computeIsStale({ loading, loadingMore, error, lastLoadedAt, dataLength: data.length }),
    [data.length, error, lastLoadedAt, loading, loadingMore],
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
