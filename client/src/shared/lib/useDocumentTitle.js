import { useEffect } from "react";

export function useDocumentTitle(title) {
  useEffect(() => {
    if (!title || title === "Home" || title === "Yojana Mitra") {
      document.title = "Yojana Mitra";
    } else {
      document.title = `${title} · Yojana Mitra`;
    }
  }, [title]);
}

