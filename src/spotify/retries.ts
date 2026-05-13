export type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
};

export function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const candidate = error as {
    status?: number;
    statusCode?: number;
    response?: { status?: number };
  };

  return candidate.status ?? candidate.statusCode ?? candidate.response?.status;
}

function getRetryAfterMs(error: unknown): number | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const response = (error as { response?: { headers?: Headers | Record<string, string> } })
    .response;
  const headers = response?.headers;
  const retryAfter =
    headers instanceof Headers ? headers.get("Retry-After") : headers?.["Retry-After"];

  if (!retryAfter) {
    return null;
  }

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }

  const retryDate = Date.parse(retryAfter);
  return Number.isFinite(retryDate) ? Math.max(0, retryDate - Date.now()) : null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function shouldRetry(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status === 429 || (typeof status === "number" && status >= 500 && status < 600);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  { maxAttempts = 3, baseDelayMs = 500 }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt >= maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      const retryAfterMs = getRetryAfterMs(error);
      const backoffMs = baseDelayMs * 2 ** (attempt - 1);
      await delay(retryAfterMs ?? backoffMs);
    }
  }

  throw lastError;
}
