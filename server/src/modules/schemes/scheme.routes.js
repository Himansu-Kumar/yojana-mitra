import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate.js";
import { CATEGORIES, LIFE_EVENTS } from "./scheme.constants.js";
import { listSchemes, getSchemeBySlug } from "./scheme.service.js";

const listQuery = z.object({
  q: z.string().trim().max(200).optional(),
  category: z.enum(CATEGORIES).optional(),
  lifeEvent: z.enum(LIFE_EVENTS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const schemeRouter = Router();

schemeRouter.get("/meta", (_req, res) => {
  res.json({ categories: CATEGORIES, lifeEvents: LIFE_EVENTS });
});

schemeRouter.get("/", validate(listQuery, "query"), async (req, res) => {
  res.json(await listSchemes(req.validatedQuery));
});

schemeRouter.get("/:slug", async (req, res) => {
  res.json({ scheme: await getSchemeBySlug(req.params.slug) });
});

// Admin create/update/approve routes come in Step 5 (rule extractor + admin review).
