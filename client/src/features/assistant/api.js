import { api } from "../../shared/lib/api.js";

export const assistantApi = {
  ask: ({ message, language, history }) => api("/chat", { method: "POST", body: { message, language, history } }),
};
