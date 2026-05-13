import { describe, expect, it } from "vitest";

import { neglectedWeight, recencyWeight } from "./weights";

describe("weights", () => {
  it("applies a 90-day half-life to recency weights", () => {
    const now = new Date("2026-05-11T00:00:00.000Z");
    const today = "2026-05-11T00:00:00.000Z";
    const ninetyDaysAgo = "2026-02-10T00:00:00.000Z";

    expect(recencyWeight(ninetyDaysAgo, now)).toBeCloseTo(recencyWeight(today, now) * 0.5, 2);
  });

  it("makes neglected weights the inverse of recency weights", () => {
    const now = new Date("2026-05-11T00:00:00.000Z");
    const addedAt = "2026-02-10T00:00:00.000Z";

    expect(recencyWeight(addedAt, now) * neglectedWeight(addedAt, now)).toBeCloseTo(1, 5);
  });
});
