import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminApi } from "./api.js";
import RulesPreview from "./RulesPreview.jsx";
import { Button, Card, ErrorNote, Field, Input, PageHeader, Select, Spinner } from "../../shared/ui/index.jsx";
import { useDocumentTitle } from "../../shared/lib/useDocumentTitle.js";

const LEVEL_OPTIONS = [
  { value: "central", label: "Central" },
  { value: "state", label: "State" },
];

const FREQUENCY_OPTIONS = [
  { value: "yearly", label: "Yearly" },
  { value: "monthly", label: "Monthly" },
  { value: "one_time", label: "One-time" },
  { value: "cover", label: "Insurance Cover" },
];

export default function AdminSchemeEditPage() {
  const { slug } = useParams();
  const isNew = !slug || slug === "new";
  const navigate = useNavigate();

  useDocumentTitle(isNew ? "New Scheme" : `Edit Scheme`);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    slug: "",
    name: "",
    ministry: "",
    level: "central",
    state: "all",
    categories: "",
    lifeEvents: "",
    description: "",
    eligibilityText: "",
    benefitAmount: "",
    benefitFrequency: "",
    benefitSummary: "",
    applyUrl: "",
    sourceUrl: "",
    deadline: "",
    rulesJson: "[]",
    markVerified: false,
    isActive: true,
  });

  const [rulesParseError, setRulesParseError] = useState(null);
  const [parsedRules, setParsedRules] = useState([]);

  useEffect(() => {
    if (!isNew) {
      adminApi
        .get(slug)
        .then(({ scheme }) => {
          setForm({
            slug: scheme.slug,
            name: scheme.name || "",
            ministry: scheme.ministry || "",
            level: scheme.level || "central",
            state: scheme.state || "all",
            categories: (scheme.categories || []).join(", "),
            lifeEvents: (scheme.lifeEvents || []).join(", "),
            description: scheme.description || "",
            eligibilityText: scheme.eligibilityText || "",
            benefitAmount: scheme.benefit?.amount ?? "",
            benefitFrequency: scheme.benefit?.frequency || "",
            benefitSummary: scheme.benefit?.summary || "",
            applyUrl: scheme.applyUrl || "",
            sourceUrl: scheme.sourceUrl || "",
            deadline: scheme.deadline ? scheme.deadline.slice(0, 10) : "",
            rulesJson: JSON.stringify(scheme.rules || [], null, 2),
            markVerified: false,
            isActive: scheme.isActive !== false,
          });
          setParsedRules(scheme.rules || []);
        })
        .catch(setError)
        .finally(() => setLoading(false));
    }
  }, [slug, isNew]);

  const setVal = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: val }));

    if (key === "rulesJson") {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          setParsedRules(parsed);
          setRulesParseError(null);
        } else {
          setRulesParseError("Rules JSON must be an array of rule objects");
        }
      } catch (err) {
        setRulesParseError(err.message);
      }
    }
  };

  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    let rulesArray = [];
    try {
      rulesArray = JSON.parse(form.rulesJson);
      if (!Array.isArray(rulesArray)) throw new Error("Rules must be an array");
    } catch (err) {
      setRulesParseError(err.message);
      return;
    }

    const payload = {
      name: form.name.trim(),
      ministry: form.ministry.trim(),
      level: form.level,
      state: form.state.trim() || "all",
      categories: form.categories
        ? form.categories.split(",").map((c) => c.trim()).filter(Boolean)
        : [],
      lifeEvents: form.lifeEvents
        ? form.lifeEvents.split(",").map((l) => l.trim()).filter(Boolean)
        : [],
      description: form.description.trim(),
      eligibilityText: form.eligibilityText.trim(),
      benefit: {
        amount: form.benefitAmount !== "" ? Number(form.benefitAmount) : null,
        frequency: form.benefitFrequency || null,
        summary: form.benefitSummary.trim(),
      },
      rules: rulesArray,
      applyUrl: form.applyUrl.trim() || null,
      sourceUrl: form.sourceUrl.trim() || null,
      deadline: form.deadline ? new Date(form.deadline) : null,
      markVerified: form.markVerified,
      isActive: form.isActive,
    };

    if (isNew) {
      payload.slug = form.slug.trim();
    }

    setSaving(true);
    try {
      if (isNew) {
        await adminApi.create(payload);
      } else {
        await adminApi.update(slug, payload);
      }
      navigate("/admin/schemes");
    } catch (err) {
      setError(err);
      if (err.details && Array.isArray(err.details)) {
        const errMap = {};
        for (const d of err.details) {
          errMap[d.path] = d.message;
        }
        setFieldErrors(errMap);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!confirm("Are you sure you want to deactivate this scheme?")) return;
    setSaving(true);
    try {
      await adminApi.remove(slug);
      navigate("/admin/schemes");
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner label="Loading scheme details" />;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link to="/admin/schemes" className="text-sm font-semibold text-brand-700 hover:underline">
          ← Back to all schemes
        </Link>
      </div>

      <PageHeader title={isNew ? "New Scheme" : `Edit ${form.name || slug}`}>
        {isNew
          ? "Create a new government scheme with machine-readable eligibility rules."
          : `Editing scheme slug "${slug}".`}
      </PageHeader>

      <div className="mb-6">
        <ErrorNote error={error} />
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-ink">Basic Information</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {isNew && (
              <Field label="Slug" hint="lowercase letters, numbers and hyphens (e.g. pm-kisan)">
                <Input
                  value={form.slug}
                  onChange={setVal("slug")}
                  placeholder="pm-kisan"
                  required
                  pattern="[a-z0-9-]+"
                />
                {fieldErrors.slug && <p className="mt-1 text-xs text-brand-700">{fieldErrors.slug}</p>}
              </Field>
            )}

            <Field label="Scheme Name">
              <Input
                value={form.name}
                onChange={setVal("name")}
                placeholder="Pradhan Mantri Kisan Samman Nidhi"
                required
              />
              {fieldErrors.name && <p className="mt-1 text-xs text-brand-700">{fieldErrors.name}</p>}
            </Field>

            <Field label="Ministry / Department">
              <Input
                value={form.ministry}
                onChange={setVal("ministry")}
                placeholder="Ministry of Agriculture & Farmers Welfare"
              />
              {fieldErrors.ministry && <p className="mt-1 text-xs text-brand-700">{fieldErrors.ministry}</p>}
            </Field>

            <Field label="Level">
              <Select
                options={LEVEL_OPTIONS}
                value={form.level}
                onChange={setVal("level")}
              />
              {fieldErrors.level && <p className="mt-1 text-xs text-brand-700">{fieldErrors.level}</p>}
            </Field>

            <Field label="State" hint="'all' for Central schemes, or state name (e.g. Odisha)">
              <Input
                value={form.state}
                onChange={setVal("state")}
                placeholder="all"
              />
              {fieldErrors.state && <p className="mt-1 text-xs text-brand-700">{fieldErrors.state}</p>}
            </Field>

            <Field label="Categories" hint="Comma-separated: agriculture, health, women, etc.">
              <Input
                value={form.categories}
                onChange={setVal("categories")}
                placeholder="agriculture, finance"
              />
            </Field>

            <Field label="Life Events" hint="Comma-separated: farming, pregnancy, new_baby, etc.">
              <Input
                value={form.lifeEvents}
                onChange={setVal("lifeEvents")}
                placeholder="farming"
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-stone-400 focus:border-brand-600 focus:outline-none"
              rows={3}
              value={form.description}
              onChange={setVal("description")}
              placeholder="What this scheme provides and who it helps…"
              required
            />
            {fieldErrors.description && <p className="mt-1 text-xs text-brand-700">{fieldErrors.description}</p>}
          </Field>

          <Field label="Original Eligibility Text" hint="Official text from the portal; input for rule extractor">
            <textarea
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-stone-400 focus:border-brand-600 focus:outline-none"
              rows={3}
              value={form.eligibilityText}
              onChange={setVal("eligibilityText")}
              placeholder="Raw guidelines / criteria text…"
            />
          </Field>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-ink">Benefit Details</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Benefit Summary">
              <Input
                value={form.benefitSummary}
                onChange={setVal("benefitSummary")}
                placeholder="₹6,000 per year"
              />
            </Field>

            <Field label="Amount (₹)">
              <Input
                type="number"
                value={form.benefitAmount}
                onChange={setVal("benefitAmount")}
                placeholder="6000"
              />
            </Field>

            <Field label="Frequency">
              <Select
                options={FREQUENCY_OPTIONS}
                value={form.benefitFrequency}
                onChange={setVal("benefitFrequency")}
                placeholder="Select frequency"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Official Application URL">
              <Input
                type="url"
                value={form.applyUrl}
                onChange={setVal("applyUrl")}
                placeholder="https://pmkisan.gov.in"
              />
              {fieldErrors.applyUrl && <p className="mt-1 text-xs text-brand-700">{fieldErrors.applyUrl}</p>}
            </Field>

            <Field label="Source Portal URL">
              <Input
                type="url"
                value={form.sourceUrl}
                onChange={setVal("sourceUrl")}
                placeholder="https://myscheme.gov.in/schemes/pmksn"
              />
              {fieldErrors.sourceUrl && <p className="mt-1 text-xs text-brand-700">{fieldErrors.sourceUrl}</p>}
            </Field>

            <Field label="Application Deadline (optional)">
              <Input
                type="date"
                value={form.deadline}
                onChange={setVal("deadline")}
              />
            </Field>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-ink">Eligibility Rules (JSON)</h2>
          <p className="text-xs text-muted">
            Format: array of rule objects with <code>field</code>, <code>op</code> (eq, in, lte, gte, between), <code>value</code>, and <code>label</code>.
          </p>

          <Field label="Rules JSON Array">
            <textarea
              className={`w-full font-mono text-xs rounded-lg border ${
                rulesParseError ? "border-brand-600 bg-brand-50/20" : "border-line bg-white"
              } p-3 text-ink focus:border-brand-600 focus:outline-none`}
              rows={8}
              value={form.rulesJson}
              onChange={setVal("rulesJson")}
            />
            {rulesParseError && (
              <p className="mt-1 text-xs text-brand-700 font-medium">JSON Error: {rulesParseError}</p>
            )}
            {Object.entries(fieldErrors)
              .filter(([k]) => k.startsWith("rules"))
              .map(([k, v]) => (
                <p key={k} className="mt-1 text-xs text-brand-700 font-medium">
                  {k}: {v}
                </p>
              ))}
          </Field>

          {!rulesParseError && <RulesPreview rules={parsedRules} />}
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.markVerified}
                onChange={setVal("markVerified")}
                className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-600"
              />
              <span className="text-sm font-medium text-ink">
                Mark as verified today against official portal
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={setVal("isActive")}
                className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-600"
              />
              <span className="text-sm font-medium text-ink">
                Active (uncheck to hide from public search)
              </span>
            </label>
          </div>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex gap-3">
            <Button type="submit" disabled={saving || Boolean(rulesParseError)}>
              {saving ? "Saving…" : isNew ? "Create Scheme" : "Save Changes"}
            </Button>
            <ButtonLink to="/admin/schemes" variant="secondary">
              Cancel
            </ButtonLink>
          </div>

          {!isNew && form.isActive && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleDeactivate}
              disabled={saving}
              className="text-brand-700 border-brand-200 hover:bg-brand-50"
            >
              Deactivate Scheme
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

