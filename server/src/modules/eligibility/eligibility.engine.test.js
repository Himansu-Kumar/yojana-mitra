import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateRule, evaluateScheme, rankSchemes, computeWallet, STATUS } from "./eligibility.engine.js";
import { profileToFacts } from "./eligibility.fields.js";

const incomeRule = { field: "annualIncome", op: "lte", value: 250000, label: "Income up to ₹2.5 lakh" };
const ageRule = { field: "age", op: "between", value: [18, 40], label: "Age 18 to 40" };

test("lte passes when under the limit", () => {
  assert.equal(evaluateRule(incomeRule, { annualIncome: 200000 }).status, "pass");
});

test("lte just over the limit is a near miss with a clear reason", () => {
  const r = evaluateRule(incomeRule, { annualIncome: 270000 });
  assert.equal(r.status, "fail");
  assert.equal(r.near, true);
  assert.match(r.detail, /₹20,000 above the ₹2\.5 lakh limit/);
});

test("lte far over the limit is not a near miss", () => {
  assert.equal(evaluateRule(incomeRule, { annualIncome: 900000 }).near, false);
});

test("missing field is unknown, not a fail", () => {
  const r = evaluateRule(incomeRule, {});
  assert.equal(r.status, "unknown");
  assert.deepEqual(r.fields, ["annualIncome"]);
});

test("age below range by 1 year is a near miss; above range never is", () => {
  assert.equal(evaluateRule(ageRule, { age: 17 }).near, true);
  assert.equal(evaluateRule(ageRule, { age: 41 }).near, false);
});

test("anyOf passes if any inner rule passes", () => {
  const rule = {
    anyOf: [
      { field: "category", op: "in", value: ["sc", "st"], label: "SC/ST" },
      { field: "gender", op: "eq", value: "female", label: "Woman" },
    ],
    label: "SC/ST or woman",
  };
  assert.equal(evaluateRule(rule, { category: "general", gender: "female" }).status, "pass");
  assert.equal(evaluateRule(rule, { category: "general", gender: "male" }).status, "fail");
  assert.equal(evaluateRule(rule, { category: "general" }).status, "unknown");
});

const scheme = {
  slug: "s",
  benefit: { amount: 6000, frequency: "yearly" },
  rules: [incomeRule, { field: "occupation", op: "in", value: ["student"], label: "Student" }],
};

test("scheme statuses: eligible, near miss, needs info, not eligible", () => {
  assert.equal(evaluateScheme(scheme, { annualIncome: 100000, occupation: "student" }).status, STATUS.ELIGIBLE);
  assert.equal(evaluateScheme(scheme, { annualIncome: 270000, occupation: "student" }).status, STATUS.NEAR_MISS);
  assert.equal(evaluateScheme(scheme, { occupation: "student" }).status, STATUS.NEEDS_INFO);
  assert.equal(evaluateScheme(scheme, { annualIncome: 100000, occupation: "farmer" }).status, STATUS.NOT_ELIGIBLE);
});

test("wallet keeps cash, one-time and insurance cover separate", () => {
  const schemes = [
    { slug: "a", benefit: { amount: 6000, frequency: "yearly" }, rules: [] },
    { slug: "b", benefit: { amount: 300, frequency: "monthly" }, rules: [] },
    { slug: "c", benefit: { amount: 5000, frequency: "one_time" }, rules: [] },
    { slug: "d", benefit: { amount: 500000, frequency: "cover" }, rules: [] },
    { slug: "e", benefit: { amount: null, frequency: null }, rules: [] },
  ];
  const w = computeWallet(rankSchemes(schemes, {}));
  assert.equal(w.eligible.yearlyCash, 9600);
  assert.equal(w.eligible.oneTime, 5000);
  assert.equal(w.eligible.insuranceCover, 500000);
  assert.equal(w.eligible.schemeCount, 5);
});

test("ranking puts eligible schemes first, higher value first", () => {
  const ranked = rankSchemes(
    [
      { slug: "low", benefit: { amount: 100, frequency: "yearly" }, rules: [] },
      { slug: "no", benefit: { amount: 99999, frequency: "yearly" }, rules: [{ field: "age", op: "gte", value: 60, label: "60+" }] },
      { slug: "high", benefit: { amount: 6000, frequency: "yearly" }, rules: [] },
    ],
    { age: 30 }
  );
  assert.deepEqual(ranked.map((r) => r.scheme.slug), ["high", "low", "no"]);
});

test("profileToFacts derives age from date of birth and drops empty values", () => {
  const facts = profileToFacts({ dateOfBirth: "2000-06-15", gender: "female", state: "" }, new Date("2026-06-14"));
  assert.equal(facts.age, 25);
  assert.equal(facts.gender, "female");
  assert.equal("state" in facts, false);
});
