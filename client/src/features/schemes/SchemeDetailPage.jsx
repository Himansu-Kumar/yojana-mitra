import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { schemesApi } from "./api.js";
import { eligibilityApi } from "../eligibility/api.js";
import { useAuth } from "../auth/AuthContext.jsx";
import StatusBadge from "../eligibility/StatusBadge.jsx";
import ConditionList from "../eligibility/ConditionList.jsx";
import { Button, ButtonLink, Card, ErrorNote, Spinner } from "../../shared/ui/index.jsx";

export default function SchemeDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [scheme, setScheme] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setScheme(null);
    setResult(null);
    schemesApi.get(slug).then((d) => setScheme(d.scheme)).catch(setError);
    if (user) eligibilityApi.forScheme(slug).then((d) => setResult(d.result)).catch(() => {});
  }, [slug, user]);

  if (error) return <ErrorNote error={error} />;
  if (!scheme) return <Spinner />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <Link to="/schemes" className="text-sm text-brand-700 hover:underline">
          ← All schemes
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{scheme.name}</h1>
        <p className="mt-1 text-sm text-muted">{scheme.ministry}</p>

        <Card className="mt-5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Benefit</p>
          <p className="mt-1 text-lg font-semibold">{scheme.benefit?.summary}</p>
          <p className="mt-3 text-sm leading-relaxed">{scheme.description}</p>
        </Card>

        {scheme.documents?.length > 0 && (
          <Card className="mt-4 p-5">
            <h2 className="font-semibold">Documents you'll need</h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              {scheme.documents.map((d) => (
                <li key={d} className="flex gap-2">
                  <span className="text-muted">□</span>
                  {d}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {scheme.applyUrl && (
            <Button as="a" href={scheme.applyUrl} target="_blank" rel="noopener noreferrer">
              Apply on the official portal ↗
            </Button>
          )}
          {user && (
            <ButtonLink to={`/assistant?q=${encodeURIComponent(`How do I apply for ${scheme.name}?`)}`} variant="secondary">
              Ask Mitra about this
            </ButtonLink>
          )}
        </div>
      </div>

      <aside>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Do you qualify?</h2>
            {result && <StatusBadge status={result.status} />}
          </div>
          {!user ? (
            <p className="mt-2 text-sm text-muted">
              <Link to="/login" state={{ from: `/schemes/${slug}` }} className="font-semibold text-brand-700 underline">
                Sign in
              </Link>{" "}
              to check this against your profile.
            </p>
          ) : !result ? (
            <Spinner label="Checking" />
          ) : (
            <>
              <p className={`mt-2 text-sm ${result.status === "near_miss" ? "text-amber-800" : "text-muted"}`}>{result.summary}</p>
              <div className="mt-4">
                <ConditionList result={result} />
              </div>
              {result.status === "needs_info" && (
                <ButtonLink to="/profile" variant="secondary" className="mt-4 w-full">
                  Add missing details
                </ButtonLink>
              )}
            </>
          )}
        </Card>
      </aside>
    </div>
  );
}
