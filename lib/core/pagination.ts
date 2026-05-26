export const DEFAULT_PAGE_SIZE = 50;

export type PageParams = {
  page?: number;
  pageSize?: number;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export function pageRange(page = 0, pageSize = DEFAULT_PAGE_SIZE) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

export function hasMorePages(count: number, pageSize: number) {
  return count >= pageSize;
}
