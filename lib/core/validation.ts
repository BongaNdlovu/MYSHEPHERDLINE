export type FieldErrors<T extends Record<string, string>> = Partial<Record<keyof T, string>>;

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
