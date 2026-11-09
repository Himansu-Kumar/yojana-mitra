# data/

Owned by the **data** team.

## `schemes.json`
Seed data for the schemes collection. The server loads it with `npm run seed` (and automatically on first start when the database is empty).

**Status: hand-written for the prototype.** Amounts and rules were written from public scheme descriptions and must be checked against [myScheme.gov.in](https://www.myscheme.gov.in) and each official portal before any demo. Add a `lastVerified` date when you check one.

### Scheme shape
```jsonc
{
  "slug": "pm-kisan",                 // unique, URL-safe
  "name": "PM-KISAN Samman Nidhi",
  "ministry": "...",
  "categories": ["agriculture"],      // see CATEGORIES in server/src/modules/schemes/scheme.constants.js
  "lifeEvents": ["farming"],          // see LIFE_EVENTS in the same file
  "description": "...",
  "benefit": {
    "amount": 6000,                   // number or null if not a fixed cash amount
    "frequency": "yearly",            // yearly | monthly | one_time | cover | null
    "summary": "₹6,000 per year..."   // human-readable
  },
  "rules": [ ... ],                   // machine-checkable eligibility (see below)
  "alsoCheck": ["..."],               // conditions we can't check from the profile
  "documents": ["Aadhaar", "..."],
  "applyUrl": "https://..."
}
```

### Rule format
Every rule in `rules` must pass for the person to be eligible.

```jsonc
{ "field": "age", "op": "between", "value": [18, 40], "label": "Age 18 to 40" }
{ "field": "annualIncome", "op": "lte", "value": 250000, "label": "Family income up to ₹2.5 lakh" }
{ "field": "category", "op": "in", "value": ["sc", "st"], "label": "SC or ST" }
{ "field": "isBPL", "op": "eq", "value": true, "label": "BPL household" }

// OR group: passes if any inner rule passes
{ "anyOf": [ {rule}, {rule} ], "label": "SC/ST or a woman" }
```

Ops: `eq`, `in`, `lte`, `gte`, `between`. Fields must be profile fields listed in
`server/src/modules/eligibility/eligibility.fields.js`. A server test checks every scheme in this file against that list.

## Later
- `scrapers/` scripts to pull schemes from myScheme and state portals (Phase 2 of the plan)
- state-specific schemes
