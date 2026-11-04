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

/**
 * How long a single request may take before it is abandoned.
 *
 * Without it a request that never settles — a Strapi that accepted the
 * connection and then went quiet — would leave every reader in its loading
 * state forever, with the hardcoded fallback suppressed. Eight seconds is
 * long enough for a cold Strapi boot and short enough that a stalled one is
 * reported as a failure and the fallback comes back.
 */
export const REQUEST_TIMEOUT = 8 * 1000;

/** key -> { at, promise, state, data, error }. Promises are cached so parallel readers share one request. */
const cache = new Map();

/**
 * GET `path` from Strapi's /api and return the `data` field.
 *
 * `path` is the part after `/api/` — e.g. "services?populate=image&sort=order:asc".
 * Throws on a non-OK response with the endpoint and status in the message;
 * a rejected request is dropped from the cache so the next reader can retry.
 *
 * Every fetch is given `REQUEST_TIMEOUT` via an AbortController, so a request
 * that stalls is rejected like any other failure instead of hanging.
 */
export function getStrapi(path, { ttl = CACHE_TTL, force = false, timeout = REQUEST_TIMEOUT } = {}) {
  const key = String(path ?? "").trim();
  if (!key) return Promise.reject(new Error("getStrapi: a path is required"));

  const hit = cache.get(key);
  if (!force && hit && Date.now() - hit.at < ttl) return hit.promise;

  const url = `${STRAPI_URL}/api/${key}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const promise = (async () => {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!res.ok) {
        // Keep the body in the message: Strapi explains a 403/404 far better
        // than the status line alone, and this is the only place it surfaces.
        const body = await res.text().catch(() => "");
        const detail = body ? ` — ${body.slice(0, 200)}` : "";
        throw new Error(`Strapi request failed: GET ${url} returned ${res.status} ${res.statusText}${detail}`);
      }

      const json = await res.json();
      return json?.data ?? null;
    } catch (error) {
      // An abort is ours, not Strapi's: say which one it was, because a timeout
      // and a 500 lead to the same fallback but only one of them is fixable by
      // editing content.
      if (controller.signal.aborted) {
        throw new Error(`Strapi request timed out after ${timeout}ms: GET ${url}`);
      }
      throw error;
    } finally {
      // Whichever way it went, the timer has no one left to fire for.
      clearTimeout(timer);
    }
  })();

  const entry = { at: Date.now(), promise, state: "pending", data: null, error: null };
  cache.set(key, entry);

  // The settled value is kept on the entry as well as inside the promise, so
  // peekStrapi() can answer synchronously — that is what lets a reader arriving
  // after the first one render the content on its very first render.
  promise.then(
    (data) => {
      if (cache.get(key) === entry) {
        entry.state = "ready";
        entry.data = data;
      }
    },
    () => {
      // A failure must not be remembered as though it were content, or the
      // page would keep showing the fallback for the whole TTL after one blip.
      if (cache.get(key) === entry) cache.delete(key);
    },
  );

  return promise;
}

/**
 * The cached answer for `path`, read synchronously and without issuing a
 * request: { status: "ready", data } when a fresh request for this exact path
 * has already resolved, or { status: "loading" } for anything else — nothing
 * cached, a cached request still in flight, or an entry stale past its TTL.
 *
 * Only a *ready* entry is reported. A failed request is deleted from the cache,
 * so the next reader is told "loading" and issues its own attempt rather than
 * inheriting a failure it never saw.
 *
 * This is the one piece that keeps the 60s cache free of a skeleton flash: the
 * second page to ask for the FAQ block gets the answer in the same render it
 * would have used to render the fallback, so it never shows a skeleton at all.
 */
export function peekStrapi(path, { ttl = CACHE_TTL } = {}) {
  const key = String(path ?? "").trim();
  const hit = key ? cache.get(key) : null;
  if (!hit || hit.state !== "ready" || Date.now() - hit.at >= ttl) {
    return { status: "loading", data: null };
  }
  return { status: "ready", data: hit.data };
}

/** Drops every cached response. Used when a page needs to show live values. */
export function clearStrapiCache() {
  cache.clear();
}

/**
 * Drops the cached response for one path, so the next reader of that exact path
 * issues a fresh request instead of being handed the previous entry.
 *
 * This is what a "Try again" button reaches for. A failed request has already
 * been deleted from the cache by the time it settles, so the case that actually
 * needs forcing is a *successful* answer that is still inside its 60s TTL: the
 * retry would otherwise be answered from the cache and appear to do nothing.
 *
 * Called with no path (or a blank one) it clears everything, the same as
 * clearStrapiCache().
 *
 * Safe against a request that is still in flight: the entry's own settle
 * handlers compare themselves against `cache.get(key)` by identity, so a late
 * answer from a superseded request can neither revive the dropped entry nor
 * evict the replacement put there by the retry.
 */
export function invalidateStrapi(path) {
  const key = String(path ?? "").trim();
  if (!key) {
    cache.clear();
    return;
  }
  cache.delete(key);
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