import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth.js";
import { badRequest, forbidden } from "../../utils/httpError.js";
import { extractProfileFromDocument } from "./documents.service.js";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

// Kept in memory only: nothing is written to disk in the prototype.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(badRequest("Upload a JPG, PNG, WEBP or PDF file")),
});

export const documentsRouter = Router();

// Reads a document and returns suggested profile values. Does NOT save anything:
// the user reviews the suggestions and saves them through PUT /api/profile.
documentsRouter.post("/extract", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.user.consent?.documentsAt) {
    throw forbidden("Please agree to document processing first");
  }
  if (!req.file) throw badRequest("Attach a file in the 'file' field");
  res.json(await extractProfileFromDocument(req.file));
});

// Step 7 (Document Vault) will add: POST / (store), GET / (list), DELETE /:id
