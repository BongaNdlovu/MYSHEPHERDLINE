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
  const formInitializedRef = useRef(false);

  useEffect(() => {
    if (!isEdit || !entity || formInitializedRef.current) return;
    hydrate(entity);
    formInitializedRef.current = true;
    setFormReady(true);
  }, [entity, hydrate, isEdit]);

  const retryLoad = useCallback(() => {
    formInitializedRef.current = false;
    setFormReady(false);
    void refresh();
  }, [refresh]);

  return { formReady, retryLoad, loading, error };
}
