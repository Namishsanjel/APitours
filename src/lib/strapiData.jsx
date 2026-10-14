import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getStrapi, peekStrapi, invalidateStrapi, asList, bestImage } from "./strapi.js";

/**
 * React bindings for the Strapi client.
 *
 * Every reader is given the same four states, and only four:
 *
 *   "loading" — the request has not answered yet, and nothing cached can
 *               answer for it. Sections render a skeleton in this state and
 *               nothing else: the hardcoded copy is not shown as a
 *               placeholder for CMS content that is on its way.
 *   "ready"   — Strapi answered with at least one entry. The CMS content
 *               renders.
 *   "error"   — the request failed, timed out after 8s, or the network is
 *               down. The section renders an explicit error state with a
 *               "Try again" button; it never renders the hardcoded copy,
 *               because a copy standing in for content we failed to fetch is
 *               a claim the CMS has not confirmed.
 *   "empty"   — the request succeeded but the collection has nothing in it.
 *               An empty collection is an editorial state rather than a
 *               failure, so it is never reported as an error: each section
 *               either hides itself or shows one neutral line.
 *
 * Every reader also gets a `retry`, which clears that path's cached entry (see
 * invalidateStrapi) and refetches it, so the section falls back through its own
 * skeleton rather than through a page reload. The 8s timeout and the cached
 * no-flash behaviour are unchanged.
 */

/** The four statuses every reader reports. */
export const STRAPI_STATUS = Object.freeze({
  LOADING: "loading",
  READY: "ready",
  ERROR: "error",
  EMPTY: "empty",
});

/**
 * One request each for the two catalogue collections, for the whole app.
 *
 * Every populate needed by the adapter is listed explicitly — Strapi v5 returns
 * a relation's own scalars but not its media or components unless asked, and
 * `populate=*` does not reach nested data. pageSize 100 covers the whole
 * collection in one page, and sort=order:asc gives the order the pages already
 * present the lists in.
 */
const TOURS_PATH =
  "tours?populate[coverImage]=true&populate[gallery]=true&populate[itinerary]=true" +
  "&populate[inclusions]=true&populate[exclusions]=true&populate[destination]=true" +
  "&sort=order:asc&pagination[pageSize]=100";

const DESTINATIONS_PATH =
  "destinations?populate[image]=true&populate[attractions]=true&populate[activities]=true" +
  "&populate[bestTime]=true&populate[tours][fields][0]=slug&sort=order:asc&pagination[pageSize]=100";

/** The single type the header, the footer and both their logos read. */
const GLOBAL_PATH = "global?populate[logo]=true&populate[logoDark]=true";

/**
 * The gallery page as a single type, so it is fetched with useStrapiList rather
 * than with the two collection requests above: the photos are only wanted by
 * /gallery and by a tour detail page, and this way nothing else pays for them.
 *
 * Declared here so both pages pass the same string, and the 60s cache in
 * strapi.js answers the second reader from the first one's request.
 *
 * `populate=photos` is enough: a media field comes back whole, with its
 * formats, its width/height and its alternativeText.
 */
export const GALLERY_PATH = "gallery-page?populate=photos";

/**
 * The status a settled value earns: an entry (or a non-empty list) is "ready",
 * a single type that came back null and a collection that came back empty are
 * both "empty" — there is content, and there is nothing in it.
 */
function settledStatus(value, list) {
  if (list) return asList(value).length > 0 ? STRAPI_STATUS.READY : STRAPI_STATUS.EMPTY;
  return value ? STRAPI_STATUS.READY : STRAPI_STATUS.EMPTY;
}

/**
 * The state a reader starts in, read straight off the shared cache.
 *
 * This is the whole no-flash story: a path whose request already resolved
 * inside the 60s window answers "ready" here, synchronously, so the reader's
 * very first render already has the content and never mounts a skeleton. Every
 * other path — nothing cached, a request in flight, or a stale entry — starts
 * at "loading" and the section draws its skeleton until the request lands.
 *
 * Pure, so it is safe to call during render (see useStrapiList, which needs it
 * for a path that changed since the last one).
 */
function initialState(path, list) {
  const peeked = peekStrapi(path);
  if (peeked.status !== "ready") {
    return { path, data: null, error: null, status: STRAPI_STATUS.LOADING };
  }
  const data = list ? asList(peeked.data) : peeked.data ?? null;
  return { path, data, error: null, status: settledStatus(data, list) };
}

const StrapiContext = createContext(null);

/**
 * The bookkeeping behind every "Try again" button: one attempt counter per
 * path, plus a record of which paths are currently in flight.
 *
 * The counter is what a retry bumps — the fetch effect depends on it, so
 * bumping it re-runs that one request and nothing else. The in-flight set is
 * what stops the button being spammed: a retry that lands while its own path is
 * still fetching is ignored outright, and because a retry flips the reader back
 * to "loading" (and therefore back to its skeleton, which has no button on it),
 * there is no window in which the same path can be asked twice.
 */
function useRetryRegistry() {
  const [attempts, setAttempts] = useState({});
  const pending = useRef(new Set());

  const retry = useCallback((path) => {
    const key = String(path ?? "").trim();
    if (!key || pending.current.has(key)) return;
    // Drop the cached answer first: without this the retry would be handed the
    // previous response by the 60s TTL and would look like it did nothing.
    invalidateStrapi(key);
    setAttempts((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
  }, []);

  return { attempts, retry, pending };
}

/**
 * One resource, fetched and published as { path, data, error, status }.
 *
 * Shared by the three collections StrapiProvider holds for the whole app and by
 * useStrapiList below, so both get identical caching, retry and status rules
 * from one implementation.
 *
 * A path whose response is already cached starts at "ready" and never mounts a
 * skeleton; a path that changed re-reads the cache during render (initialState
 * is a pure cache read), which is why navigating between two galleries does not
 * flash.
 */
function useStrapiResource(path, list, { attempts, pending }) {
  const attempt = attempts[path] ?? 0;
  const [state, setState] = useState(() => initialState(path, list));

  useEffect(() => {
    let alive = true;
    pending.current.add(path);

    getStrapi(path)
      .then((data) => {
        if (alive) setState({ path, data: list ? asList(data) : data ?? null, error: null, status: settledStatus(data, list) });
      })
      .catch((error) => {
        // Kept as a state rather than a thrown error: every consumer renders
        // its own error state from "error", and the error object travels with it
        // for anyone who wants to log it.
        if (alive) setState({ path, data: null, error, status: STRAPI_STATUS.ERROR });
      })
      .finally(() => {
        pending.current.delete(path);
      });

    return () => {
      alive = false;
    };
  }, [path, attempt, list, pending]);

  // State belonging to a previous path is ignored rather than cleared inside the
  // effect, which would cost a second render pass on every path change.
  return state.path === path ? state : initialState(path, list);
}

/**
 * Fetches the global entry, the tours and the destinations once for the whole
 * app, and publishes each with its status.
 *
 * One slot per resource, each a { data, status } pair: the header, the footer
 * and anything else that needs the site's own name or logos read `global` from
 * here rather than each issuing its own request, and a page that needs both
 * collections (the tours listing filtering by destination, the nav menus) does
 * not issue its own pair per mount.
 *
 * Both media fields are populated explicitly: `logo` is the one that sits over
 * a photo, `logoDark` the one on the cream panel.
 */
export function StrapiProvider({ children }) {
  const { attempts, retry, pending } = useRetryRegistry();

  const global = useStrapiResource(GLOBAL_PATH, false, { attempts, pending });
  const tours = useStrapiResource(TOURS_PATH, true, { attempts, pending });
  const destinations = useStrapiResource(DESTINATIONS_PATH, true, { attempts, pending });

  // Each published slot carries its own resource's retry, bound to that
  // resource's path, so a caller never has to know which path a reader used.
  const value = useMemo(
    () => ({
      global: { ...global, retry: () => retry(GLOBAL_PATH) },
      tours: { ...tours, retry: () => retry(TOURS_PATH) },
      destinations: { ...destinations, retry: () => retry(DESTINATIONS_PATH) },
    }),
    [global, tours, destinations, retry],
  );

  return <StrapiContext.Provider value={value}>{children}</StrapiContext.Provider>;
}

/**
 * What a reader gets with no provider above it. Nothing is in flight and
 * nothing has loaded, so the resource reads as empty — an explicit state every
 * caller renders as "nothing to show yet", never as content.
 */
const NO_PROVIDER = {
  path: null,
  data: null,
  error: null,
  status: STRAPI_STATUS.EMPTY,
  retry: () => {},
};

/** The global entry as { data, status, retry } — the header and the footer's data. */
export function useGlobalState() {
  return useContext(StrapiContext)?.global ?? NO_PROVIDER;
}

/** Raw Strapi tour entries as { data, status, retry }. */
export function useStrapiToursState() {
  return useContext(StrapiContext)?.tours ?? NO_PROVIDER;
}

/** Raw Strapi destination entries as { data, status, retry }. */
export function useStrapiDestinationsState() {
  return useContext(StrapiContext)?.destinations ?? NO_PROVIDER;
}

/**
 * The global entry, or null while loading / if Strapi is unreachable.
 *
 * The data-only shape every existing caller reads; useGlobalState() is the
 * same value with the status attached.
 */
export function useGlobal() {
  return useGlobalState().data;
}

/** Raw Strapi tour entries, or null until there are any. */
export function useStrapiTours() {
  return useStrapiToursState().data;
}

/** Raw Strapi destination entries, or null until there are any. */
export function useStrapiDestinations() {
  return useStrapiDestinationsState().data;
}

/**
 * Reads any collection (or a filtered one) from Strapi.
 *
 * Returns { items, data, error, loading, status, path, retry } — `data` being
 * the same array under the name the other hooks use, so a caller can
 * destructure either. `items` is kept for every existing caller; `loading` is
 * kept for the one that reads it.
 *
 *   status  "loading" | "ready" | "error" | "empty"
 *
 * A path whose response is already in the 60s cache starts at "ready", so a
 * second reader of the same path never shows a skeleton. A path that changed
 * re-reads the cache during render (initialState is a pure cache read), which
 * is why navigating from one tour's gallery to another's does not flash.
 *
 * `retry` clears this path's cached entry and refetches it. It is a no-op while
 * a request for the same path is already in flight.
 */
export function useStrapiList(path) {
  const { attempts, retry, pending } = useRetryRegistry();
  const current = useStrapiResource(path, true, { attempts, pending });

  return {
    items: current.data,
    /** The same array, named as the other hooks name it. */
    data: current.data,
    error: current.error,
    status: current.status,
    // still waiting on the first answer for this path
    loading: current.status === STRAPI_STATUS.LOADING,
    /** The path this state belongs to — the one `retry` clears and refetches. */
    path,
    retry: () => retry(path),
  };
}

/** True only once Strapi has returned entries worth replacing the copy with. */
export function hasContent(items) {
  return Array.isArray(items) && items.length > 0;
}

/**
 * Optional media field -> an image descriptor, or null when the entry has no
 * media. `fallbackAlt` is the entry's title or name, used when the editor left
 * alternativeText empty. A null result means the caller renders no <img> at all
 * rather than a broken one.
 */
export function imageOf(media, fallbackAlt = "") {
  return bestImage(media, fallbackAlt);
}