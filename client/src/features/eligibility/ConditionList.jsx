const ICON = {
  pass: { mark: "✓", cls: "bg-emerald-600 text-white", sr: "Met" },
  fail: { mark: "✕", cls: "bg-stone-500 text-white", sr: "Not met" },
  unknown: { mark: "?", cls: "bg-sky-600 text-white", sr: "Unknown" },
};

/** The explanation: one line per eligibility condition. */
export default function ConditionList({ result }) {
  if (!result) return null;
  return (
    <div>
      <ul className="space-y-2">
        {result.checks.map((c, i) => {
          const icon = ICON[c.status];
          const nearMiss = c.status === "fail" && c.near;
          return (
            <li key={i} className="flex gap-3 text-sm">
              <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${nearMiss ? "bg-amber-500 text-white" : icon.cls}`}>
                {icon.mark}
                <span className="sr-only">{icon.sr}</span>
              </span>
              <span>
                <span className="font-medium">{c.label}</span>
                {c.status !== "pass" && <span className={`block ${nearMiss ? "text-amber-800" : "text-muted"}`}>{c.detail}</span>}
              </span>
            </li>
          );
        })}
      </ul>
      {result.alsoCheck?.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Also check yourself</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
            {result.alsoCheck.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
