/** Keep prior results on refresh failure when cached rows/items exist. */
export function retainQueryDataOnError<T>(
  current: T,
  initialData: T,
  dataLength?: (data: T) => number,
): T {
  const length = dataLength
    ? dataLength(current)
    : Array.isArray(current)
      ? current.length
      : current
        ? 1
        : 0;
  return length > 0 ? current : initialData;
}

/** Keep prior pages on refresh failure when the list is non-empty. */
export function retainPaginatedDataOnError<T>(current: T[]): T[] {
  return current.length > 0 ? current : [];
}
