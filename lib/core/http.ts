const DEFAULT_TIMEOUT_MS = 15_000;

export type FetchWithTimeoutInit = RequestInit & {
  timeoutMs?: number;
};

export async function fetchWithTimeout(
  url: string,
  init: FetchWithTimeoutInit = {},
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: externalSignal, ...requestInit } = init;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    return await fetch(url, { ...requestInit, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}
