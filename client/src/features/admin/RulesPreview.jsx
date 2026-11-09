export default function RulesPreview({ rules }) {
  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    return <p className="text-xs text-muted">No rules defined yet.</p>;
  }

  function renderRule(r, i) {
    if (r.anyOf) {
      return (
        <li key={i} className="text-sm">
          <div className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
            <div>
              <span className="font-medium text-ink">{r.label || "Any of the following:"}</span>
              <ul className="mt-1.5 space-y-1 pl-3 border-l-2 border-line">
                {r.anyOf.map((nested, j) => (
                  <li key={j} className="text-xs text-muted">
                    {nested.label || `${nested.field} ${nested.op} ${JSON.stringify(nested.value)}`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </li>
      );
    }

    return (
      <li key={i} className="flex items-start gap-2 text-sm">
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-600" />
        <span className="font-medium text-ink">{r.label || `${r.field} ${r.op} ${JSON.stringify(r.value)}`}</span>
      </li>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-stone-50/50 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        Rules Preview ({rules.length})
      </p>
      <ul className="space-y-2">
        {rules.map((r, i) => renderRule(r, i))}
      </ul>
    </div>
  );
}

