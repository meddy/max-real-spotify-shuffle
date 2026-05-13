import { useQuery } from "@tanstack/react-query";

import type { LikedTrack, SpotifyApiClient } from "../spotify/types";

export type LikedSongsProgress = {
  fetched: number;
  total: number;
};

export async function fetchAllLikedSongs(
  api: SpotifyApiClient,
  onProgress?: (progress: LikedSongsProgress) => void,
): Promise<LikedTrack[]> {
  const tracks: LikedTrack[] = [];
  let offset = 0;
  const limit = 50;
  let total = 0;

  while (true) {
    const page = await api.currentUser.tracks.savedTracks(limit, offset);
    total = page.total;

    for (const item of page.items) {
      if (!item.track?.uri) {
        continue;
      }

      tracks.push({
        uri: item.track.uri,
        addedAt: item.added_at,
        name: item.track.name,
        artistNames: item.track.artists?.map((artist) => artist.name) ?? [],
      });
    }

    onProgress?.({ fetched: tracks.length, total });

    offset += page.items.length;

    if (!page.next || offset >= page.total || page.items.length === 0) {
      return tracks;
    }
  }
}

export function useLikedSongs(api: SpotifyApiClient | null) {
  return useQuery({
    queryKey: ["liked-songs"],
    queryFn: () => {
      if (!api) {
        throw new Error("Spotify is not connected.");
      }

      return fetchAllLikedSongs(api);
    },
    enabled: Boolean(api),
  });
}
