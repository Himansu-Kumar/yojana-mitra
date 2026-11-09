import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi } from "./api.js";
import { ButtonLink, Card, ErrorNote, Input, PageHeader, Spinner } from "../../shared/ui/index.jsx";
import { useDocumentTitle } from "../../shared/lib/useDocumentTitle.js";

export default function AdminSchemesPage() {
  useDocumentTitle("Admin · Schemes");
  const navigate = useNavigate();

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadSchemes();
  }, []);

  async function loadSchemes() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.list();
      setSchemes(data.items || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = schemes.filter((s) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(term) ||
      s.slug?.toLowerCase().includes(term) ||
      s.ministry?.toLowerCase().includes(term) ||
      s.state?.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Scheme Administration">
          Create, edit and verify government welfare schemes.
        </PageHeader>
        <ButtonLink to="/admin/schemes/new" className="self-start sm:self-auto">
          + New scheme
        </ButtonLink>
      </div>

      <div className="mt-4 mb-6">
        <Input
          type="search"
          placeholder="Search schemes by name, slug, ministry or state…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <ErrorNote error={error} />

      {loading ? (
        <Spinner label="Loading schemes" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-stone-50 text-xs font-semibold uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Scheme</th>
                <th className="px-4 py-3">Level / State</th>
                <th className="px-4 py-3">Rules</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Verified</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    No schemes found matching "{search}".
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr
                    key={s.slug}
                    onClick={() => navigate(`/admin/schemes/${s.slug}`)}
                    className="cursor-pointer hover:bg-stone-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{s.name}</div>
                      <div className="text-xs text-muted">{s.ministry || s.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize">{s.level || "central"}</span>
                      {s.state && s.state !== "all" && (
                        <span className="ml-1 text-xs text-muted">({s.state})</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">{s.rules?.length || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.rulesStatus === "approved"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {s.rulesStatus || "approved"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {s.lastVerified ? new Date(s.lastVerified).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          s.isActive !== false ? "bg-emerald-500" : "bg-stone-300"
                        }`}
                        title={s.isActive !== false ? "Active" : "Inactive"}
                      />
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/admin/schemes/${s.slug}`}
                        className="text-xs font-semibold text-brand-700 hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

