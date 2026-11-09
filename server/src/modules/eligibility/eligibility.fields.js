/**
 * Profile facts the eligibility engine can check.
 * Scheme rules (data/schemes.json) may only use these fields.
 * Keep in sync with: users/user.model.js (profile) and client/src/features/profile/profileFields.js
 */
export const ELIGIBILITY_FIELDS = {
  age: { type: "number", label: "age" },
  gender: { type: "enum", options: ["male", "female", "other"], label: "gender" },
  state: { type: "string", label: "state" },
  area: { type: "enum", options: ["rural", "urban"], label: "whether you live in a rural or urban area" },
  category: { type: "enum", options: ["general", "obc", "sc", "st", "ews"], label: "social category" },
  annualIncome: { type: "number", label: "family annual income", money: true },
  occupation: {
    type: "enum",
    options: [
      "farmer",
      "agri_labourer",
      "daily_wage",
      "street_vendor",
      "artisan",
      "self_employed",
      "salaried",
      "student",
      "homemaker",
      "unemployed",
      "retired",
      "other",
    ],
    label: "occupation",
  },
  maritalStatus: { type: "enum", options: ["single", "married", "widowed", "divorced"], label: "marital status" },
  hasDisability: { type: "boolean", label: "disability status" },
  isBPL: { type: "boolean", label: "whether your household is BPL" },
  ownsPuccaHouse: { type: "boolean", label: "whether you own a pucca house" },
  landHoldingAcres: { type: "number", label: "land owned (acres)" },
  paysIncomeTax: { type: "boolean", label: "whether you pay income tax" },
  isGovtEmployee: { type: "boolean", label: "whether you are a government employee" },
  isPregnantOrNewMother: { type: "boolean", label: "whether you are pregnant or a new mother" },
};

export const RULE_OPS = ["eq", "in", "lte", "gte", "between"];

/** Converts a stored profile into flat facts for the engine (derives age from date of birth). */
export function profileToFacts(profile = {}, now = new Date()) {
  const facts = {};
  for (const key of Object.keys(ELIGIBILITY_FIELDS)) {
    const v = profile[key];
    if (v !== undefined && v !== null && v !== "") facts[key] = v;
  }
  if (profile.dateOfBirth) {
    const dob = new Date(profile.dateOfBirth);
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    facts.age = age;
  }
  return facts;
}
