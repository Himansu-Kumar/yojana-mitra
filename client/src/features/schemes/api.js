import { api } from "../../shared/lib/api.js";

export const schemesApi = {
  list: (params = {}, signal) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return api(`/schemes${qs ? `?${qs}` : ""}`, { signal });
  },
  get: (slug) => api(`/schemes/${encodeURIComponent(slug)}`),
  meta: () => api("/schemes/meta"),
};
