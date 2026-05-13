import type { AccessToken } from "@spotify/web-api-ts-sdk";
import { describe, expect, it } from "vitest";

import {
  clearSpotifyToken,
  isTokenExpired,
  loadSpotifyToken,
  saveSpotifyToken,
  spotifyTokenCache,
} from "./spotifyTokenStore";

const token: AccessToken = {
  access_token: "access",
  refresh_token: "refresh",
  token_type: "Bearer",
  expires_in: 3600,
};

describe("spotifyTokenStore", () => {
  it("saves and loads a Spotify token", () => {
    const stored = saveSpotifyToken(token);

    expect(loadSpotifyToken()).toEqual(stored);
    expect(stored.expires).toBeGreaterThan(Date.now());
  });

  it("clears the stored Spotify token", () => {
    saveSpotifyToken(token);
    clearSpotifyToken();

    expect(loadSpotifyToken()).toBeNull();
  });

  it("detects expired tokens", () => {
    expect(isTokenExpired({ ...token, expires: Date.now() - 1 })).toBe(true);
  });

  it("removes verifier cache entries after access", async () => {
    spotifyTokenCache.setCacheItem("spotify-sdk:verifier", {
      verifier: "abc",
      expiresOnAccess: true,
    });

    await expect(
      spotifyTokenCache.get<{ verifier: string }>("spotify-sdk:verifier"),
    ).resolves.toEqual({
      verifier: "abc",
      expiresOnAccess: true,
    });
    await expect(spotifyTokenCache.get("spotify-sdk:verifier")).resolves.toBeNull();
  });
});
