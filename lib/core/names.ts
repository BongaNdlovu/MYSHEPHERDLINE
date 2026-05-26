export function getInitials(fullName: string, maxLength = 2) {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, maxLength)
    .toUpperCase();
}
