import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./client", () => ({
  getFreshSpotifyToken: vi.fn(),
}));

import * as client from "./client";
import { addPlaylistItems, replacePlaylistItems } from "./playlistItems";

describe("playlistItems", () => {
  beforeEach(() => {
    vi.mocked(client.getFreshSpotifyToken).mockResolvedValue({
      access_token: "test-token",
      token_type: "Bearer",
      expires_in: 3600,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ snapshot_id: "snap" }), { status: 200 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(client.getFreshSpotifyToken).mockReset();
  });

  it("PUT replace sends correct URL, method, auth header, and body", async () => {
    await replacePlaylistItems("abc123", ["spotify:track:1", "spotify:track:2"]);

    expect(fetch).toHaveBeenCalledWith(
      "https://api.spotify.com/v1/playlists/abc123/items",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ uris: ["spotify:track:1", "spotify:track:2"] }),
      }),
    );
  });

  it("POST add sends correct URL and body", async () => {
    await addPlaylistItems("pl1", ["spotify:track:9"]);

    expect(fetch).toHaveBeenCalledWith(
      "https://api.spotify.com/v1/playlists/pl1/items",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ uris: ["spotify:track:9"] }),
      }),
    );
  });

  it("throws with status and body on non-OK response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { status: 403, message: "Forbidden" } }), {
        status: 403,
      }),
    );

    await expect(replacePlaylistItems("pid", [])).rejects.toMatchObject({
      status: 403,
      body: expect.stringContaining("Forbidden"),
    });
  });

  it("throws when not connected", async () => {
    vi.mocked(client.getFreshSpotifyToken).mockResolvedValue(null);

    await expect(replacePlaylistItems("pid", [])).rejects.toThrow("Spotify is not connected.");
    expect(fetch).not.toHaveBeenCalled();
  });
});
