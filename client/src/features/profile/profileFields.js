// Keep in sync with server/src/modules/eligibility/eligibility.fields.js

const opt = (pairs) => pairs.map(([value, label]) => ({ value, label }));

export const OPTIONS = {
  gender: opt([["female", "Female"], ["male", "Male"], ["other", "Other"]]),
  area: opt([["rural", "Village / rural"], ["urban", "Town or city / urban"]]),
  category: opt([["general", "General"], ["obc", "OBC"], ["sc", "SC"], ["st", "ST"], ["ews", "EWS"]]),
  maritalStatus: opt([["single", "Single"], ["married", "Married"], ["widowed", "Widowed"], ["divorced", "Divorced / separated"]]),
  occupation: opt([
    ["farmer", "Farmer (own or leased land)"],
    ["agri_labourer", "Farm labourer"],
    ["daily_wage", "Daily-wage / construction worker"],
    ["street_vendor", "Street vendor"],
    ["artisan", "Artisan / craftsperson"],
    ["self_employed", "Small business / self-employed"],
    ["salaried", "Salaried job"],
    ["student", "Student"],
    ["homemaker", "Homemaker"],
    ["unemployed", "Looking for work"],
    ["retired", "Retired"],
    ["other", "Other"],
  ]),
};

export const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
].map((s) => ({ value: s, label: s }));

export const BOOLEAN_FIELDS = {
  isBPL: "Does your household have a BPL / Antyodaya ration card?",
  ownsPuccaHouse: "Do you own a pucca (brick/concrete) house?",
  paysIncomeTax: "Do you pay income tax?",
  isGovtEmployee: "Are you a government employee?",
  hasDisability: "Do you have a disability?",
  isPregnantOrNewMother: "Are you pregnant or a new mother?",
};

// Short labels used in "add your X" prompts
export const FIELD_LABELS = {
  age: "date of birth",
  gender: "gender",
  state: "state",
  area: "rural/urban area",
  category: "category",
  annualIncome: "family income",
  occupation: "occupation",
  maritalStatus: "marital status",
  hasDisability: "disability status",
  isBPL: "BPL status",
  ownsPuccaHouse: "house ownership",
  landHoldingAcres: "land owned",
  paysIncomeTax: "income-tax status",
  isGovtEmployee: "government job status",
  isPregnantOrNewMother: "pregnancy status",
  dateOfBirth: "date of birth",
  district: "district",
};
