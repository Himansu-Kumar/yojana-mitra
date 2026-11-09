import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import bcrypt from "bcryptjs";
import { Scheme } from "./scheme.model.js";
import { User } from "../users/user.model.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const SEED_FILE = process.env.SEED_FILE || path.resolve(here, "../../../../data/schemes.json");

/** Upserts every scheme from data/schemes.json by slug. */
export async function seedSchemes() {
  const schemes = JSON.parse(readFileSync(SEED_FILE, "utf8"));
  await Scheme.bulkWrite(
    schemes.map((s) => ({
      updateOne: { filter: { slug: s.slug }, update: { $set: { ...s, rulesStatus: "approved" } }, upsert: true },
    }))
  );
  await Scheme.syncIndexes();
  return schemes.length;
}

/** Demo personas for the hackathon demo (password: demo1234). */
const DEMO_USERS = [
  {
    name: "Sunita Devi",
    email: "sunita@demo.yojanamitra.in",
    profile: {
      dateOfBirth: "1992-03-10",
      gender: "female",
      state: "Odisha",
      area: "rural",
      category: "st",
      annualIncome: 90000,
      occupation: "agri_labourer",
      maritalStatus: "married",
      hasDisability: false,
      isBPL: true,
      ownsPuccaHouse: false,
      landHoldingAcres: 0,
      paysIncomeTax: false,
      isGovtEmployee: false,
      isPregnantOrNewMother: true,
      preferredLanguage: "hi",
    },
  },
  {
    name: "Ravi Kumar",
    email: "ravi@demo.yojanamitra.in",
    profile: {
      dateOfBirth: "2007-01-20",
      gender: "male",
      state: "Bihar",
      area: "rural",
      category: "sc",
      annualIncome: 270000,
      occupation: "student",
      maritalStatus: "single",
      hasDisability: false,
      isBPL: false,
      ownsPuccaHouse: true,
      paysIncomeTax: false,
      isGovtEmployee: false,
    },
  },
  {
    name: "Ramesh Patel",
    email: "ramesh@demo.yojanamitra.in",
    profile: {
      dateOfBirth: "1988-07-05",
      gender: "male",
      state: "Gujarat",
      area: "rural",
      category: "obc",
      annualIncome: 150000,
      occupation: "farmer",
      maritalStatus: "married",
      hasDisability: false,
      isBPL: true,
      ownsPuccaHouse: true,
      landHoldingAcres: 3,
      paysIncomeTax: false,
      isGovtEmployee: false,
    },
  },
  {
    name: "District Officer (Demo)",
    email: "official@demo.yojanamitra.in",
    role: "official",
    profile: {
      state: "Odisha",
      district: "Khordha",
    },
  },
  {
    name: "CSC Worker (Demo)",
    email: "ngo@demo.yojanamitra.in",
    role: "ngo",
    profile: {
      state: "Odisha",
      district: "Khordha",
    },
  },
];

export async function seedDemoUsers() {
  const passwordHash = await bcrypt.hash("demo1234", 10);
  for (const u of DEMO_USERS) {
    await User.updateOne({ email: u.email }, { $set: { ...u, passwordHash } }, { upsert: true });
  }
  return DEMO_USERS.length;
}
