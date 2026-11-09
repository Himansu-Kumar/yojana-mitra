import { z } from "zod";
import { ELIGIBILITY_FIELDS } from "../eligibility/eligibility.fields.js";

const enumOf = (key) => z.enum(ELIGIBILITY_FIELDS[key].options);
// null clears a field (back to "not answered")
const opt = (schema) => schema.nullable().optional();

export const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    profile: z
      .object({
        dateOfBirth: opt(z.coerce.date().max(new Date(), "Date of birth can't be in the future")),
        gender: opt(enumOf("gender")),
        state: opt(z.string().trim().max(60)),
        district: opt(z.string().trim().max(60)),
        area: opt(enumOf("area")),
        category: opt(enumOf("category")),
        annualIncome: opt(z.coerce.number().min(0).max(1e9)),
        occupation: opt(enumOf("occupation")),
        maritalStatus: opt(enumOf("maritalStatus")),
        hasDisability: opt(z.boolean()),
        isBPL: opt(z.boolean()),
        ownsPuccaHouse: opt(z.boolean()),
        landHoldingAcres: opt(z.coerce.number().min(0).max(10000)),
        paysIncomeTax: opt(z.boolean()),
        isGovtEmployee: opt(z.boolean()),
        isPregnantOrNewMother: opt(z.boolean()),
        preferredLanguage: opt(z.enum(["en", "hi"])),
      })
      .strict()
      .optional(),
  })
  .strict();
