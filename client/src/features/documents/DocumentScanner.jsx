import { useEffect, useState } from "react";
import { documentsApi } from "./api.js";
import { Button, Card, ErrorNote } from "../../shared/ui/index.jsx";
import { FIELD_LABELS, OPTIONS } from "../profile/profileFields.js";
import { formatINR, titleCase } from "../../shared/lib/format.js";

const DOC_NAMES = {
  aadhaar: "Aadhaar card",
  pan: "PAN card",
  income_certificate: "Income certificate",
  caste_certificate: "Caste certificate",
  ration_card: "Ration card",
  unknown: "Document",
};

function showValue(key, value) {
  if (key === "annualIncome") return formatINR(value);
  const opts = OPTIONS[key];
  return opts?.find((o) => o.value === value)?.label || value;
}

/** Upload or photograph a document; shows what was read; user confirms before it fills the form. */
export default function DocumentScanner({ onApply }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function pick(e) {
    const f = e.target.files?.[0];
    setResult(null);
    setError(null);
    setFile(f || null);
    setPreview(f && f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  }

  async function read() {
    setBusy(true);
    setError(null);
    try {
      setResult(await documentsApi.extract(file));
    } catch (err) {
      setError(err.status === 503 ? new Error(`Document reading isn't available right now. ${err.message}`) : err);
    } finally {
      setBusy(false);
    }
  }

  const entries = result ? Object.entries(result.suggestions) : [];

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Fill from a document</h2>
      <p className="mt-1 text-sm text-muted">
        Photograph or upload your Aadhaar or income certificate. We read it and suggest values; nothing is saved until you
        press Save.
      </p>

      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line px-4 py-6 text-center text-sm hover:border-brand-600">
        <input type="file" accept="image/*,application/pdf" capture="environment" className="sr-only" onChange={pick} />
        {preview ? (
          <img src={preview} alt="Selected document" className="max-h-40 rounded" />
        ) : (
          <span className="font-medium text-brand-700">{file ? file.name : "Choose a photo or file"}</span>
        )}
        <span className="mt-1 text-xs text-muted">JPG, PNG or PDF, up to 5 MB</span>
      </label>

      {file && !result && (
        <Button className="mt-3 w-full" onClick={read} disabled={busy}>
          {busy ? "Reading document…" : "Read document"}
        </Button>
      )}

      <div className="mt-3">
        <ErrorNote error={error} />
      </div>

      {result && (
        <div className="mt-2">
          <p className="text-sm">
            <span className="font-semibold">{DOC_NAMES[result.documentType] || titleCase(result.documentType)}</span>
            {result.nameOnDocument && <> · {result.nameOnDocument}</>}
            {result.idLast4 && <> · ending {result.idLast4}</>}
          </p>
          {entries.length ? (
            <>
              <dl className="mt-3 divide-y divide-line rounded-lg border border-line text-sm">
                {entries.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 px-3 py-2">
                    <dt className="text-muted">{titleCase(FIELD_LABELS[k] || k)}</dt>
                    <dd className="text-right font-medium">{showValue(k, v)}</dd>
                  </div>
                ))}
              </dl>
              <Button className="mt-3 w-full" onClick={() => onApply(result.suggestions)}>
                Use these details
              </Button>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">We couldn't read any profile details from this document. Try a clearer photo.</p>
          )}
        </div>
      )}
    </Card>
  );
}
