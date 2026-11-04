import { useEffect } from "react";
import { SITE_URL } from "../data/content.js";

/**
 * Flattens existing copy into a meta description: collapses whitespace and
 * trims to a sensible length. Never adds wording that is not in the source.
 */
export function metaDescription(text, max = 155) {
  if (!text) return null;
  const flat = String(text).replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : cut.length)}…`;
}

function setMetaDescription(content) {
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

/**
 * Absolute canonical URL for the current route. Mounted once in App so every
 * route (including legacy aliases that get rewritten) points at itself only.
 */
export function useCanonical(path) {
  useEffect(() => {
    if (!path) return;
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.setAttribute("href", `${SITE_URL}${path}`);
  }, [path]);
}

/**
 * Per-page document title + meta description, for pages whose copy is not in
 * the shared PAGES map (tour, destination and blog detail pages).
 */
export function usePageMeta({ title, description }) {
  useEffect(() => {
    if (title) document.title = title;
    const desc = metaDescription(description);
    if (desc) setMetaDescription(desc);
  }, [title, description]);
}