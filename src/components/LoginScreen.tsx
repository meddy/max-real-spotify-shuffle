import { useState } from "react";

export function LoginScreen({ onSignIn }: { onSignIn: () => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    setError(null);

    try {
      await onSignIn();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 py-12 text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">
        Spotify True Shuffle
      </p>
      <h1 className="text-balance text-4xl font-bold tracking-tight text-white">
        Real randomness for your Liked Songs.
      </h1>
      <p className="mt-4 text-pretty text-base text-slate-300">
        Sign in with your allowlisted Google account, connect Spotify, and sync a truly shuffled
        playlist you can play in the Spotify app.
      </p>
      <button
        className="mt-8 min-h-11 rounded-full bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading}
        onClick={() => void handleSignIn()}
        type="button"
      >
        {loading ? "Signing in..." : "Sign in with Google"}
      </button>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
    </main>
  );
}
