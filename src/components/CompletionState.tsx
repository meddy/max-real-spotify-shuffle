import type { SpotifyPlaylistSummary } from "../spotify/types";

export function CompletionState({
  playlist,
  total,
  syncedAt,
  onShuffleAgain,
}: {
  playlist: SpotifyPlaylistSummary;
  total: number;
  syncedAt: string;
  onShuffleAgain: () => void;
}) {
  const spotifyUrl =
    playlist.external_urls?.spotify ?? `https://open.spotify.com/playlist/${playlist.id}`;

  return (
    <section className="rounded-3xl border border-emerald-500/30 bg-emerald-400/10 p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">Complete</p>
      <h2 className="mt-2 text-2xl font-bold text-white">
        Shuffled {total.toLocaleString()} tracks.
      </h2>
      <p className="mt-2 text-sm text-slate-300">
        Finished {new Date(syncedAt).toLocaleString()}. Open the managed playlist in Spotify and
        play it normally.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <a
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
          href={spotifyUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open in Spotify
        </a>
        <button
          className="min-h-11 rounded-full border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-400"
          onClick={onShuffleAgain}
          type="button"
        >
          Shuffle again
        </button>
      </div>
    </section>
  );
}
