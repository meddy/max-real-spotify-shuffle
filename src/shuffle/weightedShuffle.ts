import type { RandomSource } from "./fisherYates";

export function weightedShuffle<T>(
  items: readonly T[],
  weight: (item: T) => number,
  random: RandomSource = Math.random,
): T[] {
  return items
    .map((item) => {
      const safeWeight = Math.max(Number.EPSILON, weight(item));
      const key = Math.log(Math.max(Number.EPSILON, random())) / safeWeight;
      return { item, key };
    })
    .sort((left, right) => right.key - left.key)
    .map(({ item }) => item);
}
