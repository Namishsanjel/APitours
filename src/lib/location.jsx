/**
 * The current query string, for the fields that prefill themselves from it.
 *
 * The router in App.jsx owns this value rather than reading
 * window.location here, because a client-side navigation pushes history without
 * firing popstate — only the router knows the query changed. App passes it down;
 * nothing else reads window.location.search.
 *
 * It is a string, so the two forms re-read it whenever the query differs,
 * including when the path is unchanged (/contact -> /contact?tour=…), where the
 * router deliberately does not change the route.
 */

import { createContext, useContext } from "react";

const SearchContext = createContext("");

export function LocationProvider({ search, children }) {
  return <SearchContext.Provider value={search ?? ""}>{children}</SearchContext.Provider>;
}

export function useLocationSearch() {
  return useContext(SearchContext) ?? "";
}