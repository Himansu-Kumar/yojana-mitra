import { Scheme } from "./scheme.model.js";
import { notFound } from "../../utils/httpError.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Lists schemes with optional text search and filters. */
export async function listSchemes({ q, category, lifeEvent, page = 1, limit = 50 } = {}) {
  const filter = {};
  if (category) filter.categories = category;
  if (lifeEvent) filter.lifeEvents = lifeEvent;

  let items;
  if (q) {
    // Full-text first; fall back to partial matching for short or partial words
    items = await Scheme.find({ ...filter, $text: { $search: q } }, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .lean();
    if (items.length === 0) {
      const rx = new RegExp(escapeRegex(q), "i");
      items = await Scheme.find({ ...filter, $or: [{ name: rx }, { description: rx }, { categories: rx }] }).lean();
    }
  } else {
    items = await Scheme.find(filter).sort({ name: 1 }).lean();
  }

  const total = items.length;
  const start = (page - 1) * limit;
  return { items: items.slice(start, start + limit), total, page, limit };
}

export async function getSchemeBySlug(slug) {
  const scheme = await Scheme.findOne({ slug }).lean();
  if (!scheme) throw notFound("Scheme not found");
  return scheme;
}

/** All schemes whose rules are approved (used by the eligibility engine). */
export function getApprovedSchemes() {
  return Scheme.find({ rulesStatus: "approved" }).lean();
}
