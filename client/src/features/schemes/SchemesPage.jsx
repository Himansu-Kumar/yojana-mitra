import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { schemesApi } from "./api.js";
import { eligibilityApi } from "../eligibility/api.js";
import { useAuth } from "../auth/AuthContext.jsx";
import StatusBadge from "../eligibility/StatusBadge.jsx";
import { Card, ErrorNote, Input, PageHeader, Spinner } from "../../shared/ui/index.jsx";
import { titleCase } from "../../shared/lib/format.js";

const LIFE_EVENT_LABELS = {
  pregnancy: "Expecting a baby",
  new_baby: "Had a baby",
  college: "Going to college",
  job_loss: "Lost my job",
  start_business: "Starting a business",
  farming: "I farm",
  new_house: "Need a house",
  old_age: "Getting older",
  widowed: "Lost my spouse",
  disability: "Living with disability",
  illness: "Illness / hospital",
};

export default function SchemesPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [meta, setMeta] = useState({ categories: [], lifeEvents: [] });
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [statusBySlug, setStatusBySlug] = useState({});
  const [query, setQuery] = useState(params.get("q") || "");

  const filters = useMemo(
    () => ({ q: params.get("q") || "", category: params.get("category") || "", lifeEvent: params.get("lifeEvent") || "" }),
    [params]
  );

  useEffect(() => {
    schemesApi.meta().then(setMeta).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    eligibilityApi
      .mine()
      .then((d) => {
        const map = {};
        Object.values(d.groups).flat().forEach((c) => (map[c.slug] = c.result.status));
        setStatusBySlug(map);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const ctrl = new AbortController();
    setData(null);
    schemesApi
      .list(filters, ctrl.signal)
      .then(setData)
      .catch((e) => e.name !== "AbortError" && setError(e));
    return () => ctrl.abort();
  }, [filters]);

  const update = (patch) => {
    const next = { ...filters, ...patch };
    setParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v)));
  };

  return (
    <div>
      <PageHeader title="All schemes">Central government schemes. Sign in to see which ones you qualify for.</PageHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: query.trim() });
        }}
        className="flex gap-2"
        role="search"
      >
        <Input
          type="search"
          placeholder="Search: scholarship, pension, farmer, house…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search schemes"
        />
      </form>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Categories">
        {["", ...meta.categories].map((c) => (
          <button
            key={c || "all"}
            onClick={() => update({ category: c })}
            className={`rounded-full border px-3 py-1 text-sm ${
              filters.category === c ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"
            }`}
          >
            {c ? titleCase(c) : "All"}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Something happened?</span>
        {meta.lifeEvents.map((ev) => (
          <button
            key={ev}
            onClick={() => update({ lifeEvent: filters.lifeEvent === ev ? "" : ev })}
            className={`rounded-md px-2 py-1 ${filters.lifeEvent === ev ? "bg-brand-600 text-white" : "text-brand-700 hover:bg-brand-50"}`}
          >
            {LIFE_EVENT_LABELS[ev] || titleCase(ev)}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <ErrorNote error={error} />
        {!data ? (
          <Spinner />
        ) : data.items.length === 0 ? (
          <p className="text-muted">No schemes match. Try another word or clear the filters.</p>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted">{data.total} schemes</p>
            <div className="grid gap-3 md:grid-cols-2">
              {data.items.map((s) => (
                <Card key={s.slug} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/schemes/${s.slug}`} className="font-semibold hover:text-brand-700 hover:underline">
                      {s.name}
                    </Link>
                    <StatusBadge status={statusBySlug[s.slug]} />
                  </div>
                  <p className="mt-1 text-sm">{s.benefit?.summary}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{s.description}</p>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
