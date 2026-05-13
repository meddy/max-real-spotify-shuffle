import { useState } from "react";

export function ConnectSpotifyScreen({
  firebaseEmail,
  onConnect,
  onSignOut,
}: {
  firebaseEmail: string | null;
  onConnect: () => Promise<void>;
  onSignOut: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    setError(null);

    try {
      await onConnect();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to connect Spotify.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 py-12 text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">
        Spotify required
      </p>
      <h1 className="text-balance text-4xl font-bold text-white">Connect your Spotify account.</h1>
      <p className="mt-4 text-slate-300">
        Signed in as {firebaseEmail ?? "an allowlisted Google account"}. Spotify access is used only
        to read Liked Songs and update your managed True Shuffle playlist.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          className="min-h-11 rounded-full bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          onClick={() => void handleConnect()}
          type="button"
        >
          {loading ? "Redirecting..." : "Connect Spotify"}
        </button>
        <button
          className="min-h-11 rounded-full border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-400"
          onClick={onSignOut}
          type="button"
        >
          Sign out
        </button>
      </div>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
    </main>
  );
}
