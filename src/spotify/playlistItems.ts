import { getFreshSpotifyToken } from "./client";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export type PlaylistItemsMutationResult = { snapshot_id?: string } | null;

async function spotifyMutate<T extends PlaylistItemsMutationResult>(
  method: "PUT" | "POST",
  path: string,
  body: unknown,
): Promise<T> {
  const token = await getFreshSpotifyToken();

  if (!token) {
    throw new Error("Spotify is not connected.");
  }

  const response = await fetch(`${SPOTIFY_API_BASE}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    const error = new Error(
      `Spotify ${method} /${path} failed: ${response.status} ${errorBody.slice(0, 200)}`,
    );
    Object.assign(error, { status: response.status, body: errorBody });
    throw error;
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json().catch(() => null)) as T;
}

export function replacePlaylistItems(playlistId: string, uris: readonly string[]) {
  return spotifyMutate<{ snapshot_id?: string } | null>("PUT", `playlists/${playlistId}/items`, {
    uris,
  });
}

export function addPlaylistItems(playlistId: string, uris: readonly string[]) {
  return spotifyMutate<{ snapshot_id?: string } | null>("POST", `playlists/${playlistId}/items`, {
    uris,
  });
}
