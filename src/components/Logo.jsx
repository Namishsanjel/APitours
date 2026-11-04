import { LOGO_MARK_PATH, SITE_NAME, LOGO_WIDTH, LOGO_HEIGHT } from "../lib/brand.js";

/**
 * The site's logo, rendered as a single <img>.
 *
 * Size is driven entirely by CSS height (a Tailwind height utility in
 * `className`, with a narrow-screen override). The `height` prop only sets the
 * intrinsic `height` attribute — together with the derived width attribute — so
 * the browser reserves the right box before the bitmap arrives and nothing
 * shifts. `object-contain` preserves the artwork's aspect ratio while `w-auto`
 * lets the width follow it.
 *
 * `alt` defaults to the site name; pass `alt=""` for the decorative oversized
 * footer mark that repeats the footer's own brand name.
 */
export default function Logo({
  src = LOGO_MARK_PATH,
  alt = SITE_NAME,
  height = LOGO_HEIGHT,
  className = "",
  ...rest
}) {
  const width = Math.round(height * (LOGO_WIDTH / LOGO_HEIGHT));
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`w-auto object-contain ${className}`}
      {...rest}
    />
  );
}
