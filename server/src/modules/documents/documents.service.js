import { mlClient } from "../../clients/mlClient.js";
import { ELIGIBILITY_FIELDS } from "../eligibility/eligibility.fields.js";

// Fields a document is allowed to fill in on the profile
const ALLOWED_SUGGESTIONS = ["dateOfBirth", "gender", "state", "district", "annualIncome", "category"];

function clean(key, value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (key === "dateOfBirth") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) || d > new Date() ? undefined : d.toISOString().slice(0, 10);
  }
  if (key === "annualIncome") {
    const n = Number(String(value).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  const options = ELIGIBILITY_FIELDS[key]?.options;
  if (options) {
    const v = String(value).toLowerCase();
    return options.includes(v) ? v : undefined;
  }
  return String(value).trim();
}

export async function extractProfileFromDocument(file) {
  const result = await mlClient.extractDocument({
    buffer: file.buffer,
    mimetype: file.mimetype,
    filename: file.originalname,
  });

  const suggestions = {};
  for (const key of ALLOWED_SUGGESTIONS) {
    const v = clean(key, result.fields?.[key]);
    if (v !== undefined) suggestions[key] = v;
  }

  return {
    documentType: result.documentType || "unknown",
    nameOnDocument: result.fields?.name || null,
    idLast4: result.fields?.idLast4 || null,
    suggestions,
    confidence: result.confidence ?? null,
  };
}
