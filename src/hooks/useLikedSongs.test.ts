import { describe, expect, it, vi } from "vitest";

import type { SpotifyApiClient } from "../spotify/types";
import { fetchAllLikedSongs } from "./useLikedSongs";

describe("fetchAllLikedSongs", () => {
  it("paginates saved tracks and reports progress", async () => {
    const savedTracks = vi
      .fn()
      .mockResolvedValueOnce({
        items: [
          {
            added_at: "2026-01-01T00:00:00.000Z",
            track: { uri: "spotify:track:1", name: "One", artists: [{ name: "Artist" }] },
          },
        ],
        total: 2,
        next: "next",
      })
      .mockResolvedValueOnce({
        items: [
          {
            added_at: "2026-01-02T00:00:00.000Z",
            track: { uri: "spotify:track:2", name: "Two", artists: [] },
          },
        ],
        total: 2,
        next: null,
      });
    const api = {
      currentUser: { tracks: { savedTracks } },
    } as unknown as SpotifyApiClient;
    const onProgress = vi.fn();

    await expect(fetchAllLikedSongs(api, onProgress)).resolves.toHaveLength(2);
    expect(savedTracks).toHaveBeenNthCalledWith(1, 50, 0);
    expect(savedTracks).toHaveBeenNthCalledWith(2, 50, 1);
    expect(onProgress).toHaveBeenLastCalledWith({ fetched: 2, total: 2 });
  });
});
