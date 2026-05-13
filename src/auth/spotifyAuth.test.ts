import { describe, expect, it, vi } from "vitest";

import {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  generateCodeChallenge,
  generateCodeVerifier,
  handleSpotifyRedirectFromUrl,
} from "./spotifyAuth";
import { loadSpotifyToken } from "./spotifyTokenStore";

describe("spotifyAuth", () => {
  it("generates a PKCE verifier and S256 challenge", async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);

    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("builds the Spotify authorization URL", async () => {
    const url = await buildAuthorizeUrl({
      clientId: "client",
      redirectUri: "http://127.0.0.1:5173",
      scopes: ["user-library-read"],
      verifier: "verifier",
      state: "state",
    });

    expect(url.origin).toBe("https://accounts.spotify.com");
    expect(url.searchParams.get("client_id")).toBe("client");
    expect(url.searchParams.get("scope")).toBe("user-library-read");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("state")).toBe("state");
  });

  it("exchanges an authorization code and stores the token", async () => {
    sessionStorage.setItem("trueshuffle.spotify.pkce.verifier", "verifier");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            access_token: "access",
            refresh_token: "refresh",
            token_type: "Bearer",
            expires_in: 3600,
          }),
        );
      }),
    );

    await exchangeCodeForToken("code");

    const request = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    expect(String(request.body)).toContain("grant_type=authorization_code");
    expect(loadSpotifyToken()?.access_token).toBe("access");
    expect(sessionStorage.getItem("trueshuffle.spotify.pkce.verifier")).toBeNull();
  });

  it("handles a redirect and cleans query params", async () => {
    sessionStorage.setItem("trueshuffle.spotify.pkce.verifier", "verifier");
    sessionStorage.setItem("trueshuffle.spotify.pkce.state", "state");
    window.history.replaceState({}, "", "/?code=abc&state=state");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            access_token: "access",
            refresh_token: "refresh",
            token_type: "Bearer",
            expires_in: 3600,
          }),
        );
      }),
    );

    await expect(handleSpotifyRedirectFromUrl("?code=abc&state=state")).resolves.toBe(true);
    expect(window.location.search).toBe("");
  });

  it("dedupes concurrent OAuth callbacks so the code is exchanged once", async () => {
    sessionStorage.setItem("trueshuffle.spotify.pkce.verifier", "verifier");
    sessionStorage.setItem("trueshuffle.spotify.pkce.state", "state");
    window.history.replaceState({}, "", "/?code=abc&state=state");
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          access_token: "access",
          refresh_token: "refresh",
          token_type: "Bearer",
          expires_in: 3600,
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([
      handleSpotifyRedirectFromUrl("?code=abc&state=state"),
      handleSpotifyRedirectFromUrl("?code=abc&state=state"),
    ]);

    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(loadSpotifyToken()?.access_token).toBe("access");
  });
});
