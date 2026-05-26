import { useCallback, useEffect, useState } from 'react';

import { requireSupabase } from '@/lib/supabase';
import type { Member } from '@/types/database';

type QueryState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useMembers(): QueryState<Member[]> {
  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = requireSupabase();
      const { data: rows, error: queryError } = await supabase
        .from('members')
        .select('*')
        .order('full_name');
      if (queryError) throw new Error(queryError.message);
      setData((rows ?? []) as Member[]);
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
      const supabase = requireSupabase();
      const { data: row, error: queryError } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (queryError) throw new Error(queryError.message);
      setData((row as Member | null) ?? null);
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
