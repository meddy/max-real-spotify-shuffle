import { describe, expect, it, vi } from "vitest";

import { withRetry } from "./retries";

describe("withRetry", () => {
  it("retries 429 errors with Retry-After", async () => {
    vi.useFakeTimers();
    const fn = vi
      .fn()
      .mockRejectedValueOnce({
        status: 429,
        response: { headers: new Headers({ "Retry-After": "1" }) },
      })
      .mockResolvedValueOnce("ok");

    const promise = withRetry(fn);
    await vi.advanceTimersByTimeAsync(1000);

    await expect(promise).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("throws after max attempts", async () => {
    const error = { status: 429 };
    const fn = vi.fn().mockRejectedValue(error);
    const promise = withRetry(fn, { baseDelayMs: 1 });

    await expect(promise).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry non-retryable errors", async () => {
    const error = { status: 400 };
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withRetry(fn)).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
