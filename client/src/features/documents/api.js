import { api } from "../../shared/lib/api.js";

export const documentsApi = {
  extract: (file) => {
    const form = new FormData();
    form.append("file", file);
    return api("/documents/extract", { method: "POST", form });
  },
};
