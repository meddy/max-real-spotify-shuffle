import type { ShuffleJobPhase } from "../hooks/useShuffleJob";

const PHASE_LABELS: Record<ShuffleJobPhase, string> = {
  idle: "Ready",
  fetching: "Fetching liked songs...",
  computing: "Computing shuffle order...",
  syncing: "Syncing playlist...",
  done: "Done",
  error: "Stopped",
};

export function ProgressDisplay({
  phase,
  processed,
  total,
}: {
  phase: ShuffleJobPhase;
  processed: number;
  total: number;
}) {
  const percentage = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

  return (
    <section aria-live="polite" className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="font-semibold text-white">{PHASE_LABELS[phase]}</p>
        <p className="text-sm text-slate-400">
          {processed} / {total}
        </p>
      </div>
      <div
        aria-label={`${percentage}% complete`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percentage}
        className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
      >
        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${percentage}%` }} />
      </div>
    </section>
  );
}
