import { api } from "../../shared/lib/api.js";

export const eligibilityApi = {
  mine: () => api("/eligibility/me"),
  forScheme: (slug) => api(`/eligibility/schemes/${encodeURIComponent(slug)}`),
};
