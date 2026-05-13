import { describe, expect, it } from "vitest";

import { weightedShuffle } from "./weightedShuffle";

describe("weightedShuffle", () => {
  it("strongly favors heavily weighted items", () => {
    const counts = new Map<string, number>([
      ["heavy", 0],
      ["a", 0],
      ["b", 0],
      ["c", 0],
    ]);

    for (let run = 0; run < 10_000; run += 1) {
      const [first] = weightedShuffle(["heavy", "a", "b", "c"], (item) =>
        item === "heavy" ? 100 : 1,
      );
      counts.set(first as string, (counts.get(first as string) ?? 0) + 1);
    }

    expect(counts.get("heavy")).toBeGreaterThan(7_000);
  });

  it("is roughly uniform when weights are equal", () => {
    const items = ["a", "b", "c", "d"];
    const counts = new Map<string, number>(items.map((item) => [item, 0]));

    for (let run = 0; run < 10_000; run += 1) {
      const [first] = weightedShuffle(items, () => 1);
      counts.set(first as string, (counts.get(first as string) ?? 0) + 1);
    }

    for (const count of counts.values()) {
      expect(count).toBeGreaterThan(2_000);
      expect(count).toBeLessThan(3_000);
    }
  });
});
