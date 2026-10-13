import { useMemo } from "react";
import { HIKES_SECTION, HIKES } from "../data/content.js";
import { SectionHead, HeadCopy } from "./ui.jsx";
import { useReveal, stagger } from "../motion.js";
import { useStrapiToursState, STRAPI_STATUS } from "../lib/strapiData.jsx";
import { featuredTours } from "../lib/catalog.js";
import { HikesSectionSkeleton } from "./skeletons.jsx";

/**
 * One tour card.
 *
 * A CMS entry is an editor's row, not a curated one, so any of href, image and
 * title can be missing:
 *   no image -> the mist card the markup already sits on, rather than a broken
 *               <img> with no src;
 *   no href  -> rendered as a <div>, which is not focusable and is not announced
 *               as a link, so there is nothing to activate;
 *   no title -> an empty heading rather than "undefined".
 * alt falls back to the title, then to nothing, so the image is never left
 * unlabelled.
 */
function HikeCard({ hike, className = "", big = false, index = null }) {
  const rv = useReveal({ delay: index == null ? 0 : stagger(index) });

  const Tag = hike.href ? "a" : "div";
  const title = hike.title || "";

  return (
    <Tag
      {...rv}
      {...(hike.href ? { href: hike.href } : {})}
      className={`rv relative block overflow-hidden rounded-lg bg-mist p-1 ${className}`}
    >
      <div className="relative h-full w-full overflow-hidden">
        {hike.image ? (
          <img src={hike.image} alt={hike.alt || title} className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="grad-card absolute inset-0" />
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          <div className="flex flex-wrap gap-2">
            {(hike.chips || []).map((c) => (
              <span key={c} className="chip">
                {c}
              </span>
            ))}
          </div>
          <div>
            <h3 className={`${big ? "t-h3l" : "t-h3s"} text-mist`}>{title}</h3>
            <span className="btn btn-dark btn-roll mt-4 w-[113px]">
              <span className="roll">
                <span>Learn More</span>
                <span aria-hidden="true">Learn More</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </Tag>
  );
}

/**
 * The measured 3 x 2 mosaic, used whenever four cards are there to fill it.
 * Desktop is the only breakpoint this one is special at; narrower screens get
 * equal-height cards wrapping to 2 then 1 columns, exactly as before.
 */
const MOSAIC_GRID =
  "mt-12 grid auto-rows-[320px] grid-cols-1 gap-4 min-[639.98px]:grid-cols-2 min-[1100px]:h-[600px] min-[1100px]:auto-rows-auto min-[1100px]:grid-cols-3 min-[1100px]:grid-rows-2";

/**
 * The same grid for a short list.
 *
 * The mosaic cannot hold fewer than four: its desktop height is a fixed 600px
 * over two explicit rows, so three cards would leave the second row sitting
 * empty inside that height. Dropping the fixed height and the second row, and
 * capping the desktop columns at the number of cards, lets 1, 2 or 3 cards reflow
 * into one row of equal 320px cards with nothing left over.
 */
function reflowGrid(count) {
  return `mt-12 grid auto-rows-[320px] grid-cols-1 gap-4 min-[639.98px]:grid-cols-2 min-[1100px]:grid-cols-${Math.min(count, 3)}`;
}

/** The mosaic's two spanning cards, one per position. */
const MOSAIC_CARDS = ["min-[1100px]:row-span-2", "", "", "min-[1100px]:col-span-2"];

export default function Hikes() {
  const { data: strapiTours, status } = useStrapiToursState();
  /* The tours Strapi marks featured, already sorted on `order` and capped at
     four by featuredTours(). A CMS list of one, two, three or a dozen therefore
     arrives here the right length: nothing is dropped, nothing is invented. With
     no CMS entries at all the original four from content.js stand in. */
  const picks = useMemo(() => featuredTours(strapiTours, 4), [strapiTours]);
  const tours = picks.length ? picks : HIKES;
  const mosaic = tours.length >= 4;

  return (
    <section id="hikes" className="section-py">
      <div className="container-x">
        <SectionHead badge={HIKES_SECTION.badge} title={HIKES_SECTION.title}>
          <HeadCopy>{HIKES_SECTION.body}</HeadCopy>
          <a href={HIKES_SECTION.ctaHref} className="btn btn-dark btn-roll w-[150px]">
            <span className="roll">
              <span>{HIKES_SECTION.cta}</span>
              <span aria-hidden="true">{HIKES_SECTION.cta}</span>
            </span>
          </a>
          <a href="/experiences" className="t-link text-ink underline underline-offset-4">
            Browse by experience
          </a>
        </SectionHead>

        {/* desktop keeps the measured 3 x 2 mosaic (600px tall) when there are
            four cards for it; a shorter list reflows into equal cards instead of
            holding a row open. The skeleton is that same 3 x 2 mosaic — a loading
            mosaic would give away the hardcoded four, and swapping it for the CMS
            four would then move every card on the page. */}
        {status === STRAPI_STATUS.LOADING ? (
          <HikesSectionSkeleton />
        ) : (
          <div className={mosaic ? MOSAIC_GRID : reflowGrid(tours.length)}>
            {tours.map((hike, i) => (
              <HikeCard
                key={hike.href || i}
                hike={hike}
                big={i === 0}
                index={i}
                className={mosaic ? MOSAIC_CARDS[i] ?? "" : ""}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
