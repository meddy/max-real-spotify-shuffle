import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../spotify/playlistItems", () => ({
  replacePlaylistItems: vi.fn(() => Promise.resolve({ snapshot_id: "s" })),
  addPlaylistItems: vi.fn(() => Promise.resolve({ snapshot_id: "s" })),
}));

import { replacePlaylistItems } from "../spotify/playlistItems";
import type { SpotifyApiClient } from "../spotify/types";
import { useShuffleJob } from "./useShuffleJob";

function apiMock(savedTrackCount = 1): SpotifyApiClient {
  const items = Array.from({ length: savedTrackCount }, (_, index) => ({
    added_at: "2026-01-01T00:00:00.000Z",
    track: { uri: `spotify:track:${index}`, name: `Track ${index}`, artists: [] },
  }));

  return {
    currentUser: {
      profile: vi.fn(async () => ({ id: "user", display_name: "User" })),
      playlists: {
        playlists: vi.fn(async () => ({ items: [], total: 0, next: null })),
      },
      tracks: {
        savedTracks: vi.fn(async () => ({ items, total: items.length, next: null })),
      },
    },
    playlists: {
      getPlaylist: vi.fn(),
    },
    makeRequest: vi.fn(async () => ({
      id: "playlist",
      name: "True Shuffle",
      owner: { id: "user" },
      tracks: { total: 0 },
    })),
  };
}

describe("useShuffleJob", () => {
  it("runs the full shuffle pipeline", async () => {
    const api = apiMock(2);
    const { result } = renderHook(() => useShuffleJob(api));

    await act(async () => {
      await result.current.runShuffle("pure-random");
    });

    expect(result.current.state.phase).toBe("done");
    expect(result.current.state.total).toBe(2);
    expect(replacePlaylistItems).toHaveBeenCalled();
    expect(localStorage.getItem("trueshuffle.lastShuffledAt.playlist")).toBeTruthy();
  });

  it("surfaces empty-library errors", async () => {
    const api = apiMock(0);
    const { result } = renderHook(() => useShuffleJob(api));

    await act(async () => {
      await result.current.runShuffle("pure-random");
    });

    await waitFor(() => {
      expect(result.current.state.phase).toBe("error");
      expect(result.current.state.error).toContain("haven't liked any songs");
    });
  });
});
