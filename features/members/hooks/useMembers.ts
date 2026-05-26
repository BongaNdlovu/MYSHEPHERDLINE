import { useCallback, useEffect, useState } from 'react';

import { fetchMemberById, fetchMembers } from '@/features/members/services/members.service';
import type { QueryState } from '@/lib/core/query-types';
import type { Member } from '@/types/database';

export function useMembers(): QueryState<Member[]> {
  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchMembers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load members.');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function useMember(id: string | undefined): QueryState<Member | null> {
  const [data, setData] = useState<Member | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await fetchMemberById(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load member.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
