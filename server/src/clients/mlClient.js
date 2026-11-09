/**
 * The ONLY place the server talks to ml-service.
 * If an ML endpoint changes, only this file changes.
 */
import { config } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

export class MlUnavailableError extends HttpError {
  constructor(message = "The AI service is not reachable right now") {
    super(503, message);
  }
}

async function request(path, { method = "POST", json, form, timeoutMs = 30000 } = {}) {
  let res;
  try {
    res = await fetch(`${config.mlServiceUrl}${path}`, {
      method,
      headers: json ? { "Content-Type": "application/json" } : undefined,
      body: json ? JSON.stringify(json) : form,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new MlUnavailableError();
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof body.detail === "string" ? body.detail : `ML service error (${res.status})`;
    // ml-service 503 = not configured (e.g. no API key): pass it through so the client can explain
    if (res.status === 503) throw new MlUnavailableError(message);
    throw new HttpError(res.status >= 500 ? 502 : 400, message);
  }
  return body;
}

export const mlClient = {
  health: () => request("/health", { method: "GET", timeoutMs: 3000 }),

  /** @returns {Promise<{answer: string, citations: string[]}>} */
  chat: ({ message, language, history, profile, schemes }) =>
    request("/chat", { json: { message, language, history, profile, schemes } }),

  /** @returns {Promise<{documentType: string, fields: object, confidence: number}>} */
  extractDocument: ({ buffer, mimetype, filename }) => {
    const form = new FormData();
    form.append("file", new Blob([buffer], { type: mimetype }), filename || "document");
    return request("/ocr/extract", { form, timeoutMs: 60000 });
  },
};
