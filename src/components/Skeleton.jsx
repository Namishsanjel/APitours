import { useEffect, useState } from "react";

/**
 * The one placeholder primitive, and the wrappers every section skeleton is
 * built from.
 *
 * A skeleton here is never decoration added to the page — it *replaces* the
 * hardcoded copy while a request is in flight, so it has to occupy the same box
 * the real content will. Every composition in skeletons.jsx therefore reuses
 * the container classes of the component it stands in for (same grid, same
 * breakpoints, same fixed heights, same aspect ratios), and only swaps the
 * contents for blocks.
 *
 * Nothing here animates by default beyond the shimmer, and the shimmer is off
 * entirely under prefers-reduced-motion (see `.skeleton` in index.css).
 */

/**
 * How long a request may run before its skeleton appears.
 *
 * Most requests to a local Strapi answer in a few dozen milliseconds, and a
 * skeleton shown for 60ms is worse than none: it is a visible flash of a page
 * that was already about to be right. The block is rendered but transparent
 * for this long, so the space is reserved (no layout shift either way) and a
 * fast response swaps straight into the content with nothing on screen in
 * between.
 */
export const SKELETON_DELAY_MS = 150;

/** Radii as one token each, so a caller can never emit two at once. */
const RADIUS = {
  none: "",
  sm: "rounded",
  md: "rounded-lg",
  full: "rounded-full",
};

/** The two site neutrals a placeholder may be filled with. */
const TONE = {
  mist: "bg-mist",
  cream: "bg-cream",
};

/** Gaps as one token each, for the same reason as the radii. */
const GAP = {
  none: "gap-0",
  sm: "gap-1",
  md: "gap-2",
};

/**
 * One placeholder block.
 *
 * Purely decorative: it carries aria-hidden, so the only thing announced while
 * a section loads is the region's `role="status"` text. `className` is for
 * sizing and placement only — the fill and the radius come from `tone` and
 * `radius`, which is what keeps the two from ever colliding in the class list.
 */
export function Skeleton({ className = "", tone = "mist", radius = "md", style }) {
  return (
    <span
      aria-hidden="true"
      className={`skeleton block ${TONE[tone] ?? TONE.mist} ${RADIUS[radius] ?? RADIUS.md} ${className}`}
      style={style}
    />
  );
}

/**
 * A stack of text-width lines, the shape a paragraph or a title occupies.
 * `last` shortens the final line the way real copy does, so the block ends
 * ragged rather than as a hard rectangle. `gap="none"` is for a run of
 * paragraphs, which sit on their own line box with no space between them.
 */
export function SkeletonLines({
  count = 3,
  className = "",
  lineClassName = "",
  tone = "mist",
  height = "h-[22px]",
  gap = "md",
}) {
  return (
    <div aria-hidden="true" className={`flex flex-col ${GAP[gap] ?? GAP.md} ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton
          key={i}
          tone={tone}
          className={`${height} ${i === count - 1 ? "w-3/5" : "w-full"} ${lineClassName}`}
        />
      ))}
    </div>
  );
}

/**
 * The loading region itself: marks what is loading for assistive technology
 * and holds the skeleton out of sight for SKELETON_DELAY_MS.
 *
 *   aria-busy="true" on the region  — the content inside is being replaced
 *   <span role="status">            — announced once, politely
 *   aria-hidden on the blocks      — the placeholders are decoration, so they
 *                                    are not read out as a page of nothing
 *
 * The delay is opacity, not a conditional: the region is laid out from the
 * first render either way, so holding it invisible never collapses the section
 * and then pushes it back down.
 */
export function SkeletonRegion({ label = "Loading…", delay = SKELETON_DELAY_MS, className = "", style, children }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      aria-busy="true"
      className={className}
      style={{ ...style, opacity: shown ? 1 : 0, transition: "opacity 200ms ease-out" }}
    >
      <span role="status" className="sr-only">
        {label}
      </span>
      {/* `contents` so the wrapper adds no box of its own — the region's own
          classes are the grid the real content uses, and the blocks drop
          straight into it. */}
      <div aria-hidden="true" className="contents">
        {children}
      </div>
    </div>
  );
}