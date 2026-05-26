import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastContextValue = {
  message: string | null;
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback((nextMessage: string) => {
    setMessage(nextMessage);
    setTimeout(() => setMessage(null), 2200);
  }, []);

  const value = useMemo(() => ({ message, showToast }), [message, showToast]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
