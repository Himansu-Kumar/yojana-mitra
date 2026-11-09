import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import * as auth from "./auth.service.js";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), async (req, res) => {
  res.status(201).json(await auth.register(req.body));
});

authRouter.post("/login", validate(loginSchema), async (req, res) => {
  res.json(await auth.login(req.body));
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user.toPublic() });
});
