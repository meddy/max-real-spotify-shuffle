import { describe, expect, it, vi } from "vitest";

import type { SpotifyApiClient, SpotifyPlaylistSummary } from "../spotify/types";
import { findOrCreateManagedPlaylist } from "./managedPlaylist";

function playlist(id: string, name = "True Shuffle", ownerId = "user"): SpotifyPlaylistSummary {
  return { id, name, owner: { id: ownerId }, tracks: { total: 0 } };
}

function apiMock(overrides: Partial<SpotifyApiClient> = {}): SpotifyApiClient {
  return {
    currentUser: {
      profile: vi.fn(),
      playlists: {
        playlists: vi.fn(async () => ({ items: [], total: 0, next: null })),
      },
      tracks: {
        savedTracks: vi.fn(),
      },
    },
    playlists: {
      getPlaylist: vi.fn(),
    },
    makeRequest: vi.fn(async (method: string, url: string) => {
      if (method === "POST" && url === "me/playlists") {
        return playlist("created");
      }
      throw new Error(`unexpected ${method} ${url}`);
    }),
    ...overrides,
  };
}

describe("findOrCreateManagedPlaylist", () => {
  it("uses a valid cached playlist", async () => {
    localStorage.setItem("trueshuffle.managedPlaylistId.v1", "cached");
    const api = apiMock();
    vi.mocked(api.playlists.getPlaylist).mockResolvedValue(playlist("cached"));

    await expect(findOrCreateManagedPlaylist(api, "user")).resolves.toMatchObject({ id: "cached" });
  });

  it("falls back to name search when no cache exists", async () => {
    const api = apiMock();
    vi.mocked(api.currentUser.playlists.playlists).mockResolvedValue({
      items: [playlist("match")],
      total: 1,
      next: null,
    });

    await expect(findOrCreateManagedPlaylist(api, "user")).resolves.toMatchObject({ id: "match" });
    expect(localStorage.getItem("trueshuffle.managedPlaylistId.v1")).toBe("match");
  });

  it("creates a private playlist when none exists", async () => {
    const api = apiMock();

    await expect(findOrCreateManagedPlaylist(api, "user")).resolves.toMatchObject({
      id: "created",
    });
    expect(api.makeRequest).toHaveBeenCalledWith(
      "POST",
      "me/playlists",
      expect.objectContaining({ name: "True Shuffle", public: false }),
      "application/json",
    );
  });

  it("invalidates a 404 cached playlist", async () => {
    localStorage.setItem("trueshuffle.managedPlaylistId.v1", "gone");
    const api = apiMock();
    vi.mocked(api.playlists.getPlaylist).mockRejectedValue({ status: 404 });

    await findOrCreateManagedPlaylist(api, "user");

    expect(api.makeRequest).toHaveBeenCalled();
    expect(localStorage.getItem("trueshuffle.managedPlaylistId.v1")).toBe("created");
  });
});
