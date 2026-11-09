import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { profileApi } from "./api.js";
import { BOOLEAN_FIELDS, FIELD_LABELS, OPTIONS, STATES } from "./profileFields.js";
import DocumentScanner from "../documents/DocumentScanner.jsx";
import { Button, Card, ErrorNote, Field, Input, PageHeader, Select } from "../../shared/ui/index.jsx";

const NUMBER_FIELDS = ["annualIncome", "landHoldingAcres"];

function toForm(user) {
  const p = user.profile || {};
  return {
    name: user.name || "",
    ...Object.fromEntries(
      ["gender", "state", "district", "area", "category", "occupation", "maritalStatus", "annualIncome", "landHoldingAcres"].map(
        (k) => [k, p[k] ?? ""]
      )
    ),
    dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : "",
    ...Object.fromEntries(Object.keys(BOOLEAN_FIELDS).map((k) => [k, p[k] ?? null])),
  };
}

function toPayload(form) {
  const profile = {};
  for (const [k, v] of Object.entries(form)) {
    if (k === "name") continue;
    if (v === "" || v === null) profile[k] = null;
    else if (NUMBER_FIELDS.includes(k)) profile[k] = Number(v);
    else profile[k] = v;
  }
  return { name: form.name, profile };
}

function YesNo({ value, onChange, name }) {
  const choices = [
    [true, "Yes"],
    [false, "No"],
    [null, "Not sure"],
  ];
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-line" role="radiogroup" aria-label={name}>
      {choices.map(([v, label]) => (
        <button
          key={label}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`px-3 py-1.5 text-sm ${value === v ? "bg-ink text-white" : "bg-white text-ink hover:bg-stone-50"} border-l border-line first:border-l-0`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(() => toForm(user));
  const [filledByScan, setFilledByScan] = useState([]);
  const [status, setStatus] = useState({ busy: false, saved: false, error: null });

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));
    setStatus((s) => ({ ...s, saved: false }));
  };

  function applyScan(suggestions) {
    setForm((f) => ({ ...f, ...suggestions }));
    setFilledByScan(Object.keys(suggestions));
    setStatus((s) => ({ ...s, saved: false }));
  }

  async function save(e) {
    e.preventDefault();
    setStatus({ busy: true, saved: false, error: null });
    try {
      const { user: updated } = await profileApi.update(toPayload(form));
      setUser(updated);
      setFilledByScan([]);
      setStatus({ busy: false, saved: true, error: null });
    } catch (err) {
      setStatus({ busy: false, saved: false, error: err });
    }
  }

  const scanned = (k) => (filledByScan.includes(k) ? "ring-2 ring-amber-300" : "");
  const isFarmer = form.occupation === "farmer";

  return (
    <div>
      <PageHeader title="Your profile">
        We only use this to check which schemes you qualify for. Answer what you can; “Not sure” is fine.
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={save} className="min-w-0 space-y-6">
          <Card className="space-y-4 p-5">
            <h2 className="font-semibold">About you</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input value={form.name} onChange={set("name")} required />
              </Field>
              <Field label="Date of birth">
                <Input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} className={scanned("dateOfBirth")} />
              </Field>
              <Field label="Gender">
                <Select options={OPTIONS.gender} value={form.gender} onChange={set("gender")} className={scanned("gender")} />
              </Field>
              <Field label="Marital status">
                <Select options={OPTIONS.maritalStatus} value={form.maritalStatus} onChange={set("maritalStatus")} />
              </Field>
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="font-semibold">Where you live</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="State">
                <Select options={STATES} value={form.state} onChange={set("state")} className={scanned("state")} />
              </Field>
              <Field label="District">
                <Input value={form.district} onChange={set("district")} className={scanned("district")} />
              </Field>
              <Field label="Area">
                <Select options={OPTIONS.area} value={form.area} onChange={set("area")} />
              </Field>
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="font-semibold">Household and work</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Social category">
                <Select options={OPTIONS.category} value={form.category} onChange={set("category")} className={scanned("category")} />
              </Field>
              <Field label="Family income per year (₹)" hint="Total of everyone in the household">
                <Input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={form.annualIncome}
                  onChange={set("annualIncome")}
                  className={scanned("annualIncome")}
                />
              </Field>
              <Field label="Main occupation">
                <Select options={OPTIONS.occupation} value={form.occupation} onChange={set("occupation")} />
              </Field>
              {isFarmer && (
                <Field label="Land owned (acres)">
                  <Input type="number" min="0" step="0.01" value={form.landHoldingAcres} onChange={set("landHoldingAcres")} />
                </Field>
              )}
            </div>

            <div className="divide-y divide-line">
              {Object.entries(BOOLEAN_FIELDS)
                .filter(([k]) => k !== "isPregnantOrNewMother" || form.gender === "female")
                .map(([k, q]) => (
                  <div key={k} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm">{q}</span>
                    <YesNo value={form[k]} onChange={set(k)} name={FIELD_LABELS[k]} />
                  </div>
                ))}
            </div>
          </Card>

          <ErrorNote error={status.error} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={status.busy}>
              {status.busy ? "Saving…" : "Save profile"}
            </Button>
            {status.saved && (
              <span className="text-sm text-emerald-700">
                Saved.{" "}
                <Link to="/benefits" className="font-semibold underline">
                  See my benefits
                </Link>
              </span>
            )}
            {filledByScan.length > 0 && !status.saved && (
              <span className="text-sm text-amber-800">Highlighted fields came from your document. Check them, then save.</span>
            )}
          </div>
        </form>

        <aside>
          <DocumentScanner onApply={applyScan} />
        </aside>
      </div>
    </div>
  );
}
