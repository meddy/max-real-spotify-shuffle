import { useCallback, useReducer } from "react";

import { fetchAllLikedSongs } from "./useLikedSongs";
import { ShuffleMode, shuffleTracks } from "../shuffle";
import { getErrorStatus } from "../spotify/retries";
import type { SpotifyApiClient, SpotifyPlaylistSummary } from "../spotify/types";
import { clearCachedManagedPlaylistId, findOrCreateManagedPlaylist } from "../sync/managedPlaylist";
import { isPlaylistSyncNotFound, PlaylistSyncError, syncPlaylist } from "../sync/syncOrchestrator";

export type ShuffleJobPhase = "idle" | "fetching" | "computing" | "syncing" | "done" | "error";

export type ShuffleJobState = {
  phase: ShuffleJobPhase;
  processed: number;
  total: number;
  playlist: SpotifyPlaylistSummary | null;
  syncedAt: string | null;
  error: string | null;
  partialSyncedCount: number | null;
};

type Action =
  | { type: "reset" }
  | { type: "fetching"; processed: number; total: number }
  | { type: "computing"; total: number }
  | { type: "syncing"; processed: number; total: number }
  | { type: "done"; playlist: SpotifyPlaylistSummary; total: number; syncedAt: string }
  | { type: "error"; message: string; processed?: number; total?: number };

const initialState: ShuffleJobState = {
  phase: "idle",
  processed: 0,
  total: 0,
  playlist: null,
  syncedAt: null,
  error: null,
  partialSyncedCount: null,
};

function reducer(state: ShuffleJobState, action: Action): ShuffleJobState {
  switch (action.type) {
    case "reset":
      return initialState;
    case "fetching":
      return {
        ...state,
        phase: "fetching",
        processed: action.processed,
        total: action.total,
        error: null,
      };
    case "computing":
      return { ...state, phase: "computing", processed: action.total, total: action.total };
    case "syncing":
      return {
        ...state,
        phase: "syncing",
        processed: action.processed,
        total: action.total,
        error: null,
      };
    case "done":
      return {
        ...state,
        phase: "done",
        processed: action.total,
        total: action.total,
        playlist: action.playlist,
        syncedAt: action.syncedAt,
        error: null,
        partialSyncedCount: null,
      };
    case "error":
      return {
        ...state,
        phase: "error",
        processed: action.processed ?? state.processed,
        total: action.total ?? state.total,
        error: action.message,
        partialSyncedCount: action.processed ?? null,
      };
  }
}

export function getLastShuffledAt(playlistId: string): string | null {
  return localStorage.getItem(`trueshuffle.lastShuffledAt.${playlistId}`);
}

export function saveLastShuffledAt(playlistId: string, syncedAt: string): void {
  localStorage.setItem(`trueshuffle.lastShuffledAt.${playlistId}`, syncedAt);
}

function messageForError(error: unknown): string {
  const httpStatus =
    error instanceof PlaylistSyncError ? getErrorStatus(error.cause) : getErrorStatus(error);

  if (error instanceof PlaylistSyncError && httpStatus === 429) {
    return "Spotify rate-limited the playlist update. Try again in a minute.";
  }

  if (httpStatus === 401 || httpStatus === 403) {
    return "Spotify authorization expired. Reconnect your Spotify account and try again.";
  }

  if (!navigator.onLine) {
    return "Network connection was interrupted. Check your connection and try again.";
  }

  return error instanceof Error ? error.message : "Something went wrong while shuffling.";
}

export function useShuffleJob(api: SpotifyApiClient | null) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const reset = useCallback(() => {
    dispatch({ type: "reset" });
  }, []);

  const runShuffle = useCallback(
    async (mode: ShuffleMode) => {
      if (!api) {
        dispatch({ type: "error", message: "Spotify is not connected." });
        return;
      }

      try {
        dispatch({ type: "fetching", processed: 0, total: 0 });
        const profile = await api.currentUser.profile();
        let playlist = await findOrCreateManagedPlaylist(api, profile.id);
        const tracks = await fetchAllLikedSongs(api, ({ fetched, total }) => {
          dispatch({ type: "fetching", processed: fetched, total });
        });

        if (tracks.length === 0) {
          dispatch({
            type: "error",
            message: "You haven't liked any songs yet.",
            processed: 0,
            total: 0,
          });
          return;
        }

        dispatch({ type: "computing", total: tracks.length });
        const shuffled = shuffleTracks(tracks, mode);
        const uris = shuffled.map((track) => track.uri);

        dispatch({ type: "syncing", processed: 0, total: uris.length });

        try {
          await syncPlaylist(playlist.id, uris, ({ processed, total }) => {
            dispatch({ type: "syncing", processed, total });
          });
        } catch (error) {
          if (isPlaylistSyncNotFound(error)) {
            clearCachedManagedPlaylistId();
            playlist = await findOrCreateManagedPlaylist(api, profile.id);
            await syncPlaylist(playlist.id, uris, ({ processed, total }) => {
              dispatch({ type: "syncing", processed, total });
            });
          } else {
            throw error;
          }
        }

        const syncedAt = new Date().toISOString();
        saveLastShuffledAt(playlist.id, syncedAt);
        dispatch({ type: "done", playlist, total: uris.length, syncedAt });
      } catch (error) {
        const processed =
          error instanceof PlaylistSyncError ? error.processedBatches * 100 : state.processed;
        dispatch({
          type: "error",
          message: messageForError(error),
          processed,
          total: state.total,
        });
      }
    },
    [api, state.processed, state.total],
  );

  return { state, runShuffle, reset };
}
