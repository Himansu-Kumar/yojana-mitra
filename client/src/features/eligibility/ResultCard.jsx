import { useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";
import ConditionList from "./ConditionList.jsx";
import { Card } from "../../shared/ui/index.jsx";

export default function ResultCard({ card }) {
  const [open, setOpen] = useState(false);
  const { result } = card;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/schemes/${card.slug}`} className="font-semibold hover:text-brand-700 hover:underline">
            {card.name}
          </Link>
          <p className="mt-0.5 text-sm text-ink">{card.benefit?.summary}</p>
        </div>
        <StatusBadge status={result.status} />
      </div>

      <p className={`mt-2 text-sm ${result.status === "near_miss" ? "text-amber-800" : "text-muted"}`}>{result.summary}</p>

      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-2 text-sm font-medium text-brand-700 hover:underline"
        aria-expanded={open}
      >
        {open ? "Hide reasons" : "Why?"}
      </button>
      {open && (
        <div className="mt-3 border-t border-line pt-3">
          <ConditionList result={result} />
        </div>
      )}
    </Card>
  );
}
