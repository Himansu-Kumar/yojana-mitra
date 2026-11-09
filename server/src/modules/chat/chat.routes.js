import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { askAssistant } from "./chat.service.js";

const chatSchema = z.object({
  message: z.string().trim().min(1, "Type a question").max(1000),
  language: z.enum(["en", "hi"]).default("en"),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(20)
    .default([]),
});

export const chatRouter = Router();

chatRouter.post("/", requireAuth, validate(chatSchema), async (req, res) => {
  res.json(await askAssistant({ user: req.user, ...req.body }));
});
