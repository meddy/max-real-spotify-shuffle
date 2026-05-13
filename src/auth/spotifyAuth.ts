import type { AccessToken } from "@spotify/web-api-ts-sdk";

import { env, SPOTIFY_SCOPES } from "../config/env";
import { saveSpotifyToken } from "./spotifyTokenStore";

const CODE_VERIFIER_KEY = "trueshuffle.spotify.pkce.verifier";
const STATE_KEY = "trueshuffle.spotify.pkce.state";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";

/** Deduplicates OAuth callback handling (e.g. React Strict Mode double-mount). */
let oauthRedirectInFlight: Promise<boolean> | null = null;

function base64UrlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const binary = Array.from(uint8, (byte) => String.fromCharCode(byte)).join("");

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateCodeVerifier(byteLength = 64): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

export function generateState(): string {
  return generateCodeVerifier(24);
}

export async function buildAuthorizeUrl({
  clientId = env.spotify.clientId,
  redirectUri = env.spotify.redirectUri,
  scopes = [...SPOTIFY_SCOPES],
  verifier,
  state = generateState(),
}: {
  clientId?: string;
  redirectUri?: string;
  scopes?: readonly string[];
  verifier: string;
  state?: string;
}): Promise<URL> {
  const challenge = await generateCodeChallenge(verifier);
  const url = new URL(AUTH_ENDPOINT);

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("state", state);

  return url;
}

export async function startSpotifyAuthorization(): Promise<void> {
  const verifier = generateCodeVerifier();
  const state = generateState();
  sessionStorage.setItem(CODE_VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);

  const url = await buildAuthorizeUrl({ verifier, state });
  window.location.assign(url.toString());
}

function readVerifier(): string {
  const verifier = sessionStorage.getItem(CODE_VERIFIER_KEY);

  if (!verifier) {
    throw new Error("Missing Spotify PKCE verifier. Start the Spotify connection flow again.");
  }

  return verifier;
}

function validateState(returnedState: string | null): void {
  const expectedState = sessionStorage.getItem(STATE_KEY);

  if (!expectedState || expectedState !== returnedState) {
    throw new Error("Spotify authorization state did not match.");
  }
}

function clearPkceSession(): void {
  sessionStorage.removeItem(CODE_VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
}

async function postTokenRequest(params: URLSearchParams): Promise<AccessToken> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Spotify token request failed: ${response.status} ${text}`);
  }

  return JSON.parse(text) as AccessToken;
}

export async function exchangeCodeForToken(code: string): Promise<AccessToken> {
  const verifier = readVerifier();
  const params = new URLSearchParams({
    client_id: env.spotify.clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: env.spotify.redirectUri,
    code_verifier: verifier,
  });

  try {
    const token = await postTokenRequest(params);
    return saveSpotifyToken(token);
  } finally {
    clearPkceSession();
  }
}

export async function refreshSpotifyToken(token: AccessToken): Promise<AccessToken> {
  const params = new URLSearchParams({
    client_id: env.spotify.clientId,
    grant_type: "refresh_token",
    refresh_token: token.refresh_token,
  });
  const refreshed = await postTokenRequest(params);

  return saveSpotifyToken({
    ...refreshed,
    refresh_token: refreshed.refresh_token || token.refresh_token,
  });
}

export async function handleSpotifyRedirectFromUrl(
  search = globalThis.window.location.search,
): Promise<boolean> {
  const params = new URLSearchParams(search);
  const code = params.get("code");

  if (!code) {
    return false;
  }

  if (oauthRedirectInFlight) {
    return oauthRedirectInFlight;
  }

  const snapshot = new URLSearchParams(search);

  oauthRedirectInFlight = (async () => {
    try {
      const oauthError = snapshot.get("error");
      if (oauthError) {
        throw new Error(`Spotify authorization failed: ${oauthError}`);
      }

      validateState(snapshot.get("state"));
      await exchangeCodeForToken(snapshot.get("code") ?? "");

      const url = new URL(globalThis.window.location.href);
      url.searchParams.delete("code");
      url.searchParams.delete("state");
      url.searchParams.delete("error");
      globalThis.window.history.replaceState(
        {},
        document.title,
        url.pathname + url.search + url.hash,
      );

      return true;
    } finally {
      oauthRedirectInFlight = null;
    }
  })();

  return oauthRedirectInFlight;
}
