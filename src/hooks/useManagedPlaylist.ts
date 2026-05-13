import { useQuery } from "@tanstack/react-query";

import type { SpotifyApiClient } from "../spotify/types";
import { findOrCreateManagedPlaylist } from "../sync/managedPlaylist";

export function useManagedPlaylist(api: SpotifyApiClient | null, userId: string | null) {
  return useQuery({
    queryKey: ["managed-playlist", userId],
    queryFn: () => {
      if (!api || !userId) {
        throw new Error("Spotify is not connected.");
      }

      return findOrCreateManagedPlaylist(api, userId);
    },
    enabled: Boolean(api && userId),
  });
}
