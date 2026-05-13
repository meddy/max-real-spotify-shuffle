import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { getLastShuffledAt, useShuffleJob } from "../hooks/useShuffleJob";
import { ShuffleMode } from "../shuffle";
import type { SpotifyApiClient } from "../spotify/types";
import { findOrCreateManagedPlaylist } from "../sync/managedPlaylist";
import { CompletionState } from "./CompletionState";
import { ProgressDisplay } from "./ProgressDisplay";
import { ShuffleModeSelector } from "./ShuffleModeSelector";

export function MainScreen({
  api,
  firebaseEmail,
  onDisconnectSpotify,
  onSignOut,
}: {
  api: SpotifyApiClient;
  firebaseEmail: string | null;
  onDisconnectSpotify: () => void;
  onSignOut: () => void;
}) {
  const [mode, setMode] = useState<ShuffleMode>("pure-random");
  const { state, runShuffle, reset } = useShuffleJob(api);
  const profileQuery = useQuery({
    queryKey: ["spotify-profile"],
    queryFn: () => api.currentUser.profile(),
  });
  const playlistQuery = useQuery({
    queryKey: ["managed-playlist", profileQuery.data?.id],
    queryFn: () => findOrCreateManagedPlaylist(api, profileQuery.data?.id ?? ""),
    enabled: Boolean(profileQuery.data?.id),
  });

  const lastShuffled = useMemo(() => {
    const playlistId = state.playlist?.id ?? playlistQuery.data?.id;
    return playlistId ? getLastShuffledAt(playlistId) : null;
  }, [playlistQuery.data?.id, state.playlist?.id]);

  const busy =
    state.phase === "fetching" || state.phase === "computing" || state.phase === "syncing";
  const accountName = profileQuery.data?.display_name ?? profileQuery.data?.id ?? firebaseEmail;
  const playlist = state.playlist ?? playlistQuery.data ?? null;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-5 shadow-2xl shadow-black/40 sm:p-8">
        <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">
              Spotify True Shuffle
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Shuffle Liked Songs
            </h1>
            <p className="mt-3 text-slate-300">
              Generate a fresh ordering and sync it into your managed True Shuffle playlist.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="min-h-11 rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500"
              onClick={onDisconnectSpotify}
              type="button"
            >
              Disconnect Spotify
            </button>
            <button
              className="min-h-11 rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500"
              onClick={onSignOut}
              type="button"
            >
              Sign out
            </button>
          </div>
        </div>

        <section className="grid gap-3 py-6 sm:grid-cols-3">
          <div className="rounded-3xl bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Spotify account</p>
            <p className="mt-2 truncate font-semibold text-white">{accountName ?? "Loading..."}</p>
          </div>
          <div className="rounded-3xl bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Managed playlist</p>
            <p className="mt-2 truncate font-semibold text-white">
              {playlistQuery.isLoading ? "Loading..." : (playlist?.name ?? "True Shuffle")}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Songs in playlist</p>
            <p className="mt-2 font-semibold text-white">
              {(playlist?.tracks?.total ?? 0).toLocaleString()}
            </p>
          </div>
        </section>

        {lastShuffled ? (
          <p className="mb-5 text-sm text-slate-400">
            Last shuffled {new Date(lastShuffled).toLocaleString()}
          </p>
        ) : (
          <p className="mb-5 text-sm text-slate-400">This playlist has not been shuffled yet.</p>
        )}

        {state.phase === "done" && state.playlist ? (
          <CompletionState
            playlist={state.playlist}
            syncedAt={state.syncedAt ?? new Date().toISOString()}
            total={state.total}
            onShuffleAgain={reset}
          />
        ) : (
          <div className="space-y-5">
            <ShuffleModeSelector disabled={busy} value={mode} onChange={setMode} />
            {busy || state.phase === "error" ? (
              <ProgressDisplay
                phase={state.phase}
                processed={state.processed}
                total={state.total}
              />
            ) : null}
            {state.error ? (
              <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                <p>{state.error}</p>
                {state.partialSyncedCount !== null && state.total > 0 ? (
                  <p className="mt-2">
                    Synced about {state.partialSyncedCount.toLocaleString()} /{" "}
                    {state.total.toLocaleString()} songs before stopping.
                  </p>
                ) : null}
              </div>
            ) : null}
            <button
              className="min-h-12 w-full rounded-full bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy || playlistQuery.isLoading || profileQuery.isLoading}
              onClick={() => void runShuffle(mode)}
              type="button"
            >
              {busy ? "Shuffle in progress..." : "Shuffle Liked Songs"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
