import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  replacePlaylistItems: vi.fn(() => Promise.resolve({ snapshot_id: "s" })),
  addPlaylistItems: vi.fn(() => Promise.resolve({ snapshot_id: "s" })),
}));

vi.mock("../spotify/playlistItems", () => ({
  replacePlaylistItems: mocks.replacePlaylistItems,
  addPlaylistItems: mocks.addPlaylistItems,
}));

import { PlaylistSyncError, syncPlaylist } from "./syncOrchestrator";

describe("syncPlaylist", () => {
  beforeEach(() => {
    mocks.replacePlaylistItems.mockClear();
    mocks.addPlaylistItems.mockClear();
    mocks.replacePlaylistItems.mockResolvedValue({ snapshot_id: "s" });
    mocks.addPlaylistItems.mockResolvedValue({ snapshot_id: "s" });
  });

  it("puts the first batch and appends remaining batches", async () => {
    const uris = Array.from({ length: 250 }, (_, index) => `spotify:track:${index}`);
    const onProgress = vi.fn();

    await syncPlaylist("playlist", uris, onProgress);

    expect(mocks.replacePlaylistItems).toHaveBeenCalledWith("playlist", uris.slice(0, 100));
    expect(mocks.addPlaylistItems).toHaveBeenNthCalledWith(1, "playlist", uris.slice(100, 200));
    expect(mocks.addPlaylistItems).toHaveBeenNthCalledWith(2, "playlist", uris.slice(200, 250));
    expect(onProgress).toHaveBeenLastCalledWith({ processed: 250, total: 250 });
  });

  it("retries a rate-limited batch", async () => {
    vi.useFakeTimers();
    mocks.addPlaylistItems
      .mockRejectedValueOnce(
        Object.assign(new Error("429"), {
          status: 429,
          response: { headers: new Headers({ "Retry-After": "1" }) },
        }),
      )
      .mockResolvedValueOnce({ snapshot_id: "s" });
    const promise = syncPlaylist(
      "playlist",
      Array.from({ length: 150 }, (_, index) => `${index}`),
    );

    await vi.advanceTimersByTimeAsync(1000);
    await expect(promise).resolves.toBeUndefined();
    expect(mocks.addPlaylistItems).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("throws partial progress on terminal failure", async () => {
    mocks.addPlaylistItems.mockRejectedValue(Object.assign(new Error("400"), { status: 400 }));

    await expect(
      syncPlaylist(
        "playlist",
        Array.from({ length: 250 }, (_, index) => `${index}`),
      ),
    ).rejects.toMatchObject<Partial<PlaylistSyncError>>({ processedBatches: 1 });
  });
});
