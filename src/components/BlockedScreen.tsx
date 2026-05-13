export function BlockedScreen({
  email,
  onSignOut,
}: {
  email: string | null;
  onSignOut: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 py-12 text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-red-300">
        Access blocked
      </p>
      <h1 className="text-balance text-3xl font-bold text-white">
        This account is not allowlisted.
      </h1>
      <p className="mt-4 text-slate-300">
        {email ?? "Your current Google account"} is authenticated, but it is not authorized to use
        this app.
      </p>
      <button
        className="mt-8 min-h-11 rounded-full border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-400"
        onClick={onSignOut}
        type="button"
      >
        Sign out
      </button>
    </main>
  );
}
