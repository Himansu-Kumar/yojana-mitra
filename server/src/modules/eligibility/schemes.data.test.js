// Guards data/schemes.json: every rule must use a known field, a known op and a valid value.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateRules } from "./eligibility.rules.js";
import { SEED_FILE } from "../schemes/scheme.seed.js";

const schemes = JSON.parse(readFileSync(SEED_FILE, "utf8"));

test("schemes.json has unique slugs and valid rules", () => {
  const slugs = new Set();
  for (const s of schemes) {
    assert.ok(s.slug && !slugs.has(s.slug), `duplicate or missing slug: ${s.slug}`);
    slugs.add(s.slug);
    assert.ok(s.name && s.description && s.benefit, `${s.slug}: missing name/description/benefit`);
    const res = validateRules(s.rules);
    assert.ok(res.ok, `${s.slug} has invalid rules: ${JSON.stringify(res.errors)}`);
  }
  assert.ok(schemes.length >= 20, "expected at least 20 schemes");
});
