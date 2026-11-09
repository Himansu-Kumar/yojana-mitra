import { api } from "../../shared/lib/api.js";

export const profileApi = {
  get: () => api("/profile"),
  update: (data) => api("/profile", { method: "PUT", body: data }),
};
