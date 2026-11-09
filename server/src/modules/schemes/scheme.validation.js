import { z } from "zod";
import { BENEFIT_FREQUENCIES, CATEGORIES, LIFE_EVENTS } from "./scheme.constants.js";
import { validateRules } from "../eligibility/eligibility.rules.js";

const urlOrEmpty = z
  .string()
  .url()
  .or(z.literal(""))
  .nullable()
  .optional();

const refineRules = (data, ctx) => {
  if (data.rules && Array.isArray(data.rules) && data.rules.length > 0) {
    const res = validateRules(data.rules);
    if (!res.ok) {
      for (const err of res.errors) {
        const cleanPath = err.path ? err.path.replace(/^\[/, "").replace(/\]/g, "").split(/[.\[]/) : [];
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: err.message,
          path: ["rules", ...cleanPath],
        });
      }
    }
  }
};

export const baseSchemeSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  name: z.string().min(1, "Name is required"),
  ministry: z.string().optional().default(""),
  level: z.enum(["central", "state"]).optional().default("central"),
  state: z.string().optional().default("all"),
  categories: z.array(z.enum(CATEGORIES)).optional().default([]),
  lifeEvents: z.array(z.enum(LIFE_EVENTS)).optional().default([]),
  description: z.string().min(1, "Description is required"),
  benefit: z
    .object({
      amount: z.number().nullable().optional().default(null),
      frequency: z.enum([...BENEFIT_FREQUENCIES]).nullable().optional().default(null),
      summary: z.string().optional().default(""),
    })
    .optional()
    .default({}),
  rules: z.array(z.any()).optional().default([]),
  alsoCheck: z.array(z.string()).optional().default([]),
  documents: z.array(z.string()).optional().default([]),
  applyUrl: urlOrEmpty,
  sourceUrl: urlOrEmpty,
  eligibilityText: z.string().optional().default(""),
  deadline: z.coerce.date().nullable().optional(),
  lastVerified: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  markVerified: z.boolean().optional(),
});

export const schemeInputSchema = baseSchemeSchema.superRefine(refineRules);

export const schemeUpdateSchema = baseSchemeSchema.partial().superRefine(refineRules);
