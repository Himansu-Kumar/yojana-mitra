// Guards data/schemes.json: every rule must use a known field, a known op and a valid value.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ELIGIBILITY_FIELDS, RULE_OPS } from "./eligibility.fields.js";
import { SEED_FILE } from "../schemes/scheme.seed.js";

const schemes = JSON.parse(readFileSync(SEED_FILE, "utf8"));

function checkRule(rule, where) {
  if (rule.anyOf) {
    assert.ok(rule.label, `${where}: anyOf needs a label`);
    rule.anyOf.forEach((r, i) => checkRule(r, `${where}.anyOf[${i}]`));
    return;
  }
  const def = ELIGIBILITY_FIELDS[rule.field];
  assert.ok(def, `${where}: unknown field "${rule.field}"`);
  assert.ok(RULE_OPS.includes(rule.op), `${where}: unknown op "${rule.op}"`);
  assert.ok(rule.label, `${where}: missing label`);
  if (rule.op === "between") assert.ok(Array.isArray(rule.value) && rule.value.length === 2, `${where}: between needs [min,max]`);
  if (rule.op === "in") {
    assert.ok(Array.isArray(rule.value), `${where}: in needs an array`);
    if (def.options) rule.value.forEach((v) => assert.ok(def.options.includes(v), `${where}: "${v}" not an option of ${rule.field}`));
  }
  if (rule.op === "eq" && def.options) assert.ok(def.options.includes(rule.value), `${where}: "${rule.value}" not an option`);
}

test("schemes.json has unique slugs and valid rules", () => {
  const slugs = new Set();
  for (const s of schemes) {
    assert.ok(s.slug && !slugs.has(s.slug), `duplicate or missing slug: ${s.slug}`);
    slugs.add(s.slug);
    assert.ok(s.name && s.description && s.benefit, `${s.slug}: missing name/description/benefit`);
    s.rules.forEach((r, i) => checkRule(r, `${s.slug}.rules[${i}]`));
  }
  assert.ok(schemes.length >= 20, "expected at least 20 schemes");
});
