/**
 * The two states a Strapi-backed section can be in that are neither "loading"
 * nor "content", shared by every section that reads from the CMS.
 *
 * Before these existed, both states fell through to the hardcoded copy: a
 * request that failed, timed out or returned nothing rendered the original
 * static text as though it were live content. That is a claim the CMS never
 * made, and on a detail page it produced a worse lie still — a failed lookup
 * rendered "this tour could not be found", which is a statement about the
 * catalogue when the truth is that the catalogue could not be reached.
 *
 * Both components are deliberately small and take their geometry from the
 * caller through `className`, so each one sits in the same box the content would
 * have filled and the page does not jump when the state changes.
 */

/**
 * The error state: a short message and a "Try again" button.
 *
 * `onRetry` is the reader's own retry (see useStrapiList / useGlobalState and
 * friends). It clears that path's cached entry and refetches it, so the section
 * returns to its own skeleton while the request runs and renders the content if
 * it lands. It is a no-op while a request for the same path is in flight, which
 * is also why the button cannot be spammed: the act of pressing it puts the
 * section straight back into its loading state, and the skeleton has no button.
 *
 * `role="alert"` so the message is announced when it appears, rather than only
 * being read by whoever happens to be looking at that part of the page.
 */
export function SectionError({ onRetry, className = "", tone = "mist" }) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-4 rounded-lg px-6 py-10 text-center ${tone === "mist" ? "bg-mist" : "bg-cream"} ${className}`}
    >
      <p className="t-body w-full max-w-[380px] text-ink [text-wrap:balance]">
        We couldn&rsquo;t load this section. Please try again.
      </p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="btn btn-dark w-[140px]">
          Try again
        </button>
      ) : null}
    </div>
  );
}

/**
 * The empty state: the request succeeded and there is nothing published.
 *
 * Not an error, so it gets no button and no alert role — there is nothing to
 * retry, and a page that is simply empty is not an event worth announcing. One
 * neutral line, in the same box the content would have taken.
 */
export function SectionEmpty({ className = "", tone = "mist" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg px-6 py-10 text-center ${tone === "mist" ? "bg-mist" : "bg-cream"} ${className}`}
    >
      <p className="t-body w-full max-w-[380px] text-smoke [text-wrap:balance]">Nothing to show yet.</p>
    </div>
  );
}

/**
 * The compact variant of the error state, for places that cannot host a full
 * block without breaking their layout: a navbar mega-menu panel and the mobile
 * drawer both render their message beside navigation that must keep working, so
 * there is no room for a large card and the caller still needs the retry.
 */
export function SectionErrorInline({ onRetry, className = "" }) {
  return (
    <div role="alert" className={`flex flex-col items-start gap-3 px-3 py-4 ${className}`}>
      <p className="t-body max-w-[360px] text-ink">We couldn&rsquo;t load this section. Please try again.</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="btn btn-dark w-[140px]">
          Try again
        </button>
      ) : null}
    </div>
  );
}

/**
 * The compact empty state, matching SectionErrorInline.
 */
export function SectionEmptyInline({ className = "" }) {
  return (
    <div className={`flex flex-col items-start px-3 py-4 ${className}`}>
      <p className="t-body text-smoke">Nothing to show yet.</p>
    </div>
  );
}