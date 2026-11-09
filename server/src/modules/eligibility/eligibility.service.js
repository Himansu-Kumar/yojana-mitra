import { getApprovedSchemes, getSchemeBySlug } from "../schemes/scheme.service.js";
import { profileToFacts } from "./eligibility.fields.js";
import { evaluateScheme, rankSchemes, computeWallet, STATUS } from "./eligibility.engine.js";

const toCard = ({ scheme, result }) => ({
  slug: scheme.slug,
  name: scheme.name,
  ministry: scheme.ministry,
  categories: scheme.categories,
  benefit: scheme.benefit,
  applyUrl: scheme.applyUrl,
  result,
});

/** Full eligibility picture for a user: grouped results + Benefit Wallet. */
export async function getEligibilityForProfile(profile) {
  const facts = profileToFacts(profile);
  const ranked = rankSchemes(await getApprovedSchemes(), facts);
  const wallet = computeWallet(ranked);

  const groups = { eligible: [], near_miss: [], needs_info: [], not_eligible: [] };
  for (const item of ranked) groups[item.result.status].push(toCard(item));

  // Which missing profile fields would unlock the most checks
  const missingCounts = {};
  for (const card of groups.needs_info) {
    for (const f of card.result.missingFields) missingCounts[f] = (missingCounts[f] || 0) + 1;
  }
  const topMissingFields = Object.entries(missingCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([field, count]) => ({ field, count }));

  return {
    facts,
    wallet,
    counts: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])),
    groups,
    topMissingFields,
  };
}

export async function getEligibilityForScheme(profile, slug) {
  const scheme = await getSchemeBySlug(slug);
  return evaluateScheme(scheme, profileToFacts(profile));
}

export { STATUS };
