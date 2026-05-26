export type AppErrorCategory =
  | 'config'
  | 'network'
  | 'auth'
  | 'forbidden'
  | 'validation'
  | 'not_found'
  | 'server'
  | 'unknown';

export type AppError = {
  category: AppErrorCategory;
  message: string;
  retryable: boolean;
  field?: string;
  code?: string;
  details?: string;
};

const RETRYABLE: Record<AppErrorCategory, boolean> = {
  config: false,
  network: true,
  auth: false,
  forbidden: false,
  validation: false,
  not_found: false,
  server: true,
  unknown: true,
};

const DEFAULT_MESSAGES: Record<AppErrorCategory, string> = {
  config: 'App configuration is incomplete.',
  network: 'Unable to reach the server. Check your connection and try again.',
  auth: 'Sign in to continue.',
  forbidden: 'You do not have permission to do that.',
  validation: 'Check the highlighted fields and try again.',
  not_found: 'The requested item was not found.',
  server: 'Something went wrong on our side. Please try again.',
  unknown: 'Something went wrong. Please try again.',
};

const USER_SAFE_AUTH_MESSAGES = [
  'Invalid login credentials',
  'Email not confirmed',
  'User already registered',
  'Password should be at least',
  'Unable to validate email address',
  'Signup requires a valid password',
];

export function createAppError(
  category: AppErrorCategory,
  message?: string,
  options?: { field?: string; code?: string; details?: string; retryable?: boolean },
): AppError {
  return {
    category,
    message: message ?? DEFAULT_MESSAGES[category],
    retryable: options?.retryable ?? RETRYABLE[category],
    field: options?.field,
    code: options?.code,
    details: options?.details,
  };
}

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'category' in value &&
    'message' in value &&
    'retryable' in value
  );
}

function userSafeBackendMessage(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  if (USER_SAFE_AUTH_MESSAGES.some((known) => trimmed.includes(known))) return trimmed;
  if (/^[A-Za-z][A-Za-z0-9 ,.'\-!?]{0,180}$/.test(trimmed) && !trimmed.includes('SQL') && !trimmed.includes('PGRST')) {
    return trimmed;
  }
  return fallback;
}

export function fromSupabaseError(
  error: { message: string; code?: string; status?: number },
  fallbackMessage = DEFAULT_MESSAGES.server,
): AppError {
  const message = error.message.toLowerCase();

  if (error.status === 401 || message.includes('jwt') || message.includes('not authenticated')) {
    return createAppError('auth', 'Your session expired. Sign in again.', { code: error.code });
  }

  if (error.status === 403 || error.code === '42501') {
    return createAppError('forbidden', undefined, { code: error.code });
  }

  if (error.code === 'PGRST116') {
    return createAppError('not_found', undefined, { code: error.code });
  }

  if (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('network request failed')
  ) {
    return createAppError('network', undefined, { code: error.code, details: error.message });
  }

  return createAppError('server', userSafeBackendMessage(error.message, fallbackMessage), {
    code: error.code,
    details: error.message,
  });
}

export function fromAuthError(error: { message: string; status?: number } | null): AppError | null {
  if (!error) return null;

  const message = error.message.toLowerCase();
  if (message.includes('invalid login credentials')) {
    return createAppError('auth', 'Email or password is incorrect.');
  }
  if (message.includes('email not confirmed')) {
    return createAppError('auth', 'Confirm your email before signing in.');
  }
  if (message.includes('user already registered')) {
    return createAppError('validation', 'An account with this email already exists.', { field: 'email' });
  }

  return createAppError('auth', userSafeBackendMessage(error.message, DEFAULT_MESSAGES.auth), {
    details: error.message,
  });
}

export function fromHttpStatus(status: number, bodyMessage?: string): AppError {
  if (status === 401) return createAppError('auth');
  if (status === 403) return createAppError('forbidden');
  if (status === 404) return createAppError('not_found');
  if (status >= 500) {
    return createAppError('server', bodyMessage ? userSafeBackendMessage(bodyMessage, DEFAULT_MESSAGES.server) : undefined);
  }
  return createAppError('unknown', bodyMessage ? userSafeBackendMessage(bodyMessage, DEFAULT_MESSAGES.unknown) : undefined);
}

export function fromFetchFailure(fallbackMessage = DEFAULT_MESSAGES.network): AppError {
  return createAppError('network', fallbackMessage);
}

export function toAppError(err: unknown, fallbackMessage = DEFAULT_MESSAGES.unknown): AppError {
  if (isAppError(err)) return err;
  if (err instanceof Error) {
    const message = err.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch')) {
      return createAppError('network', fallbackMessage, { details: err.message });
    }
    return createAppError('unknown', fallbackMessage, { details: err.message });
  }
  return createAppError('unknown', fallbackMessage);
}

export function getUserMessage(error: AppError | null | undefined): string {
  return error?.message ?? DEFAULT_MESSAGES.unknown;
}

export function notFoundError(resource: string): AppError {
  return createAppError('not_found', `${resource} not found.`);
}
