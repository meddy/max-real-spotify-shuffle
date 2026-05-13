import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { AccessToken } from "@spotify/web-api-ts-sdk";

import { refreshSpotifyToken } from "../auth/spotifyAuth";
import {
  loadSpotifyToken,
  spotifyTokenCache,
  isTokenExpired,
  hasRefreshToken,
} from "../auth/spotifyTokenStore";
import { env } from "../config/env";
import type { SpotifyApiClient } from "./types";

export async function getFreshSpotifyToken(): Promise<AccessToken | null> {
  const token = loadSpotifyToken();

  if (!token) {
    return null;
  }

  if (isTokenExpired(token) && hasRefreshToken(token)) {
    return refreshSpotifyToken(token);
  }

  return token;
}

export async function createSpotifyApi(): Promise<SpotifyApiClient | null> {
  const token = await getFreshSpotifyToken();

  if (!token) {
    return null;
  }

  return SpotifyApi.withAccessToken(env.spotify.clientId, token, {
    cachingStrategy: spotifyTokenCache,
  }) as unknown as SpotifyApiClient;
}
