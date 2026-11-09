export const STATUS_META = {
  eligible: { label: "You qualify", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  near_miss: { label: "Almost", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  needs_info: { label: "Need details", cls: "bg-sky-50 text-sky-800 border-sky-200" },
  not_eligible: { label: "Not eligible", cls: "bg-stone-100 text-stone-600 border-stone-200" },
};

export default function StatusBadge({ status }) {
  const m = STATUS_META[status];
  if (!m) return null;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${m.cls}`}>
      {m.label}
    </span>
  );
}
