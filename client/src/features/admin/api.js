import { api } from "../../shared/lib/api.js";

export const adminApi = {
  list: (params = {}) => {
    const q = new URLSearchParams();
    if (params.q) q.set("q", params.q);
    if (params.status) q.set("status", params.status);
    const qs = q.toString();
    return api(`/schemes/admin/all${qs ? `?${qs}` : ""}`);
  },
  get: (slug) => api(`/schemes/${slug}`),
  create: (data) => api("/schemes", { method: "POST", body: data }),
  update: (slug, data) => api(`/schemes/${slug}`, { method: "PUT", body: data }),
  remove: (slug) => api(`/schemes/${slug}`, { method: "DELETE" }),
};

