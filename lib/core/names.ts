export function getInitials(fullName: string | null | undefined, maxLength = 2) {
  if (fullName == null || typeof fullName !== 'string') return '';
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, maxLength)
    .toUpperCase();
}
