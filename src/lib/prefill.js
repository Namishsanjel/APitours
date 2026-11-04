/**
 * Prefilling for the two free-text "which tour / which destination" fields.
 *
 * One place decides what those fields start as, so the contact form and the
 * plan-your-trip form agree on the order and on the limits:
 *
 *   1. the query string  — /contact?tour=…  and  /plan-your-trip?destination=…
 *   2. what was last looked at, in sessionStorage
 *   3. empty
 *
 * The value is only ever set as the field's initial value. Once the visitor has
 * typed in a field nothing overwrites it — `touched` latches on the first edit.
 *
 * Everything a page stores goes through sessionStorage, which throws in
 * private-mode Safari and whenever storage is disabled by policy, so every call
 * is inside try/catch and a failure is simply "no prefill".
 */

import { useState } from "react";

/** Every field this module fills is capped here, and in the inputs themselves. */
export const MAX = 120;

/** The note under a field that was filled in for the visitor. */
export const HINT = "Filled in from the page you were viewing. Change it if you like.";

export const TOUR_PLACEHOLDER = "e.g. Annapurna Base Camp";
export const DESTINATION_PLACEHOLDER = "e.g. Nepal";

const TOUR_KEY = "apitouch:lastTour";
const DESTINATION_KEY = "apitouch:lastDestination";

/** Trim, cap, and never hand back anything that is not a plain string. */
function clean(value) {
  return String(value ?? "")
    .trim()
    .slice(0, MAX);
}

/**
 * One query parameter as a field value. URLSearchParams does the decoding, so a
 * title with a space, an ampersand or a quote arrives whole; an unparseable
 * search string yields "" rather than an exception.
 */
export function queryValue(search, key) {
  try {
    return clean(new URLSearchParams(search || "").get(key));
  } catch {
    return "";
  }
}

/** sessionStorage, or null when there is no window or storage is blocked. */
function store() {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** The tour being looked at, and the destination it belongs to. */
export function rememberTour(title, destination) {
  const s = store();
  if (!s) return;
  try {
    s.setItem(TOUR_KEY, JSON.stringify({ title: clean(title), destination: clean(destination) }));
  } catch {
    /* storage full or blocked — the field just starts empty */
  }
}

/** The destination most recently looked at, by name. */
export function rememberDestination(name) {
  const s = store();
  if (!s) return;
  try {
    s.setItem(DESTINATION_KEY, clean(name));
  } catch {
    /* as above */
  }
}

/** The last tour viewed, or empty strings when there is nothing stored. */
export function lastTour() {
  const s = store();
  if (!s) return { title: "", destination: "" };
  try {
    const raw = s.getItem(TOUR_KEY);
    if (!raw) return { title: "", destination: "" };
    const parsed = JSON.parse(raw);
    return { title: clean(parsed?.title), destination: clean(parsed?.destination) };
  } catch {
    return { title: "", destination: "" };
  }
}

/** The last destination viewed, or "" when there is nothing stored. */
export function lastDestination() {
  const s = store();
  if (!s) return "";
  try {
    return clean(s.getItem(DESTINATION_KEY));
  } catch {
    return "";
  }
}

/** Drop whatever was stored — used by nothing today, kept for the reset path. */
export function forgetLast() {
  const s = store();
  if (!s) return;
  try {
    s.removeItem(TOUR_KEY);
    s.removeItem(DESTINATION_KEY);
  } catch {
    /* as above */
  }
}

/**
 * One prefilled text field.
 *
 * `search` is the current query string and `key` the parameter to read; both
 * come from the router, so a prefill works on a direct link, on a refresh and
 * on a client-side navigation — including a second visit to the same route with
 * a different query, which is why this re-reads `search` rather than only using
 * it as an initialiser.
 *
 * The returned value is bound to a plain <input value>, so React escapes it.
 * Nothing here writes markup.
 */
export function usePrefilledValue({ search, key, fallback }) {
  // storage is read once, in the initialiser: it does not change under a
  // mounted form, and this keeps the read out of render body
  const [stored] = useState(() => clean(fallback?.() ?? ""));
  const fromQuery = queryValue(search, key);

  // null means "the visitor has not typed". Once it holds a string it always
  // wins, so no later query or storage read can overwrite what was typed.
  const [typed, setTyped] = useState(null);

  // derived rather than stored, so a query arriving while the form is already
  // mounted (/contact -> /contact?tour=X) still lands
  const value = typed ?? (fromQuery || stored);

  return {
    value,
    onChange: (event) => setTyped(event.target.value),
    /** True while the field holds a prefill the visitor has not touched. */
    prefilled: typed === null && Boolean(value),
    hint: HINT,
    /** Cleared after a successful send, with the hint staying gone. */
    reset() {
      setTyped("");
    },
  };
}