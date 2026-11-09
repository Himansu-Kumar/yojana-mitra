import mongoose from "mongoose";
import { BENEFIT_FREQUENCIES } from "./scheme.constants.js";

const schemeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    ministry: String,
    level: { type: String, enum: ["central", "state"], default: "central" },
    state: { type: String, default: "all" }, // "all" = central scheme
    categories: [String],
    lifeEvents: [String],
    description: String,
    eligibilityText: String, // original wording; input for the M2 rule extractor
    sourceUrl: String, // where the data came from (myScheme page, state portal)
    benefit: {
      amount: { type: Number, default: null },
      frequency: { type: String, enum: [...BENEFIT_FREQUENCIES, null], default: null },
      summary: String,
    },
    // Machine-checkable eligibility. Format documented in data/README.md
    rules: { type: [mongoose.Schema.Types.Mixed], default: [] },
    rulesStatus: { type: String, enum: ["draft", "approved"], default: "approved" },
    alsoCheck: [String],
    documents: [String],
    applyUrl: String,
    deadline: Date, // optional application deadline
    lastVerified: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

schemeSchema.index(
  { name: "text", description: "text", categories: "text", ministry: "text" },
  { weights: { name: 5, categories: 3, description: 1, ministry: 1 }, name: "scheme_text" }
);

export const Scheme = mongoose.model("Scheme", schemeSchema);
