export type FieldErrors<T extends Record<string, string>> = Partial<Record<keyof T, string>>;

/** Escape `%`, `_`, and `\` for safe use inside PostgREST `.ilike` patterns. */
export function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

export function hasFieldErrors<T extends Record<string, string>>(errors: FieldErrors<T>): boolean {
  return Object.values(errors).some(Boolean);
}

export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Enter a valid email address.';
  return undefined;
}

export function validatePassword(password: string, minLength = 6): string | undefined {
  if (!password) return 'Password is required.';
  if (password.length < minLength) return `Password must be at least ${minLength} characters.`;
  return undefined;
}

export function validateDisplayName(displayName: string): string | undefined {
  const trimmed = displayName.trim();
  if (!trimmed) return 'Display name is required.';
  if (trimmed.length < 2) return 'Display name must be at least 2 characters.';
  return undefined;
}

export function validateSignIn(values: { email: string; password: string }) {
  return {
    email: validateEmail(values.email),
    password: validatePassword(values.password),
  } satisfies FieldErrors<{ email: string; password: string }>;
}

export function validateSignUp(values: { displayName: string; email: string; password: string }) {
  return {
    displayName: validateDisplayName(values.displayName),
    email: validateEmail(values.email),
    password: validatePassword(values.password),
  } satisfies FieldErrors<{ displayName: string; email: string; password: string }>;
}

export function validateVisitLog(values: { memberPresent: boolean; userPresent: boolean }) {
  if (!values.userPresent) return 'Sign in to log a visit.';
  if (!values.memberPresent) return 'Select a valid member to log a visit.';
  return undefined;
}

export function validateOptionalEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return undefined;
  return validateEmail(trimmed);
}

export function validateOptionalPhone(phone: string): string | undefined {
  const trimmed = phone.trim();
  if (!trimmed) return undefined;
  if (!/^[\d\s+\-().]{7,20}$/.test(trimmed)) return 'Enter a valid phone number.';
  return undefined;
}

export function validateDueDate(dueDate: string): string | undefined {
  const trimmed = dueDate.trim();
  if (!trimmed) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return 'Use YYYY-MM-DD format.';
  const [yearRaw, monthRaw, dayRaw] = trimmed.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    return 'Enter a valid due date.';
  }
  return undefined;
}
