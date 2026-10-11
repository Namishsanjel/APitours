/**
 * Strapi REST client.
 *
 * The site is a Vite SPA, so every request happens in the browser and the
 * module-level cache below is what stands in for a server-side fetch cache.
 * Entries are held for 60 seconds, after which the next reader refetches.
 *
 * Config comes from VITE_STRAPI_URL (see .env.local). Vite only exposes
 * `VITE_`-prefixed variables to client code, so a `NEXT_PUBLIC_` name would
 * silently resolve to nothing here.
 */

const RAW_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_STRAPI_URL) ||
  "http://localhost:1337";

/** Strapi origin with any trailing slash removed. */
export const STRAPI_URL = String(RAW_URL).replace(/\/+$/, "");

/** How long a successful response stays in the cache. */
export const CACHE_TTL = 60 * 1000;

/** key -> { at, promise }. Promises are cached so parallel readers share one request. */
const cache = new Map();

/**
 * GET `path` from Strapi's /api and return the `data` field.
 *
 * `path` is the part after `/api/` — e.g. "services?populate=image&sort=order:asc".
 * Throws on a non-OK response with the endpoint and status in the message;
 * a rejected request is dropped from the cache so the next reader can retry.
 */
export function getStrapi(path, { ttl = CACHE_TTL, force = false } = {}) {
  const key = String(path ?? "").trim();
  if (!key) return Promise.reject(new Error("getStrapi: a path is required"));

  const hit = cache.get(key);
  if (!force && hit && Date.now() - hit.at < ttl) return hit.promise;

  const promise = (async () => {
    const url = `${STRAPI_URL}/api/${key}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });

    if (!res.ok) {
      // Keep the body in the message: Strapi explains a 403/404 far better
      // than the status line alone, and this is the only place it surfaces.
      const body = await res.text().catch(() => "");
      const detail = body ? ` — ${body.slice(0, 200)}` : "";
      throw new Error(`Strapi request failed: GET ${url} returned ${res.status} ${res.statusText}${detail}`);
    }

    const json = await res.json();
    return json?.data ?? null;
  })();

  cache.set(key, { at: Date.now(), promise });

  // A failure must not be remembered as though it were content, or the page
  // would keep showing the fallback for the whole TTL after one blip.
  promise.catch(() => {
    if (cache.get(key)?.promise === promise) cache.delete(key);
  });

  return promise;
}

/** Drops every cached response. Used when a page needs to show live values. */
export function clearStrapiCache() {
  cache.clear();
}

/**
 * Strapi media `url`s come back relative ("/uploads/x.jpg"). Absolute URLs are
 * already usable as-is, so only the relative ones get the origin prefixed.
 * Returns null for anything missing, so callers can simply skip the image.
 */
export function mediaUrl(url) {
  if (!url || typeof url !== "string") return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  return `${STRAPI_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Best available rendition of a Strapi media object: medium, then small, then
 * the original. Returns null when there is no usable media, and otherwise
 * { src, alt, width, height } — callers render nothing for a null result.
 *
 * `alt` prefers the editor's alternativeText and falls back to the caller's
 * own caption (usually the entry's title or name) so images are never left
 * with an empty alt.
 */
export function bestImage(media, fallbackAlt = "") {
  if (!media || typeof media !== "object") return null;

  const pick =
    media.formats?.medium ?? media.formats?.small ?? (media.url ? { url: media.url, width: media.width, height: media.height } : null);

  const src = mediaUrl(pick?.url);
  if (!src) return null;

  return {
    src,
    alt: media.alternativeText || fallbackAlt || media.name || "",
    width: pick?.width ?? media.width ?? null,
    height: pick?.height ?? media.height ?? null,
  };
}

/** Strapi lists arrive as arrays; a single type as one object. Normalise both. */
export function asList(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return [data];
  return [];
}

/** Flatten a blocks field to plain text — for meta descriptions and fallbacks. */
export function blocksToText(content) {
  if (!Array.isArray(content)) return typeof content === "string" ? content : "";
  return content
    .map((node) => {
      const children = Array.isArray(node?.children) ? node.children : [];
      const own = typeof node?.text === "string" ? node.text : "";
      return [own, ...children.map((c) => (typeof c?.text === "string" ? c.text : ""))].join("");
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}