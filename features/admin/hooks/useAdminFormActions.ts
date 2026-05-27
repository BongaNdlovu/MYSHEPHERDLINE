import { useCallback, useState } from 'react';

import { getUserMessage, toAppError } from '@/lib/core/errors';
import { useToast } from '@/lib/core/toast';

type UseAdminFormActionsOptions = {
  saveFallbackMessage: string;
  removeFallbackMessage: string;
};

export function useAdminFormActions({
  saveFallbackMessage,
  removeFallbackMessage,
}: UseAdminFormActionsOptions) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const runSave = useCallback(
    async (operation: () => Promise<void>) => {
      setSaving(true);
      setSubmitError(null);
      try {
        await operation();
      } catch (err) {
        setSubmitError(getUserMessage(toAppError(err, saveFallbackMessage)));
      } finally {
        setSaving(false);
      }
    },
    [saveFallbackMessage],
  );

  const runRemove = useCallback(
    async (operation: () => Promise<void>, successMessage: string, onDone: () => void) => {
      setSaving(true);
      setSubmitError(null);
      try {
        await operation();
        showToast(successMessage);
        onDone();
      } catch (err) {
        setSubmitError(getUserMessage(toAppError(err, removeFallbackMessage)));
      } finally {
        setSaving(false);
      }
    },
    [removeFallbackMessage, showToast],
  );

  return { saving, submitError, setSubmitError, runSave, runRemove };
}
