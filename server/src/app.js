import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { mlClient } from "./clients/mlClient.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { profileRouter } from "./modules/users/profile.routes.js";
import { schemeRouter } from "./modules/schemes/scheme.routes.js";
import { eligibilityRouter } from "./modules/eligibility/eligibility.routes.js";
import { chatRouter } from "./modules/chat/chat.routes.js";
import { documentsRouter } from "./modules/documents/documents.routes.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json({ limit: "1mb" }));
  if (!config.isProd) app.use(morgan("dev"));

  app.get("/api/health", async (_req, res) => {
    const ml = await mlClient.health().then(
      () => "up",
      () => "down"
    );
    res.json({ status: "ok", ml });
  });

  // One line per module. New modules are added here.
  app.use("/api/auth", authRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/schemes", schemeRouter);
  app.use("/api/eligibility", eligibilityRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/documents", documentsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
