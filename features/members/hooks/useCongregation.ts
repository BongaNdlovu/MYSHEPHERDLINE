import { useCallback } from 'react';

import { fetchCongregationContext, type CongregationContext } from '@/lib/core/organization';
import { useAuth } from '@/lib/core/auth';
import { useQuery } from '@/lib/core/useQuery';

const emptyContext: CongregationContext | null = null;

export function useCongregation() {
  const { profile } = useAuth();

  const fetch = useCallback(async () => {
    if (!profile) return emptyContext;
    return fetchCongregationContext();
  }, [profile]);

  const { data: context, loading, error, refresh } = useQuery({
    deps: [profile?.id],
    enabled: Boolean(profile),
    errorMessage: 'Unable to load congregation.',
    initialData: emptyContext,
    fetch,
    dataLength: (value) => (value ? 1 : 0),
  });

  const congregationLabel = context
    ? context.district
      ? `${context.organization.name} · ${context.district.name}`
      : context.organization.name
    : null;

  return { context, congregationLabel, loading, error, refresh };
}
