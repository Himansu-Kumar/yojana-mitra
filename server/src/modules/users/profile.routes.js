import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { profileUpdateSchema } from "./profile.validation.js";
import { profileToFacts } from "../eligibility/eligibility.fields.js";

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.get("/", (req, res) => {
  res.json({ user: req.user.toPublic(), facts: profileToFacts(req.user.profile) });
});

profileRouter.put("/", validate(profileUpdateSchema), async (req, res) => {
  const { name, profile } = req.body;
  if (name) req.user.name = name;
  if (profile) {
    for (const [key, value] of Object.entries(profile)) {
      req.user.profile[key] = value === null ? undefined : value;
    }
  }
  await req.user.save();
  res.json({ user: req.user.toPublic(), facts: profileToFacts(req.user.profile) });
});
