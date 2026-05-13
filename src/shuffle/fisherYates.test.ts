import { describe, expect, it } from "vitest";

import { fisherYatesShuffle } from "./fisherYates";

describe("fisherYatesShuffle", () => {
  it("returns each item exactly once", () => {
    const shuffled = fisherYatesShuffle([1, 2, 3, 4], () => 0.4);

    expect([...shuffled].sort()).toEqual([1, 2, 3, 4]);
  });

  it("has roughly uniform first-position distribution", () => {
    const items = [0, 1, 2, 3, 4, 5];
    const counts = new Map<number, number>(items.map((item) => [item, 0]));

    for (let run = 0; run < 10_000; run += 1) {
      const [first] = fisherYatesShuffle(items);
      counts.set(first as number, (counts.get(first as number) ?? 0) + 1);
    }

    const expected = 10_000 / items.length;
    for (const count of counts.values()) {
      expect(count).toBeGreaterThan(expected * 0.85);
      expect(count).toBeLessThan(expected * 1.15);
    }
  });
});
