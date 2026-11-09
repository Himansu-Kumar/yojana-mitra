import { useEffect, useState } from "react";
import { eligibilityApi } from "./api.js";
import BenefitWallet from "./BenefitWallet.jsx";
import ResultCard from "./ResultCard.jsx";
import { ButtonLink, ErrorNote, PageHeader, Spinner } from "../../shared/ui/index.jsx";
import { FIELD_LABELS } from "../profile/profileFields.js";
import { useDocumentTitle } from "../../shared/lib/useDocumentTitle.js";

const SECTIONS = [
  { key: "eligible", title: "You qualify", empty: "No matches yet. Fill in more of your profile." },
  { key: "near_miss", title: "Almost", note: "You miss one condition by a small margin." },
  { key: "needs_info", title: "Need a few more details" },
  { key: "not_eligible", title: "Not eligible", collapsed: true },
];

export default function BenefitsPage() {
  useDocumentTitle("My benefits");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showNot, setShowNot] = useState(false);

  useEffect(() => {
    eligibilityApi.mine().then(setData).catch(setError);
  }, []);

  if (error) return <ErrorNote error={error} />;
  if (!data) return <Spinner label="Checking schemes" />;

  const top = data.topMissingFields.slice(0, 3);

  return (
    <div>
      <PageHeader title="My benefits">
        Checked against {Object.values(data.counts).reduce((a, b) => a + b, 0)} central schemes using your profile.
      </PageHeader>

      <BenefitWallet wallet={data.wallet} counts={data.counts} />

      {top.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-sky-900">
            Add your <strong>{top.map((f) => FIELD_LABELS[f.field] || f.field).join(", ")}</strong> to check{" "}
            {data.counts.needs_info} more scheme{data.counts.needs_info === 1 ? "" : "s"}.
          </p>
          <ButtonLink to="/profile" variant="secondary">
            Complete profile
          </ButtonLink>
        </div>
      )}

      {SECTIONS.map((s) => {
        const items = data.groups[s.key];
        if (s.key !== "eligible" && items.length === 0) return null;
        const hidden = s.collapsed && !showNot;
        return (
          <section key={s.key} className="mt-10">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-bold">
                {s.title} <span className="font-normal text-muted">({items.length})</span>
              </h2>
              {s.collapsed && (
                <button onClick={() => setShowNot((v) => !v)} className="text-sm font-medium text-brand-700 hover:underline">
                  {showNot ? "Hide" : "Show"}
                </button>
              )}
            </div>
            {s.note && <p className="-mt-2 mb-3 text-sm text-muted">{s.note}</p>}
            {!hidden &&
              (items.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((c) => (
                    <ResultCard key={c.slug} card={c} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">{s.empty}</p>
              ))}
          </section>
        );
      })}
    </div>
  );
}
