import { useEffect } from "react";

export function useTitle(title?: string) {
  useEffect(() => {
    const base = "Collector Provenance";
    document.title = title ? `${title} | ${base}` : `${base} — Provenance Documentation for Collector Cars`;
  }, [title]);
}
