export const HALF_LIFE_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const HALF_LIFE_FACTOR = Math.LN2;

export function ageInDays(addedAt: string, now = new Date()): number {
  const addedTime = new Date(addedAt).getTime();

  if (!Number.isFinite(addedTime)) {
    return 0;
  }

  return Math.max(0, (now.getTime() - addedTime) / MS_PER_DAY);
}

export function recencyWeight(addedAt: string, now = new Date()): number {
  return Math.exp((-HALF_LIFE_FACTOR * ageInDays(addedAt, now)) / HALF_LIFE_DAYS);
}

export function neglectedWeight(addedAt: string, now = new Date()): number {
  return Math.exp((HALF_LIFE_FACTOR * ageInDays(addedAt, now)) / HALF_LIFE_DAYS);
}
