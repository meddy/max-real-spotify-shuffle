import type { AccessToken, ICachable, ICachingStrategy } from "@spotify/web-api-ts-sdk";

const TOKEN_KEY = "trueshuffle.spotify.token.v1";
const CACHE_PREFIX = "trueshuffle.spotify.sdk-cache.";
const EXPIRY_SAFETY_MS = 60_000;

export type StoredSpotifyToken = AccessToken & Required<Pick<AccessToken, "expires">>;

function storageAvailable(storage: Storage | undefined): storage is Storage {
  return typeof storage !== "undefined";
}

function withExpiry(token: AccessToken): StoredSpotifyToken {
  return {
    ...token,
    expires: token.expires ?? Date.now() + token.expires_in * 1000 - EXPIRY_SAFETY_MS,
  };
}

export function saveSpotifyToken(token: AccessToken): StoredSpotifyToken {
  const stored = withExpiry(token);

  if (storageAvailable(globalThis.localStorage)) {
    globalThis.localStorage.setItem(TOKEN_KEY, JSON.stringify(stored));
  }

  return stored;
}

export function loadSpotifyToken(): StoredSpotifyToken | null {
  if (!storageAvailable(globalThis.localStorage)) {
    return null;
  }

  const raw = globalThis.localStorage.getItem(TOKEN_KEY);
  if (!raw) {
    return null;
  }

  try {
    return withExpiry(JSON.parse(raw) as AccessToken);
  } catch {
    globalThis.localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

export function clearSpotifyToken(): void {
  if (storageAvailable(globalThis.localStorage)) {
    globalThis.localStorage.removeItem(TOKEN_KEY);
  }
}

export function hasRefreshToken(token: AccessToken | null): token is StoredSpotifyToken {
  return Boolean(token?.refresh_token);
}

export function isTokenExpired(token: AccessToken, skewMs = EXPIRY_SAFETY_MS): boolean {
  const expires = token.expires ?? Date.now() + token.expires_in * 1000;
  return expires <= Date.now() + skewMs;
}

function cacheStorageForKey(cacheKey: string): Storage | null {
  if (cacheKey.includes("verifier")) {
    return storageAvailable(globalThis.sessionStorage) ? globalThis.sessionStorage : null;
  }

  return storageAvailable(globalThis.localStorage) ? globalThis.localStorage : null;
}

function makeCacheKey(cacheKey: string): string {
  return `${CACHE_PREFIX}${cacheKey}`;
}

export const spotifyTokenCache: ICachingStrategy = {
  async getOrCreate<T>(
    cacheKey: string,
    createFunction: () => Promise<T & ICachable & object>,
    updateFunction?: (item: T) => Promise<T & ICachable & object>,
  ): Promise<T & ICachable> {
    const cached = await this.get<T>(cacheKey);

    if (!cached) {
      const created = await createFunction();
      this.setCacheItem(cacheKey, created);
      return created;
    }

    if (cached.expires && cached.expires <= Date.now() && updateFunction) {
      const updated = await updateFunction(cached);
      this.setCacheItem(cacheKey, updated);
      return updated;
    }

    return cached;
  },

  async get<T>(cacheKey: string): Promise<(T & ICachable) | null> {
    const storage = cacheStorageForKey(cacheKey);
    const raw = storage?.getItem(makeCacheKey(cacheKey));

    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as T & ICachable;

      if (parsed.expiresOnAccess) {
        storage?.removeItem(makeCacheKey(cacheKey));
      }

      return parsed;
    } catch {
      storage?.removeItem(makeCacheKey(cacheKey));
      return null;
    }
  },

  setCacheItem<T>(cacheKey: string, item: T & ICachable): void {
    const storage = cacheStorageForKey(cacheKey);
    storage?.setItem(makeCacheKey(cacheKey), JSON.stringify(item));
  },

  remove(cacheKey: string): void {
    cacheStorageForKey(cacheKey)?.removeItem(makeCacheKey(cacheKey));
  },
};
