import { mlClient, MlUnavailableError } from "../../clients/mlClient.js";
import { listSchemes } from "../schemes/scheme.service.js";
import { getEligibilityForProfile } from "../eligibility/eligibility.service.js";

const MAX_CONTEXT_SCHEMES = 8;

/**
 * Builds the scheme context for the assistant (retrieval), then asks ml-service to answer.
 * Only non-identifying profile facts are sent to the AI (no name, email or phone).
 */
export async function askAssistant({ user, message, language = "en", history = [] }) {
  const eligibility = await getEligibilityForProfile(user.profile);
  const statusBySlug = new Map();
  for (const group of Object.values(eligibility.groups)) {
    for (const card of group) statusBySlug.set(card.slug, card.result);
  }

  // Retrieval: schemes matching the question, then the user's best matches
  const { items: matched } = await listSchemes({ q: message, limit: 5 });
  const picks = new Map();
  for (const s of matched) picks.set(s.slug, s);
  for (const card of eligibility.groups.eligible.concat(eligibility.groups.near_miss)) {
    if (picks.size >= MAX_CONTEXT_SCHEMES) break;
    if (!picks.has(card.slug)) picks.set(card.slug, card);
  }

  const schemes = [...picks.values()].map((s) => {
    const r = statusBySlug.get(s.slug);
    return {
      slug: s.slug,
      name: s.name,
      description: s.description,
      benefit: s.benefit?.summary,
      documents: s.documents,
      applyUrl: s.applyUrl,
      eligibilityStatus: r?.status,
      eligibilityReason: r?.summary,
    };
  });

  try {
    const { answer, citations } = await mlClient.chat({
      message,
      language,
      history: history.slice(-6),
      profile: eligibility.facts,
      schemes,
    });
    return { answer, citations: citations || [], source: "ai" };
  } catch (err) {
    if (!(err instanceof MlUnavailableError)) console.error("[chat] ML error:", err.message);
    return fallbackAnswer({ language, schemes });
  }
}

const STATUS_TEXT = {
  en: { eligible: "you qualify", near_miss: "almost: check the reason", needs_info: "add details to check", not_eligible: "you may not qualify" },
  hi: { eligible: "आप पात्र हैं", near_miss: "लगभग पात्र", needs_info: "जाँच के लिए जानकारी जोड़ें", not_eligible: "शायद पात्र नहीं" },
};

/** Used when ml-service is down: a plain, honest list instead of an AI answer. */
function fallbackAnswer({ language, schemes }) {
  const lang = language === "hi" ? "hi" : "en";
  const top = schemes.slice(0, 5);
  if (top.length === 0) {
    return {
      answer: lang === "hi" ? "मुझे इससे जुड़ी कोई योजना नहीं मिली। कृपया अलग शब्दों में पूछें।" : "I couldn't find a matching scheme. Try asking in different words.",
      citations: [],
      source: "fallback",
    };
  }
  const intro = lang === "hi" ? "आपके सवाल से जुड़ी योजनाएँ:" : "Schemes related to your question:";
  const lines = top.map((s) => {
    const status = s.eligibilityStatus ? ` (${STATUS_TEXT[lang][s.eligibilityStatus]})` : "";
    return `• ${s.name}: ${s.benefit || ""}${status}`;
  });
  const note = lang === "hi" ? "(AI सहायक अभी उपलब्ध नहीं है, यह एक सरल सूची है।)" : "(The AI assistant is offline, so this is a simple list.)";
  return { answer: [intro, ...lines, "", note].join("\n"), citations: top.map((s) => s.slug), source: "fallback" };
}
