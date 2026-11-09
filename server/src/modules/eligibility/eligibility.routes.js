import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getEligibilityForProfile, getEligibilityForScheme } from "./eligibility.service.js";

export const eligibilityRouter = Router();

eligibilityRouter.use(requireAuth);

// All schemes, grouped by status, plus the Benefit Wallet
eligibilityRouter.get("/me", async (req, res) => {
  res.json(await getEligibilityForProfile(req.user.profile));
});

// One scheme, with the reason for every condition
eligibilityRouter.get("/schemes/:slug", async (req, res) => {
  res.json({ result: await getEligibilityForScheme(req.user.profile, req.params.slug) });
});
