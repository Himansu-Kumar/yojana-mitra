import { api } from "../../shared/lib/api.js";

export const authApi = {
  login: (email, password) => api("/auth/login", { method: "POST", body: { email, password } }),
  register: ({ name, email, password }) => api("/auth/register", { method: "POST", body: { name, email, password } }),
  me: () => api("/auth/me"),
};
