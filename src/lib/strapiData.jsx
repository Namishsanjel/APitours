import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getStrapi, asList, bestImage } from "./strapi.js";

/**
 * React bindings for the Strapi client.
 *
 * Two rules shape everything here:
 *  - `items` stays null until a request succeeds. Callers therefore render the
 *    hardcoded copy while loading and after a failure, and swap to CMS content
 *    only once there is real content to show. An empty array counts as "nothing
 *    to show", so the same fallback covers an empty collection.
 *  - Requests go through the shared cache in strapi.js, so the FAQ block that
 *    appears on every page costs one request per 60 seconds, not one per mount.
 */

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

const StrapiContext = createContext(null);

/**
 * Fetches the global entry once for the whole app — the header, the footer and
 * anything else that needs the site's own name or logos read it from here
 * rather than each issuing its own request.
 *
 * Both media fields are populated explicitly: `logo` is the one that sits over
 * a photo, `logoDark` the one on the cream panel.
 */
export function StrapiProvider({ children }) {
  const [global, setGlobal] = useState(null);
  const [tours, setTours] = useState(null);
  const [destinations, setDestinations] = useState(null);

  useEffect(() => {
    let alive = true;
    // A failure here is not worth reporting: every consumer already falls back
    // to the hardcoded name and logo.
    getStrapi("global?populate[logo]=true&populate[logoDark]=true")
      .then((data) => {
        if (alive) setGlobal(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Tours and destinations load once and are shared, so a page that needs both
  // (the tours listing filtering by destination, the nav menus) does not issue
  // its own pair of requests per mount. Null means "nothing to show" and is
  // what every caller falls back from.
  useEffect(() => {
    let alive = true;
    getStrapi(TOURS_PATH)
      .then((data) => {
        if (alive) setTours(asList(data));
      })
      .catch(() => {});
    getStrapi(DESTINATIONS_PATH)
      .then((data) => {
        if (alive) setDestinations(asList(data));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(() => ({ global, tours, destinations }), [global, tours, destinations]);

  return <StrapiContext.Provider value={value}>{children}</StrapiContext.Provider>;
}

/** The global entry, or null while loading / if Strapi is unreachable. */
export function useGlobal() {
  return useContext(StrapiContext)?.global ?? null;
}

/** Raw Strapi tour entries, or null until there are any. */
export function useStrapiTours() {
  return useContext(StrapiContext)?.tours ?? null;
}

/** Raw Strapi destination entries, or null until there are any. */
export function useStrapiDestinations() {
  return useContext(StrapiContext)?.destinations ?? null;
}

/**
 * Reads any collection (or a filtered one) from Strapi.
 * Returns { items, loading, error } where items is null until real content
 * arrives — see the note at the top of this file.
 */
export function useStrapiList(path) {
  // The path each result belongs to, so a request still in flight for the
  // previous path is ignored rather than rendered. Clearing state inside the
  // effect instead would mean a second render pass on every path change.
  const [state, setState] = useState({ path: null, items: null, error: null });

  useEffect(() => {
    let alive = true;

    getStrapi(path)
      .then((data) => {
        if (alive) setState({ path, items: asList(data), error: null });
      })
      .catch((error) => {
        if (alive) setState({ path, items: null, error });
      });

    return () => {
      alive = false;
    };
  }, [path]);

  const current = state.path === path ? state : { path, items: null, error: null };

  return {
    items: current.items,
    error: current.error,
    // still waiting on the very first answer for this path
    loading: current.items === null && !current.error,
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