export const SPOTIFY_SCOPES = [
  "playlist-modify-private",
  "playlist-modify-public",
  "playlist-read-private",
  "user-library-read",
] as const;

type EnvKey =
  | "VITE_FIREBASE_API_KEY"
  | "VITE_FIREBASE_AUTH_DOMAIN"
  | "VITE_FIREBASE_PROJECT_ID"
  | "VITE_FIREBASE_APP_ID"
  | "VITE_SPOTIFY_CLIENT_ID";

function readRequiredEnv(key: EnvKey): string {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

/**
 * OAuth redirect URI must match the page origin exactly. Resolved at runtime so one
 * build works on dev (e.g. 127.0.0.1:5173) and production Hosting without swapping env.
 *
 * Optional `VITE_SPOTIFY_REDIRECT_URI` is only used when `window` / `origin` is unavailable
 * (e.g. some tooling); the browser path always prefers `location.origin`.
 */
export function getSpotifyRedirectUri(): string {
  if (typeof globalThis.window !== "undefined") {
    const origin = globalThis.window.location?.origin;
    if (origin && origin !== "null") {
      return origin;
    }
  }

  const fallback = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  if (typeof fallback === "string" && fallback.length > 0) {
    return fallback;
  }

  throw new Error(
    "Cannot resolve Spotify redirect URI: run the app in a browser, or set VITE_SPOTIFY_REDIRECT_URI for non-browser contexts.",
  );
}

export const env = {
  firebase: {
    apiKey: readRequiredEnv("VITE_FIREBASE_API_KEY"),
    authDomain: readRequiredEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: readRequiredEnv("VITE_FIREBASE_PROJECT_ID"),
    appId: readRequiredEnv("VITE_FIREBASE_APP_ID"),
  },
  spotify: {
    clientId: readRequiredEnv("VITE_SPOTIFY_CLIENT_ID"),
    get redirectUri() {
      return getSpotifyRedirectUri();
    },
    scopes: [...SPOTIFY_SCOPES],
  },
} as const;
