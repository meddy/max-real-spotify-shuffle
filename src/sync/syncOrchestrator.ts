import { addPlaylistItems, replacePlaylistItems } from "../spotify/playlistItems";
import { getErrorStatus, withRetry } from "../spotify/retries";

const SPOTIFY_PLAYLIST_BATCH_SIZE = 100;

export type PlaylistSyncProgress = {
  processed: number;
  total: number;
};

export class PlaylistSyncError extends Error {
  constructor(
    message: string,
    public readonly processedBatches: number,
    public readonly cause: unknown,
  ) {
    super(message);
    this.name = "PlaylistSyncError";
  }
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export function isPlaylistSyncNotFound(error: unknown): boolean {
  const cause = error instanceof PlaylistSyncError ? error.cause : error;
  return getErrorStatus(cause) === 404;
}

export async function syncPlaylist(
  playlistId: string,
  orderedUris: readonly string[],
  onProgress?: (progress: PlaylistSyncProgress) => void,
): Promise<void> {
  const batches = chunk(orderedUris, SPOTIFY_PLAYLIST_BATCH_SIZE);
  const total = orderedUris.length;
  let processedBatches = 0;

  if (batches.length === 0) {
    await withRetry(() => replacePlaylistItems(playlistId, []));
    onProgress?.({ processed: 0, total: 0 });
    return;
  }

  try {
    const [firstBatch, ...remainingBatches] = batches;
    await withRetry(() => replacePlaylistItems(playlistId, firstBatch));
    processedBatches = 1;
    onProgress?.({
      processed: Math.min(processedBatches * SPOTIFY_PLAYLIST_BATCH_SIZE, total),
      total,
    });

    for (const batch of remainingBatches) {
      await withRetry(() => addPlaylistItems(playlistId, batch));
      processedBatches += 1;
      onProgress?.({
        processed: Math.min(processedBatches * SPOTIFY_PLAYLIST_BATCH_SIZE, total),
        total,
      });
    }
  } catch (error) {
    throw new PlaylistSyncError(
      "Spotify playlist synchronization failed.",
      processedBatches,
      error,
    );
  }
}
