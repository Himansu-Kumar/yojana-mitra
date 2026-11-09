import mongoose from "mongoose";
import { ELIGIBILITY_FIELDS } from "../eligibility/eligibility.fields.js";

const opts = (key) => ELIGIBILITY_FIELDS[key].options;

// Booleans have no default on purpose: "not answered" must stay different from "no".
const profileSchema = new mongoose.Schema(
  {
    dateOfBirth: Date,
    gender: { type: String, enum: opts("gender") },
    state: String,
    district: String,
    area: { type: String, enum: opts("area") },
    category: { type: String, enum: opts("category") },
    annualIncome: { type: Number, min: 0 },
    occupation: { type: String, enum: opts("occupation") },
    maritalStatus: { type: String, enum: opts("maritalStatus") },
    hasDisability: Boolean,
    isBPL: Boolean,
    ownsPuccaHouse: Boolean,
    landHoldingAcres: { type: Number, min: 0 },
    paysIncomeTax: Boolean,
    isGovtEmployee: Boolean,
    isPregnantOrNewMother: Boolean,
    preferredLanguage: { type: String, default: "en" },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["citizen", "ngo", "official"], default: "citizen" },
    profile: { type: profileSchema, default: () => ({}) },
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function toPublic() {
  return {
    id: String(this._id),
    name: this.name,
    email: this.email,
    role: this.role,
    profile: this.profile?.toObject ? this.profile.toObject() : this.profile || {},
  };
};

export const User = mongoose.model("User", userSchema);
