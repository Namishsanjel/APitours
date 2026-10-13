import { Skeleton, SkeletonLines, SkeletonRegion } from "./Skeleton.jsx";
import { GALLERY } from "../data/pages.js";
import { DESTINATIONS_PAGE, DESTINATIONS_ALL } from "../data/newPages.js";
import { HIKES_ALL } from "../data/hikes.js";

/**
 * The per-section skeletons, each standing in for one real layout while its
 * Strapi request is in flight.
 *
 * The rule throughout: the region's className is the *real* container — the
 * same grid, the same breakpoints, the same fixed heights — and only the
 * contents are replaced by blocks. A skeleton therefore reserves exactly the
 * box the content is about to take, so nothing on the page moves when the
 * response lands.
 *
 * Block fills alternate by what sits under them: mist on the cream page,
 * cream inside a mist card. Both are the site's own neutrals.
 *
 * No hardcoded copy appears anywhere in this file. Where a count or a shape is
 * needed to size a skeleton (how many tour cards, what aspect ratio a gallery
 * column runs to) the *numbers* come from the data module — nothing renders.
 */

/* ------------------------------------------------------------------ *
 * shared pieces
 * ------------------------------------------------------------------ */

/** ServiceCardSkeleton — picture, title, two text lines, in the card's own box. */
export function ServiceCardSkeleton({ className = "" }) {
  return (
    <div className={`flex flex-col gap-4 rounded-lg bg-mist p-6 ${className}`}>
      <Skeleton tone="cream" className="h-[140px] w-full" />
      <div className="flex flex-col gap-2">
        <Skeleton tone="cream" className="h-[26px] w-[58%]" />
        <Skeleton tone="cream" className="h-[22px] w-full" />
        <Skeleton tone="cream" className="h-[22px] w-4/5" />
      </div>
    </div>
  );
}

/**
 * HikeCardSkeleton — the tour card, at the listing page's size and the home
 * section's. Same fixed-height photo card, same p-1 frame, same overlay with
 * the chips along the top and the title + learn-more button along the bottom,
 * so the mosaic maths (row spans, the 600px two-row block) still works.
 */
export function HikeCardSkeleton({ big = false, className = "" }) {
  return (
    <div className={`relative block overflow-hidden rounded-lg bg-mist p-1 ${className}`}>
      <div className="relative h-full w-full overflow-hidden rounded">
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          <div className="flex flex-wrap gap-2">
            <Skeleton tone="cream" radius="md" className="h-[35px] w-[76px]" />
            <Skeleton tone="cream" radius="md" className="h-[35px] w-[64px]" />
          </div>
          <div>
            <Skeleton tone="cream" className={big ? "h-[26px] w-[68%] min-[1100px]:h-[40px]" : "h-[26px] w-[74%]" } />
            <Skeleton tone="cream" radius="md" className="mt-4 h-[44px] w-[113px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** DestinationCardSkeleton — the 380px photo card with its chip and CTA. */
export function DestinationCardSkeleton() {
  return (
    <div className="relative block h-[380px] rounded-lg bg-mist p-1">
      <div className="relative h-full w-full overflow-hidden rounded">
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-4">
          <div className="flex flex-wrap gap-2">
            <Skeleton tone="cream" radius="md" className="h-[35px] w-[128px]" />
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton tone="cream" className="h-[40px] w-[62%]" />
            <Skeleton tone="cream" radius="md" className="h-[44px] w-[104px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** TourCardSkeleton — the destination page's "tour packages" card. */
export function TourCardSkeleton() {
  return <HikeCardSkeleton />;
}

/** FactListSkeleton — one of the destination page's three dotted lists. */
export function FactListSkeleton({ rows = 4, className = "" }) {
  return (
    <div className={`flex flex-1 flex-col gap-4 ${className}`}>
      <Skeleton className="h-[26px] w-[132px]" />
      <ul className="flex flex-col gap-2">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex items-start gap-2">
            <Skeleton radius="full" className="mt-[9px] h-[5px] w-[5px] shrink-0" />
            <Skeleton className="h-[22px] w-[86%]" radius="sm" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * services
 * ------------------------------------------------------------------ */

/**
 * ServicesPage — the two fallback grids (three core cards, then three more) at
 * the same 1 / 2 / 3 column grid, in the section's own 8 / 12 gap.
 */
export function ServicesGridSkeleton() {
  const grid = "grid grid-cols-1 gap-6 min-[639.98px]:grid-cols-2 min-[1100px]:grid-cols-3";

  return (
    <SkeletonRegion label="Loading services…" className="flex flex-col gap-8 min-[639.98px]:gap-12">
      <div className={grid}>
        {[0, 1, 2].map((i) => (
          <ServiceCardSkeleton key={`core-${i}`} />
        ))}
      </div>
      <div className={grid}>
        {[0, 1, 2].map((i) => (
          <ServiceCardSkeleton key={`extra-${i}`} />
        ))}
      </div>
    </SkeletonRegion>
  );
}

/* ------------------------------------------------------------------ *
 * tours
 * ------------------------------------------------------------------ */

/** The tours listing's mosaic geometry: 2 columns then 4, 420px rows then 288px. */
const CARD_LARGE =
  "col-span-2 row-span-2 h-[600px] max-[1099.98px]:col-span-1 max-[1099.98px]:row-span-1 max-[1099.98px]:h-[420px]";
const CARD_SMALL = "h-[420px] min-[1100px]:h-[288px]";

/**
 * HikesPage — the filter row and the card grid, in the block's own gap-6. The
 * filter button and the "N of M tours" count are skeletonised too: both are
 * derived from the collection, so on a loading page they are as much a
 * placeholder as the cards are.
 */
export function HikesPageSkeleton() {
  const count = HIKES_ALL.length;

  return (
    <SkeletonRegion label="Loading tours…" className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton radius="md" className="h-[45px] w-[178px]" />
        <Skeleton radius="sm" className="h-[17px] w-[140px]" />
      </div>

      <div className="grid auto-rows-[420px] grid-cols-1 gap-6 min-[639.98px]:grid-cols-2 min-[1100px]:grid-cols-4 min-[1100px]:auto-rows-[288px]">
        {Array.from({ length: count }, (_, i) => (
          <HikeCardSkeleton key={i} className={i % 5 === 0 ? CARD_LARGE : CARD_SMALL} />
        ))}
      </div>
    </SkeletonRegion>
  );
}

/**
 * Hikes — the homepage section's 3 x 2 mosaic: one card spanning both rows, two
 * stacked beside it, one spanning two columns underneath.
 */
export function HikesSectionSkeleton() {
  return (
    <SkeletonRegion
      label="Loading tours…"
      className="mt-12 grid auto-rows-[320px] grid-cols-1 gap-4 min-[639.98px]:grid-cols-2 min-[1100px]:h-[600px] min-[1100px]:auto-rows-auto min-[1100px]:grid-cols-3 min-[1100px]:grid-rows-2"
    >
      <HikeCardSkeleton big className="min-[1100px]:row-span-2" />
      <HikeCardSkeleton />
      <HikeCardSkeleton />
      <HikeCardSkeleton className="min-[1100px]:col-span-2" />
    </SkeletonRegion>
  );
}

/**
 * TourDetailPage — the headline and hero photo, then the itinerary column with
 * the booking sidebar beside it, then the "more tours" row. Three regions, so a
 * slow response fills the page from the top down the way it arrives.
 */
export function TourDetailSkeleton({ others = 2 }) {
  return (
    <>
      <section className="container-x flex flex-col gap-8 pt-[120px] max-[1099.98px]:pt-[100px] max-[639.98px]:pt-[88px]">
        {/* the section's own flex gap does the spacing between the header and
            the hero, exactly as it does for the loaded page */}
        <SkeletonRegion label="Loading tour…" className="flex flex-col gap-8">
          <div className="flex flex-col items-start gap-4 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between min-[900px]:gap-8">
            <div className="flex w-full min-w-0 flex-col gap-2" style={{ maxWidth: 560 }}>
              <Skeleton className="h-[40px] w-[480px] max-w-full min-[639.98px]:h-[70px]" />
              <Skeleton className="h-[22px] w-[420px] max-w-full" />
            </div>
          </div>
          <div className="relative h-[240px] overflow-hidden rounded-lg bg-mist p-1 min-[639.98px]:h-[300px] min-[1100px]:h-[360px]">
            <div className="relative h-full w-full overflow-hidden rounded">
              <div className="absolute inset-0 z-10 flex flex-wrap gap-2 p-4">
                <Skeleton tone="cream" radius="md" className="h-[35px] w-[86px]" />
                <Skeleton tone="cream" radius="md" className="h-[35px] w-[74px]" />
                <Skeleton tone="cream" radius="md" className="h-[35px] w-[110px]" />
                <Skeleton tone="cream" radius="md" className="h-[35px] w-[70px]" />
              </div>
            </div>
          </div>
        </SkeletonRegion>
      </section>

      <section className="container-x flex flex-col gap-8 pb-[60px] pt-10 min-[1100px]:flex-row min-[1100px]:justify-between min-[1100px]:pt-12">
        {/* the loaded page caps this column at 800px and gives the sidebar the
            rest, so the two halves hold the same widths here */}
        <SkeletonRegion
          label="Loading tour…"
          className="flex w-full min-w-0 flex-col gap-10"
          style={{ maxWidth: 800 }}
        >
          <div className="flex flex-col gap-3">
            <Skeleton className="h-[26px] w-[104px]" />
            <SkeletonLines count={4} gap="none" />
          </div>

          <div className="flex flex-col gap-4">
            <Skeleton className="h-[26px] w-[164px]" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 min-[639.98px]:grid-cols-2 min-[1100px]:grid-cols-3">
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton radius="sm" className="h-[16px] w-[16px] shrink-0" />
                  <Skeleton radius="sm" className="h-[22px] w-[74%]" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Skeleton className="h-[26px] w-[86px]" />
            <div className="relative h-[240px] overflow-hidden rounded-lg min-[639.98px]:h-[300px] min-[1100px]:h-[380px]">
              <Skeleton className="h-full w-full" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Skeleton className="h-[26px] w-[124px]" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton radius="sm" className="h-[22px] w-[28px]" />
                  <Skeleton radius="sm" className="h-[22px] w-[82%]" />
                </div>
              ))}
            </div>
          </div>
        </SkeletonRegion>

        {/* the booking sidebar: photo, the two end points, the price, the CTA */}
        <SkeletonRegion
          label="Loading booking details…"
          className="flex w-full min-w-0 shrink-0 flex-col gap-5 self-start rounded-lg bg-mist p-6 min-[1100px]:sticky min-[1100px]:top-6 min-[1100px]:w-[470px]"
        >
          <Skeleton tone="cream" className="h-[170px] w-full overflow-hidden" />
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <Skeleton tone="cream" radius="sm" className="h-[19px] w-[120px]" />
              <Skeleton tone="cream" radius="sm" className="h-[17px] w-[92px]" />
            </div>
            <div className="h-px flex-1 border-t border-dashed border-smoke" />
            <div className="flex flex-col items-end gap-1">
              <Skeleton tone="cream" radius="sm" className="h-[19px] w-[104px]" />
              <Skeleton tone="cream" radius="sm" className="h-[17px] w-[84px]" />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton tone="cream" className="h-[48px] w-[180px]" />
            <Skeleton tone="cream" radius="md" className="h-[51px] w-full" />
          </div>
        </SkeletonRegion>
      </section>

      <section className="container-x flex flex-col gap-6 pb-[60px]">
        <SkeletonRegion label="Loading more tours…" className="flex flex-col gap-6">
          <Skeleton className="h-[40px] w-[340px]" />
          <div className="grid grid-cols-1 gap-6 min-[900px]:grid-cols-2">
            {Array.from({ length: others }, (_, i) => (
              <HikeCardSkeleton key={i} className="h-[380px] min-[900px]:h-[600px]" />
            ))}
          </div>
        </SkeletonRegion>
      </section>
    </>
  );
}

/** The tour detail page's photo strip, when the shared gallery is still in flight. */
export function GalleryStripSkeleton() {
  return (
    <SkeletonRegion label="Loading photos…" className="relative h-[240px] overflow-hidden rounded-lg min-[639.98px]:h-[300px] min-[1100px]:h-[380px]">
      <Skeleton className="h-full w-full" />
    </SkeletonRegion>
  );
}

/** The destination page's "tour packages" block, while the tours list is in flight. */
export function TourPackagesSkeleton({ count = 2 }) {
  return (
    <SkeletonRegion label="Loading tours…" className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between border-b border-smoke/30 pb-3">
        <Skeleton className="h-[26px] w-[148px]" />
        <Skeleton radius="sm" className="h-[19px] w-[82px]" />
      </div>
      <div className="grid grid-cols-1 gap-6 min-[639.98px]:grid-cols-2 min-[1100px]:grid-cols-2">
        {Array.from({ length: count }, (_, i) => (
          <TourCardSkeleton key={i} />
        ))}
      </div>
    </SkeletonRegion>
  );
}

/* ------------------------------------------------------------------ *
 * services detail
 * ------------------------------------------------------------------ */

/** ServiceDetailPage — header, banner, body column, actions. */
export function ServiceDetailSkeleton() {
  return (
    <section className="page-sec container-x flex flex-col gap-8 min-[639.98px]:gap-12">
      <SkeletonRegion label="Loading service…" className="flex flex-col gap-8 min-[639.98px]:gap-12">
        <div className="flex flex-col items-start gap-4 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between min-[900px]:gap-8">
          <div className="flex w-full min-w-0 flex-col gap-2" style={{ maxWidth: 560 }}>
            <Skeleton className="h-[17px] w-[72px]" />
            <Skeleton className="h-[40px] w-[380px] max-w-full min-[639.98px]:h-[70px]" />
          </div>
          <div
            className="flex w-full min-w-0 flex-col gap-2 min-[900px]:items-end"
            style={{ maxWidth: 706 }}
          >
            <Skeleton className="h-[22px] w-full" />
            <Skeleton className="h-[22px] w-[84%] min-[900px]:self-end" />
          </div>
        </div>

        <Skeleton className="h-[220px] w-full min-[639.98px]:h-[320px] min-[1100px]:h-[420px]" />

        <div className="flex w-full min-w-0 flex-col gap-6" style={{ maxWidth: 706 }}>
          <Skeleton className="h-[26px] w-[190px]" />
          <SkeletonLines count={3} />
          <Skeleton className="h-[26px] w-[150px]" />
          <SkeletonLines count={3} />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Skeleton radius="md" className="h-[44px] w-[170px]" />
          <Skeleton radius="sm" className="h-[19px] w-[120px]" />
        </div>
      </SkeletonRegion>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * destinations
 * ------------------------------------------------------------------ */

/**
 * How many cards each continent group holds, read off the hardcoded list so the
 * skeleton groups are the same height as the list that replaces them. Numbers
 * only — nothing from the module is rendered.
 */
const GROUP_COUNTS = DESTINATIONS_PAGE.groups.map((group) => ({
  group,
  count: DESTINATIONS_ALL.filter((d) => d.continent === group).length,
}));

/** DestinationsPage — every continent group: its rule + count, then its cards. */
export function DestinationsSkeleton() {
  return (
    <SkeletonRegion label="Loading destinations…" className="flex flex-col gap-8 min-[639.98px]:gap-12">
      {GROUP_COUNTS.map(({ group, count }) => (
        <div key={group} className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between border-b border-smoke/30 pb-3">
            <Skeleton className="h-[26px] w-[148px]" />
            <Skeleton radius="sm" className="h-[17px] w-[104px]" />
          </div>

          <div className="grid grid-cols-1 gap-6 min-[639.98px]:grid-cols-2 min-[1100px]:grid-cols-3">
            {Array.from({ length: count }, (_, i) => (
              <DestinationCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ))}
    </SkeletonRegion>
  );
}

/**
 * DestinationDetailPage — header and banner, the three dotted lists, the tour
 * packages and the closing call to action. The tour packages strip has its own
 * skeleton, driven by the tours collection rather than the destination's.
 */
export function DestinationDetailSkeleton() {
  return (
    <>
      <section className="container-x flex flex-col gap-6 pt-[120px] max-[1099.98px]:pt-[100px] max-[639.98px]:pt-[88px]">
        <SkeletonRegion label="Loading destination…" className="flex flex-col gap-6">
          <div className="flex flex-col items-start gap-4 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between min-[900px]:gap-8">
            <div className="flex w-full min-w-0 flex-col gap-2" style={{ maxWidth: 560 }}>
              <Skeleton className="h-[17px] w-[180px]" />
              <Skeleton className="h-[40px] w-[340px] max-w-full min-[639.98px]:h-[70px]" />
            </div>
            <div
              className="flex w-full min-w-0 flex-col gap-2 min-[900px]:items-end"
              style={{ maxWidth: 706 }}
            >
              <Skeleton className="h-[22px] w-full" />
              <Skeleton className="h-[22px] w-[94%] min-[900px]:self-end" />
              <Skeleton className="h-[22px] w-[70%] min-[900px]:self-end" />
            </div>
          </div>
          <Skeleton className="h-[240px] w-full min-[639.98px]:h-[320px] min-[1100px]:h-[420px]" />
        </SkeletonRegion>
      </section>

      <section className="container-x flex flex-col gap-8 pb-[60px] pt-10 min-[639.98px]:gap-12 min-[639.98px]:pt-12">
        {/* the section's own gap separates the fact lists from the call to
            action, with the tour-packages strip slotting in between */}
        <SkeletonRegion label="Loading destination…" className="flex flex-col gap-8 min-[639.98px]:gap-12">
          <div className="flex flex-col gap-8 min-[900px]:flex-row min-[900px]:gap-12">
            <FactListSkeleton />
            <FactListSkeleton />
            <FactListSkeleton />
          </div>

          <div className="flex flex-col items-start gap-4 rounded-lg bg-mist p-6 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between min-[900px]:gap-6">
            <div className="flex min-w-0 flex-col gap-1">
              <Skeleton tone="cream" className="h-[26px] w-[320px] max-w-full" />
              <Skeleton tone="cream" className="h-[22px] w-[420px] max-w-full" />
            </div>
            <Skeleton tone="cream" radius="md" className="h-[44px] w-[160px] shrink-0" />
          </div>
        </SkeletonRegion>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * about — the team grid
 * ------------------------------------------------------------------ */

/** AboutPage — the guides grid: photo block, role line, name, bio, link. */
export function TeamSkeleton({ count = 6 }) {
  return (
    <SkeletonRegion
      label="Loading our guides…"
      className="grid grid-cols-1 gap-6 min-[639.98px]:grid-cols-2 min-[1100px]:grid-cols-3"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col overflow-hidden rounded-lg bg-mist">
          <Skeleton tone="cream" className="h-[280px] w-full min-[1100px]:h-[320px]" />
          <div className="flex flex-1 flex-col gap-2 p-6">
            <Skeleton tone="cream" radius="sm" className="h-[17px] w-[96px]" />
            <Skeleton tone="cream" className="h-[26px] w-[62%]" />
            <Skeleton tone="cream" radius="sm" className="h-[22px] w-full" />
            <Skeleton tone="cream" radius="sm" className="h-[22px] w-4/5" />
            <Skeleton tone="cream" radius="sm" className="mt-2 h-[19px] w-[86px]" />
          </div>
        </div>
      ))}
    </SkeletonRegion>
  );
}

/* ------------------------------------------------------------------ *
 * testimonials
 * ------------------------------------------------------------------ */

/** Testimonials — the featured quote over its photo, and the two written cards. */
export function TestimonialsSkeleton({ cards = 2 }) {
  return (
    <SkeletonRegion
      label="Loading testimonials…"
      className="mt-8 flex flex-col gap-6 min-[639.98px]:mt-12 min-[1100px]:flex-row"
    >
      {/* featured quote */}
      <div className="relative h-[420px] w-full shrink-0 overflow-hidden rounded-lg bg-mist min-[639.98px]:h-[495px] min-[1100px]:w-[480px]">
        <div className="absolute inset-0 flex flex-col justify-end px-6 pt-6 pb-[27px]">
          <Skeleton tone="cream" className="h-[15px] w-[110px]" />
          <div className="mt-3 flex flex-col gap-2">
            <Skeleton tone="cream" className="h-[31px] w-full" />
            <Skeleton tone="cream" className="h-[31px] w-full" />
            <Skeleton tone="cream" className="h-[31px] w-4/5" />
          </div>
          <Skeleton tone="cream" className="mt-4 h-[22px] w-[168px]" />
          <Skeleton tone="cream" className="mt-1 h-[16px] w-[130px]" />
        </div>
      </div>

      {/* two written reviews */}
      <div className="flex w-full min-w-0 flex-col gap-6" style={{ maxWidth: 762 }}>
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="h-auto min-h-[236px] rounded-lg bg-mist p-6">
            <Skeleton tone="cream" className="h-[15px] w-[96px]" />
            <div className="mt-3 flex flex-col gap-2">
              <Skeleton tone="cream" className="h-[31px] w-full" />
              <Skeleton tone="cream" className="h-[31px] w-3/5" />
            </div>
            <div className="mt-6 flex gap-[10px]">
              <Skeleton tone="cream" className="h-[41px] w-[41px] shrink-0" radius="md" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Skeleton tone="cream" radius="sm" className="h-[22px] w-[152px]" />
                <Skeleton tone="cream" radius="sm" className="h-[17px] w-[116px]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

/* ------------------------------------------------------------------ *
 * faq
 * ------------------------------------------------------------------ */

/** FaqList — a stack of closed rows: question line, and the plus where it sits. */
export function FaqSkeleton({ count = 5, className = "", maxWidth = 798 }) {
  return (
    <SkeletonRegion
      label="Loading FAQs…"
      className={`flex flex-col gap-4 [will-change:transform] ${className || "w-full min-w-0"}`}
      style={{ maxWidth }}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="relative min-h-[61px] rounded-lg bg-mist p-4">
          <Skeleton tone="cream" className="h-[28px] w-full sm:w-4/5" />
          <Skeleton tone="cream" radius="sm" className="absolute right-[11px] top-[11px] h-[34px] w-[34px]" />
        </div>
      ))}
    </SkeletonRegion>
  );
}

/* ------------------------------------------------------------------ *
 * gallery
 * ------------------------------------------------------------------ */

/**
 * GalleryPage — the header row the CMS entry also owns, then three columns of
 * blocks at the aspect ratios the hand-packed fallback uses. Reusing those
 * ratios means the masonry is exactly the right height before a single photo
 * has arrived, and looks the same when the CMS packs its own columns.
 */
const GALLERY_COLUMNS = GALLERY.columns.map((col) => col.map((img) => `${img.w} / ${img.h}`));

export function GallerySkeleton() {
  return (
    <SkeletonRegion label="Loading photos…" className="flex flex-col gap-8 min-[639.98px]:gap-12">
      <div className="flex flex-col items-start gap-4 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between min-[900px]:gap-8">
        <div className="flex w-full min-w-0 flex-col gap-2" style={{ maxWidth: 560 }}>
          <Skeleton className="h-[17px] w-[110px]" />
          <Skeleton className="h-[40px] w-[480px] max-w-full min-[639.98px]:h-[70px]" />
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 min-[900px]:items-end" style={{ maxWidth: 706 }}>
          <Skeleton className="h-[22px] w-full" />
          <Skeleton className="h-[22px] w-[92%] min-[900px]:self-end" />
          <Skeleton className="h-[22px] w-[78%] min-[900px]:self-end" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 min-[639.98px]:grid-cols-2 min-[1100px]:grid-cols-3">
        {GALLERY_COLUMNS.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-6">
            {col.map((ratio, i) => (
              <Skeleton key={i} className="w-full" style={{ aspectRatio: ratio }} />
            ))}
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

/* ------------------------------------------------------------------ *
 * navbar
 * ------------------------------------------------------------------ */

/**
 * The mega-menus, while the collection behind them is in flight.
 *
 * Rows of text lines only — no preview card, because a placeholder photo there
 * would read as a destination or a tour that might exist. The preview's box is
 * held open (an empty column, not an image) so opening the menu does not
 * collapse the panel and then spring it back once the rows land.
 *
 * The closing link and CTA are static navigation and stay real: only the count,
 * which is read off the collection, is a placeholder.
 */
export function NavMenuSkeleton({
  rows = HIKES_ALL.length,
  label = "Loading menu…",
  linkLabel = "All destinations",
  linkHref = "/destinations",
  ctaLabel = "Browse all tours",
  ctaHref = "/tours",
  onNavigate,
}) {
  return (
    <SkeletonRegion
      label={label}
      className="menu-in flex max-h-[calc(100dvh-92px)] flex-col gap-5 overflow-y-auto overscroll-contain rounded-b-lg bg-cream p-6"
    >
      <div className="flex gap-5">
        <nav className="flex w-[260px] shrink-0 flex-col min-[1100px]:w-[360px]">
          {Array.from({ length: rows }, (_, i) => (
            <div
              key={i}
              className="flex flex-1 items-center justify-between gap-3 rounded-lg px-3"
            >
              <Skeleton className="h-[21px] w-[58%]" />
              <Skeleton className="h-[16px] w-[58px] shrink-0" />
            </div>
          ))}
        </nav>
        {/* the preview column's footprint, deliberately empty */}
        <div className="min-w-0 flex-1 min-h-[300px] min-[1100px]:min-h-[380px]" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-5">
        <div className="flex flex-wrap items-center gap-4 min-[1100px]:gap-6">
          <div className="t-eyebrow flex items-center">
            <Skeleton className="h-[17px] w-[236px]" />
          </div>
          <a href={linkHref} onClick={onNavigate} className="t-link text-ink underline underline-offset-4">
            {linkLabel}
          </a>
        </div>
        <a href={ctaHref} onClick={onNavigate} className="btn btn-dark w-[150px]">
          {ctaLabel}
        </a>
      </div>
    </SkeletonRegion>
  );
}

/**
 * The header logo, while the global entry is in flight. The same 84x42 box the
 * image occupies, so the bar's own layout and the site's name beside it are
 * untouched — the bar never looks empty, only not-yet-loaded.
 */
export function LogoSkeleton({ className = "" }) {
  return <Skeleton className={`block h-[42px] w-[84px] max-[1023.98px]:h-[36px] max-[1023.98px]:w-[72px] ${className}`} />;
}

/* ------------------------------------------------------------------ *
 * footer
 * ------------------------------------------------------------------ */

/** The footer's brand column: logo, closing line, and the three contact rows. */
export function FooterBrandSkeleton({ contacts = 3 }) {
  return (
    <SkeletonRegion label="Loading…">
      <Skeleton className="block h-[46px] w-[92px] max-[639.98px]:h-[40px] max-[639.98px]:w-[80px]" />
      <Skeleton className="mt-4 h-[22px] w-[340px] max-w-full" />

      <div className="mt-6 flex flex-col gap-3">
        {Array.from({ length: contacts }, (_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <Skeleton className="h-[17px] w-[52px]" />
            <Skeleton className="h-[22px] w-[186px]" />
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

/** The oversized brand mark at the foot of the footer. */
export function FooterLogomarkSkeleton() {
  return (
    <SkeletonRegion label="Loading…">
      <Skeleton className="mx-auto block h-[100px] w-[200px] min-[639.98px]:h-[150px] min-[639.98px]:w-[300px]" />
    </SkeletonRegion>
  );
}