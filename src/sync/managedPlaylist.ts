import { getErrorStatus } from "../spotify/retries";
import type { SpotifyApiClient, SpotifyPlaylistSummary } from "../spotify/types";

export const MANAGED_PLAYLIST_NAME = "True Shuffle";
const MANAGED_PLAYLIST_CACHE_KEY = "trueshuffle.managedPlaylistId.v1";

export function getCachedManagedPlaylistId(): string | null {
  return localStorage.getItem(MANAGED_PLAYLIST_CACHE_KEY);
}

export function cacheManagedPlaylistId(playlistId: string): void {
  localStorage.setItem(MANAGED_PLAYLIST_CACHE_KEY, playlistId);
}

export function clearCachedManagedPlaylistId(): void {
  localStorage.removeItem(MANAGED_PLAYLIST_CACHE_KEY);
}

export function isNotFoundError(error: unknown): boolean {
  return getErrorStatus(error) === 404;
}

async function findManagedPlaylistByName(
  api: SpotifyApiClient,
  userId: string,
): Promise<SpotifyPlaylistSummary | null> {
  let offset = 0;
  const limit = 50;

  while (true) {
    const page = await api.currentUser.playlists.playlists(limit, offset);
    const match = page.items.find(
      (playlist) => playlist.name === MANAGED_PLAYLIST_NAME && playlist.owner.id === userId,
    );

    if (match) {
      return match;
    }

    offset += page.items.length;

    if (!page.next || offset >= page.total || page.items.length === 0) {
      return null;
    }
  }
}

export async function findOrCreateManagedPlaylist(
  api: SpotifyApiClient,
  userId: string,
): Promise<SpotifyPlaylistSummary> {
  const cachedPlaylistId = getCachedManagedPlaylistId();

  if (cachedPlaylistId) {
    try {
      const playlist = await api.playlists.getPlaylist(cachedPlaylistId);
      if (playlist.owner.id === userId) {
        return playlist;
      }
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
    }

    clearCachedManagedPlaylistId();
  }

  const existing = await findManagedPlaylistByName(api, userId);
  if (existing) {
    cacheManagedPlaylistId(existing.id);
    return existing;
  }

  const created = await api.makeRequest<SpotifyPlaylistSummary>(
    "POST",
    "me/playlists",
    {
      name: MANAGED_PLAYLIST_NAME,
      public: false,
      description: "Managed by Spotify True Shuffle",
    },
    "application/json",
  );
  cacheManagedPlaylistId(created.id);

  return created;
}
