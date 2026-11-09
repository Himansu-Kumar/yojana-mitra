import { Scheme } from "./scheme.model.js";
import { notFound } from "../../utils/httpError.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Lists schemes with optional text search and filters (active only). */
export async function listSchemes({ q, category, lifeEvent, page = 1, limit = 50 } = {}) {
  const filter = { isActive: { $ne: false } };
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

/** All schemes whose rules are approved and active (used by the eligibility engine). */
export function getApprovedSchemes() {
  return Scheme.find({ rulesStatus: "approved", isActive: { $ne: false } }).lean();
}

/** Admin: creates a new scheme */
export async function createScheme(data) {
  const scheme = new Scheme(data);
  await scheme.save();
  return scheme.toObject();
}

/** Admin: updates an existing scheme by slug */
export async function updateScheme(slug, patch) {
  const scheme = await Scheme.findOneAndUpdate({ slug }, { $set: patch }, { new: true, runValidators: true });
  if (!scheme) throw notFound("Scheme not found");
  return scheme.toObject();
}

/** Admin: soft deletes a scheme by setting isActive = false */
export async function deactivateScheme(slug) {
  const scheme = await Scheme.findOneAndUpdate({ slug }, { $set: { isActive: false } }, { new: true });
  if (!scheme) throw notFound("Scheme not found");
  return scheme.toObject();
}

/** Admin: lists all schemes including inactive and drafts */
export async function listAllSchemesForAdmin({ q, status } = {}) {
  const filter = {};
  if (status === "active") filter.isActive = { $ne: false };
  else if (status === "inactive") filter.isActive = false;
  else if (status === "draft" || status === "approved") filter.rulesStatus = status;

  let items;
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    items = await Scheme.find({
      ...filter,
      $or: [{ name: rx }, { slug: rx }, { ministry: rx }, { description: rx }],
    })
      .sort({ updatedAt: -1, name: 1 })
      .lean();
  } else {
    items = await Scheme.find(filter).sort({ updatedAt: -1, name: 1 }).lean();
  }
  return { items };
}
