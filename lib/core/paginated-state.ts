type ItemWithId = {
  id: string;
};

export function appendUniquePage<T extends ItemWithId>(current: T[], next: T[]) {
  const merged = [...current];
  const indexById = new Map(current.map((item, index) => [item.id, index]));

  for (const item of next) {
    const existingIndex = indexById.get(item.id);
    if (existingIndex === undefined) {
      indexById.set(item.id, merged.length);
      merged.push(item);
      continue;
    }

    merged[existingIndex] = item;
  }

  return merged;
}
