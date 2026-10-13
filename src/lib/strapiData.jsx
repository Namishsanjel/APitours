import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getStrapi, peekStrapi, asList, bestImage } from "./strapi.js";

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
 *               down. The hardcoded fallback renders.
 *   "empty"   — the request succeeded but the collection has nothing in it.
 *               The hardcoded fallback renders, exactly as on a failure: an
 *               empty collection is an editorial state, not a rendering one.
 *
 * The fallback is therefore reached through exactly one branch (error/empty)
 * rather than through the absence of data, which is what used to make a
 * section flash its hardcoded copy and then swap it out.
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
  const [global, setGlobal] = useState(() => initialState(GLOBAL_PATH, false));
  const [tours, setTours] = useState(() => initialState(TOURS_PATH, true));
  const [destinations, setDestinations] = useState(() => initialState(DESTINATIONS_PATH, true));

  useEffect(() => {
    let alive = true;

    const read = (path, list, set) => {
      getStrapi(path)
        .then((data) => {
          if (!alive) return;
          const value = list ? asList(data) : data ?? null;
          set({ path, data: value, error: null, status: settledStatus(value, list) });
        })
        .catch((error) => {
          // Kept as a state rather than a thrown error: every consumer renders
          // its own fallback from "error", and the error object travels with it
          // for anyone who wants to log it.
          if (alive) set({ path, data: null, error, status: STRAPI_STATUS.ERROR });
        });
    };

    read(GLOBAL_PATH, false, setGlobal);
    read(TOURS_PATH, true, setTours);
    read(DESTINATIONS_PATH, true, setDestinations);

    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(() => ({ global, tours, destinations }), [global, tours, destinations]);

  return <StrapiContext.Provider value={value}>{children}</StrapiContext.Provider>;
}

/**
 * What a reader gets with no provider above it. Nothing is in flight and
 * nothing has loaded, so the resource reads as empty — every caller falls back
 * to its hardcoded copy, which is the safe direction to be wrong in.
 */
const NO_PROVIDER = { path: null, data: null, error: null, status: STRAPI_STATUS.EMPTY };

/** The global entry as { data, status } — the header and the footer's data. */
export function useGlobalState() {
  return useContext(StrapiContext)?.global ?? NO_PROVIDER;
}

/** Raw Strapi tour entries as { data, status }. */
export function useStrapiToursState() {
  return useContext(StrapiContext)?.tours ?? NO_PROVIDER;
}

/** Raw Strapi destination entries as { data, status }. */
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
 * Returns { items, error, loading, status } — and `data`, the same array under
 * the name the other hooks use, so a caller can destructure either. `items` is
 * kept for every existing caller; `loading` is kept for the one that reads it.
 *
 *   status  "loading" | "ready" | "error" | "empty"
 *
 * A path whose response is already in the 60s cache starts at "ready", so a
 * second reader of the same path never shows a skeleton. A path that changed
 * re-reads the cache during render (initialState is a pure cache read), which
 * is why navigating from one tour's gallery to another's does not flash.
 */
export function useStrapiList(path) {
  const [state, setState] = useState(() => initialState(path, true));

  useEffect(() => {
    let alive = true;

    getStrapi(path)
      .then((data) => {
        if (alive) setState({ path, data: asList(data), error: null, status: settledStatus(data, true) });
      })
      .catch((error) => {
        if (alive) setState({ path, data: null, error, status: STRAPI_STATUS.ERROR });
      });

    return () => {
      alive = false;
    };
  }, [path]);

  // State belonging to the previous path is ignored rather than cleared inside
  // the effect, which would cost a second render pass on every path change.
  const current = state.path === path ? state : initialState(path, true);

  return {
    items: current.data,
    /** The same array, named as the other hooks name it. */
    data: current.data,
    error: current.error,
    status: current.status,
    // still waiting on the first answer for this path
    loading: current.status === STRAPI_STATUS.LOADING,
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