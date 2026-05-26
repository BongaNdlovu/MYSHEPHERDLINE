import { useCallback, useEffect, useState } from 'react';

import { fetchMemberById, fetchMembers } from '@/features/members/services/members.service';
import type { AppError } from '@/lib/core/errors';
import { createAppError, notFoundError, toAppError } from '@/lib/core/errors';
import type { QueryState } from '@/lib/core/query-types';
import type { Member } from '@/types/database';

export function useMembers(): QueryState<Member[]> {
  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchMembers());
      setLastLoadedAt(Date.now());
    } catch (err) {
      setError(toAppError(err, 'Unable to load members.'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh, lastLoadedAt, isStale: false };
}

export function useMember(id: string | undefined): QueryState<Member | null> {
  const [data, setData] = useState<Member | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<AppError | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      setError(createAppError('validation', 'Member id is required.'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const member = await fetchMemberById(id);
      if (!member) {
        setData(null);
        setError(notFoundError('Member'));
        return;
      }
      setData(member);
      setLastLoadedAt(Date.now());
    } catch (err) {
      setError(toAppError(err, 'Unable to load member.'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh, lastLoadedAt, isStale: false };
}
