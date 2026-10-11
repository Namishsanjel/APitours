import { createContext, useContext, useEffect, useState } from "react";
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

const GlobalContext = createContext(null);

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

  return <GlobalContext.Provider value={global}>{children}</GlobalContext.Provider>;
}

/** The global entry, or null while loading / if Strapi is unreachable. */
export function useGlobal() {
  return useContext(GlobalContext);
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