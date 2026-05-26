export type QueryState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};
