import { useEffect } from "react";

/**
 * Renders a JSON-LD script into <head>. The script keeps a stable DOM `id`,
 * so route changes overwrite the same tag instead of appending duplicates.
 * Rendered content is replaced on every data change.
 */
export default function JsonLd({ id, data }) {
  const json = data ? JSON.stringify(data) : null;

  useEffect(() => {
    if (!json) return;
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = json;
    return () => {
      el.remove();
    };
  }, [id, json]);

  return null;
}
