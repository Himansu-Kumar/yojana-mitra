/**
 * Deterministic eligibility engine.
 * AI may draft rules, but THIS code decides eligibility, so every result is explainable.
 * Pure functions only: no database, no network.
 */
import { ELIGIBILITY_FIELDS } from "./eligibility.fields.js";
import { formatINR } from "../../utils/money.js";

export const STATUS = {
  ELIGIBLE: "eligible",
  NEAR_MISS: "near_miss",
  NEEDS_INFO: "needs_info",
  NOT_ELIGIBLE: "not_eligible",
};

// How close counts as a "near miss"
const NEAR_MISS_AGE_YEARS = 2;
const NEAR_MISS_RATIO = 0.2; // within 20% of a numeric limit

const isMissing = (v) => v === undefined || v === null || v === "";

function fmt(field, value) {
  const def = ELIGIBILITY_FIELDS[field];
  if (def?.money) return formatINR(value);
  if (field === "age") return `${value} years`;
  if (field === "landHoldingAcres") return `${value} acres`;
  return String(value);
}

function fieldLabel(field) {
  return ELIGIBILITY_FIELDS[field]?.label || field;
}

/** Evaluates one rule against facts. Returns { label, status, detail, near } */
export function evaluateRule(rule, facts) {
  if (rule.anyOf) {
    const inner = rule.anyOf.map((r) => evaluateRule(r, facts));
    if (inner.some((r) => r.status === "pass")) {
      return { label: rule.label, status: "pass", detail: inner.find((r) => r.status === "pass").label };
    }
    if (inner.some((r) => r.status === "unknown")) {
      const fields = rule.anyOf.filter((r) => isMissing(facts[r.field])).map((r) => r.field);
      return { label: rule.label, status: "unknown", detail: `Add your ${fields.map(fieldLabel).join(" and ")} to check this`, fields };
    }
    return { label: rule.label, status: "fail", detail: `You don't meet this: ${rule.label}`, near: false };
  }

  const { field, op, value, label } = rule;
  const actual = facts[field];

  if (isMissing(actual)) {
    return { label, status: "unknown", detail: `Add your ${fieldLabel(field)} to check this`, fields: [field] };
  }

  const pass = (detail = label) => ({ label, status: "pass", detail });
  const fail = (detail, near = false) => ({ label, status: "fail", detail, near });

  switch (op) {
    case "eq":
      return actual === value ? pass() : fail(`Required: ${label}`);

    case "in":
      return value.includes(actual) ? pass() : fail(`Required: ${label}`);

    case "lte": {
      if (actual <= value) return pass();
      const gap = actual - value;
      const near = field !== "age" && gap <= value * NEAR_MISS_RATIO;
      return fail(
        `Your ${fieldLabel(field)} (${fmt(field, actual)}) is ${fmt(field, gap)} above the ${fmt(field, value)} limit`,
        near
      );
    }

    case "gte": {
      if (actual >= value) return pass();
      const gap = value - actual;
      if (field === "age") {
        return fail(
          `You'll qualify in ${gap} year${gap === 1 ? "" : "s"} (minimum age ${value})`,
          gap <= NEAR_MISS_AGE_YEARS
        );
      }
      return fail(`Needs at least ${fmt(field, value)}; you have ${fmt(field, actual)}`, gap <= value * NEAR_MISS_RATIO);
    }

    case "between": {
      const [min, max] = value;
      if (actual >= min && actual <= max) return pass();
      if (actual < min) {
        const gap = min - actual;
        const near = field === "age" ? gap <= NEAR_MISS_AGE_YEARS : gap <= min * NEAR_MISS_RATIO;
        return fail(
          field === "age"
            ? `You'll qualify in ${gap} year${gap === 1 ? "" : "s"} (age ${min} to ${max})`
            : `Needs at least ${fmt(field, min)}; you have ${fmt(field, actual)}`,
          near
        );
      }
      // Above the max: you can't get younger, so age is never a near miss
      const gap = actual - max;
      const near = field !== "age" && gap <= max * NEAR_MISS_RATIO;
      return fail(
        field === "age"
          ? `Age limit is ${min} to ${max}; you are ${actual}`
          : `Your ${fieldLabel(field)} (${fmt(field, actual)}) is ${fmt(field, gap)} above the ${fmt(field, max)} limit`,
        near
      );
    }

    default:
      throw new Error(`Unknown rule op "${op}" on field "${field}"`);
  }
}

/** Evaluates a scheme for a person. */
export function evaluateScheme(scheme, facts) {
  const stateRule =
    scheme.state && scheme.state !== "all"
      ? { field: "state", op: "in", value: [].concat(scheme.state), label: `Lives in ${[].concat(scheme.state).join(" or ")}` }
      : null;
  const rules = stateRule ? [stateRule, ...(scheme.rules || [])] : scheme.rules || [];
  const checks = rules.map((r) => evaluateRule(r, facts));
  const fails = checks.filter((c) => c.status === "fail");
  const unknowns = checks.filter((c) => c.status === "unknown");
  const missingFields = [...new Set(unknowns.flatMap((u) => u.fields || []))];

  let status;
  let summary;
  if (fails.length === 0 && unknowns.length === 0) {
    status = STATUS.ELIGIBLE;
    summary = checks.length === 1 ? "You meet the condition" : `You meet all ${checks.length} conditions`;
  } else if (fails.length === 0) {
    status = STATUS.NEEDS_INFO;
    summary = `Add your ${missingFields.map(fieldLabel).join(", ")} to check`;
  } else if (fails.length === 1 && fails[0].near && unknowns.length === 0) {
    status = STATUS.NEAR_MISS;
    summary = fails[0].detail;
  } else {
    status = STATUS.NOT_ELIGIBLE;
    summary = fails[0].detail;
  }

  return { status, summary, checks, missingFields, alsoCheck: scheme.alsoCheck || [] };
}

/** Yearly-equivalent cash value, used for ranking and the wallet. */
export function cashValue(benefit = {}) {
  const { amount, frequency } = benefit;
  if (amount == null) return 0;
  if (frequency === "yearly") return amount;
  if (frequency === "monthly") return amount * 12;
  if (frequency === "one_time") return amount;
  return 0; // insurance cover is not cash
}

const STATUS_ORDER = [STATUS.ELIGIBLE, STATUS.NEAR_MISS, STATUS.NEEDS_INFO, STATUS.NOT_ELIGIBLE];

/** Evaluates many schemes and sorts: eligible first, then by value. */
export function rankSchemes(schemes, facts) {
  return schemes
    .map((scheme) => ({ scheme, result: evaluateScheme(scheme, facts) }))
    .sort((a, b) => {
      const s = STATUS_ORDER.indexOf(a.result.status) - STATUS_ORDER.indexOf(b.result.status);
      if (s !== 0) return s;
      const v = cashValue(b.scheme.benefit) - cashValue(a.scheme.benefit);
      if (v !== 0) return v;
      return (b.scheme.benefit?.amount || 0) - (a.scheme.benefit?.amount || 0);
    });
}

/**
 * Benefit Wallet: what the person is eligible for but may not be claiming.
 * Cash per year, one-time grants and insurance cover are kept separate (they are not the same thing).
 */
export function computeWallet(ranked) {
  const empty = () => ({ yearlyCash: 0, oneTime: 0, insuranceCover: 0, schemeCount: 0 });
  const wallet = { eligible: empty(), nearMiss: empty() };

  for (const { scheme, result } of ranked) {
    const bucket =
      result.status === STATUS.ELIGIBLE ? wallet.eligible : result.status === STATUS.NEAR_MISS ? wallet.nearMiss : null;
    if (!bucket) continue;
    bucket.schemeCount++;
    const { amount, frequency } = scheme.benefit || {};
    if (amount == null) continue;
    if (frequency === "yearly") bucket.yearlyCash += amount;
    else if (frequency === "monthly") bucket.yearlyCash += amount * 12;
    else if (frequency === "one_time") bucket.oneTime += amount;
    else if (frequency === "cover") bucket.insuranceCover += amount;
  }
  return wallet;
}
