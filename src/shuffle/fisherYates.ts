export type RandomSource = () => number;

function cryptoRandom(): number {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return (value[0] ?? 0) / (0xffffffff + 1);
}

export function fisherYatesShuffle<T>(
  items: readonly T[],
  random: RandomSource = cryptoRandom,
): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex] as T, shuffled[index] as T];
  }

  return shuffled;
}
