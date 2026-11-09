import { test } from "node:test";
import assert from "node:assert/strict";
import { validateRules } from "./eligibility.rules.js";

test("validateRules passes for valid rules", () => {
  const validRules = [
    { field: "age", op: "between", value: [18, 60], label: "Age between 18 and 60" },
    { field: "gender", op: "eq", value: "female", label: "Female" },
    { field: "category", op: "in", value: ["sc", "st"], label: "SC or ST" },
    { field: "annualIncome", op: "lte", value: 250000, label: "Income up to 2.5 lakh" },
    { field: "hasDisability", op: "eq", value: true, label: "Person with disability" },
    {
      anyOf: [
        { field: "isBPL", op: "eq", value: true, label: "BPL cardholder" },
        { field: "annualIncome", op: "lte", value: 100000, label: "Income under 1 lakh" },
      ],
      label: "BPL or low income",
    },
  ];
  const res = validateRules(validRules);
  assert.equal(res.ok, true);
  assert.equal(res.errors.length, 0);
});

test("validateRules fails when rules is not an array", () => {
  const res = validateRules("not-an-array");
  assert.equal(res.ok, false);
  assert.match(res.errors[0].message, /Rules must be an array/);
});

test("validateRules fails when rule is not an object", () => {
  const res = validateRules([null, "invalid"]);
  assert.equal(res.ok, false);
  assert.equal(res.errors.length, 2);
  assert.match(res.errors[0].message, /Rule must be an object/);
});

test("validateRules fails when label is missing", () => {
  const res = validateRules([{ field: "age", op: "gte", value: 18 }]);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.message === "Missing label"));
});

test("validateRules fails on unknown field", () => {
  const res = validateRules([{ field: "nonExistentField", op: "eq", value: 10, label: "Test" }]);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.message.includes('Unknown field "nonExistentField"')));
});

test("validateRules fails on unknown op", () => {
  const res = validateRules([{ field: "age", op: "regex", value: ".*", label: "Test" }]);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.message.includes('Unknown op "regex"')));
});

test("validateRules fails for between with invalid values", () => {
  // Not array of 2
  const r1 = validateRules([{ field: "age", op: "between", value: [18], label: "Test" }]);
  assert.equal(r1.ok, false);
  assert.ok(r1.errors.some((e) => e.message === "between needs [min, max]"));

  // 3 values
  const r2 = validateRules([{ field: "age", op: "between", value: [18, 30, 40], label: "Test" }]);
  assert.equal(r2.ok, false);
  assert.ok(r2.errors.some((e) => e.message === "between needs [min, max]"));

  // Not numbers
  const r3 = validateRules([{ field: "age", op: "between", value: ["18", 30], label: "Test" }]);
  assert.equal(r3.ok, false);
  assert.ok(r3.errors.some((e) => e.message === "between values must be numbers"));

  // min > max
  const r4 = validateRules([{ field: "age", op: "between", value: [40, 20], label: "Test" }]);
  assert.equal(r4.ok, false);
  assert.ok(r4.errors.some((e) => e.message === "between requires min <= max"));
});

test("validateRules fails for in with invalid values", () => {
  // Not array
  const r1 = validateRules([{ field: "category", op: "in", value: "sc", label: "Test" }]);
  assert.equal(r1.ok, false);
  assert.ok(r1.errors.some((e) => e.message === "in needs an array"));

  // Option not in options
  const r2 = validateRules([{ field: "category", op: "in", value: ["invalid_cat"], label: "Test" }]);
  assert.equal(r2.ok, false);
  assert.ok(r2.errors.some((e) => e.message.includes('not an option of category')));
});

test("validateRules fails for eq with invalid options or boolean types", () => {
  // Option not in options
  const r1 = validateRules([{ field: "gender", op: "eq", value: "alien", label: "Test" }]);
  assert.equal(r1.ok, false);
  assert.ok(r1.errors.some((e) => e.message.includes('not an option of gender')));

  // Boolean field with string value
  const r2 = validateRules([{ field: "isBPL", op: "eq", value: "yes", label: "Test" }]);
  assert.equal(r2.ok, false);
  assert.ok(r2.errors.some((e) => e.message.includes('must be boolean')));
});

test("validateRules fails for lte and gte with non-number values", () => {
  const r1 = validateRules([{ field: "annualIncome", op: "lte", value: "100000", label: "Test" }]);
  assert.equal(r1.ok, false);
  assert.ok(r1.errors.some((e) => e.message === "lte value must be a number"));

  const r2 = validateRules([{ field: "annualIncome", op: "gte", value: null, label: "Test" }]);
  assert.equal(r2.ok, false);
  assert.ok(r2.errors.some((e) => e.message === "gte value must be a number"));
});

test("validateRules checks anyOf structures", () => {
  // Missing label on anyOf
  const r1 = validateRules([{ anyOf: [{ field: "isBPL", op: "eq", value: true, label: "BPL" }] }]);
  assert.equal(r1.ok, false);
  assert.ok(r1.errors.some((e) => e.message === "anyOf needs a label"));

  // Empty anyOf array
  const r2 = validateRules([{ anyOf: [], label: "Either" }]);
  assert.equal(r2.ok, false);
  assert.ok(r2.errors.some((e) => e.message === "anyOf must be a non-empty array"));

  // Inner rule error
  const r3 = validateRules([
    {
      anyOf: [{ field: "age", op: "between", value: [50, 20], label: "Invalid range" }],
      label: "Either",
    },
  ]);
  assert.equal(r3.ok, false);
  assert.ok(r3.errors.some((e) => e.message === "between requires min <= max"));
});

