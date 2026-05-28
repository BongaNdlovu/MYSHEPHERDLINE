import { useCallback, useEffect, useRef, useState } from 'react';

import type { AppError } from '@/lib/core/errors';

type UseAdminEditFormOptions<T> = {
  isEdit: boolean;
  entity: T | null | undefined;
  loading: boolean;
  error: AppError | null;
  refresh: () => Promise<void>;
  hydrate: (entity: T) => void;
};

export function useAdminEditForm<T>({
  isEdit,
  entity,
  loading,
  error,
  refresh,
  hydrate,
}: UseAdminEditFormOptions<T>) {
  const [formReady, setFormReady] = useState(!isEdit);
  const hydratedEntityRef = useRef<T | null | undefined>(undefined);

  useEffect(() => {
    if (!isEdit || !entity || hydratedEntityRef.current === entity) return;
    hydrate(entity);
    hydratedEntityRef.current = entity;
    setFormReady(true);
  }, [entity, hydrate, isEdit]);

  const retryLoad = useCallback(() => {
    hydratedEntityRef.current = undefined;
    setFormReady(false);
    void refresh();
  }, [refresh]);

  return { formReady, retryLoad, loading, error };
}
