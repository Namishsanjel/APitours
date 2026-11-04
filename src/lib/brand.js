/**
 * The single source of truth for the site's logo.
 *
 * Every logo in the app (header, mobile drawer, footer, structured data,
 * favicon/OG fallbacks) points at this one path, so swapping the brand mark in
 * future is a matter of replacing `public/logo.png` — no component changes.
 *
 * Served from `public/`, so the path is absolute and works from any route.
 */
export const LOGO_PATH = "/logo.png";

/**
 * The on-screen artwork, cropped to the mark so transparent padding no longer
 * makes it look small. `public/logo.png` (1000x998) keeps the original full
 * canvas for favicons/OG/preview use; `logo-mark.png` (894x453) is what the
 * header, drawer and footer draw.
 */
export const LOGO_MARK_PATH = "/logo-mark.png";

/** Intrinsic size of `public/logo-mark.png`. Kept here so callers can reserve
 *  the right box and avoid layout shift. */
export const LOGO_WIDTH = 894;
export const LOGO_HEIGHT = 453;

/**
 * On-screen logo sizes, in ONE place so they are easy to tweak. Values are
 * Tailwind height classes (literal strings so Tailwind can compile them);
 * swapping a number here updates every matching location. The width follows
 * automatically from the artwork's aspect ratio via <Logo>'s width attribute.
 *
 *   navbarDesktop / navbarMobile -> header logo
 *   footer / footerMobile        -> footer brand mark
 *   footerMarkDesktop/Mobile     -> oversized faded mark at the foot
 */
export const LOGO_CLASSES = {
  navbar: "h-[64px] max-[1023.98px]:h-[46px]",
  footer: "h-[72px] max-[639.98px]:h-[56px]",
  footerMark: "h-[100px] min-[639.98px]:h-[150px]",
};
/** Numeric heights (px) matching LOGO_CLASSES, fed to <Logo height> so the
 *  intra-location intrinsic box is reserved correctly. */
export const LOGO_SIZES = {
  navbarDesktop: 64,
  navbarMobile: 46,
  footer: 72,
  footerMobile: 56,
  footerMarkDesktop: 150,
  footerMarkMobile: 100,
};
/** Displayed width for a given height, from the artwork's aspect ratio. */
export function logoWidth(height) {
  return Math.round(height * (LOGO_WIDTH / LOGO_HEIGHT));
}

/** The site's own name, used as the logo's alt text and as the text fallback. */
export const SITE_NAME = "API Touch";

/**
 * Normalises whatever the CMS hands the header/footer into a usable `{ src }`
 * object, falling back to the bundled logo when the CMS has nothing.
 *
 * The fallback is the whole point: without a CMS entry (empty, errored, or an
 * unpopulated media field) the logo is still the site's mark rather than the
 * bare text name.
 */
export function resolveLogo(media, fallbackAlt = SITE_NAME) {
  if (media && typeof media === "object" && media.src) return media;
  return { src: LOGO_MARK_PATH, alt: fallbackAlt, width: LOGO_WIDTH, height: LOGO_HEIGHT };
}
