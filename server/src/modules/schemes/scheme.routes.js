import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { CATEGORIES, LIFE_EVENTS } from "./scheme.constants.js";
import {
  listSchemes,
  getSchemeBySlug,
  createScheme,
  updateScheme,
  deactivateScheme,
  listAllSchemesForAdmin,
} from "./scheme.service.js";
import { schemeInputSchema, schemeUpdateSchema } from "./scheme.validation.js";

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

// Admin routes (official role required) — MUST be defined before /:slug
schemeRouter.get("/admin/all", requireAuth, requireRole("official"), async (req, res) => {
  const { q, status } = req.query;
  const { items } = await listAllSchemesForAdmin({ q, status });
  res.json({ items });
});

schemeRouter.post("/", requireAuth, requireRole("official"), validate(schemeInputSchema), async (req, res) => {
  const { markVerified, ...data } = req.body;
  data.rulesStatus = "approved";
  if (markVerified) {
    data.lastVerified = new Date();
  }
  const scheme = await createScheme(data);
  res.status(201).json({ scheme });
});

schemeRouter.put("/:slug", requireAuth, requireRole("official"), validate(schemeUpdateSchema), async (req, res) => {
  const { markVerified, ...data } = req.body;
  data.rulesStatus = "approved";
  if (markVerified) {
    data.lastVerified = new Date();
  }
  const scheme = await updateScheme(req.params.slug, data);
  res.json({ scheme });
});

schemeRouter.delete("/:slug", requireAuth, requireRole("official"), async (req, res) => {
  const scheme = await deactivateScheme(req.params.slug);
  res.json({ scheme });
});

// Public scheme detail by slug
schemeRouter.get("/:slug", async (req, res) => {
  res.json({ scheme: await getSchemeBySlug(req.params.slug) });
});
