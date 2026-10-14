import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell.jsx";
import { PageHeader, ImgBlur } from "../components/ui.jsx";
import TourCard from "../components/TourCard.jsx";
import JsonLd from "../components/JsonLd.jsx";
import { breadcrumbJsonLd, tourBreadcrumbs, tourJsonLd } from "../lib/jsonld.js";
import { usePageMeta } from "../lib/seo.js";
import {
  GALLERY_PATH,
  useStrapiList,
  useStrapiToursState,
  useStrapiDestinations,
  STRAPI_STATUS,
} from "../lib/strapiData.jsx";
import { tourListings, asTourDetail, galleryItems, destinationList } from "../lib/catalog.js";
import { rememberTour } from "../lib/prefill.js";
import { TourDetailSkeleton, GalleryStripSkeleton } from "../components/skeletons.jsx";
import { SectionError, SectionEmpty } from "../components/SectionError.jsx";

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="1.5" y="1.5" width="13" height="13" rx="4" stroke="currentColor" strokeWidth="1.2" />
      <path d="m5 8.2 2.1 2.1L11 6.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Arrow({ dir }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d={dir === "left" ? "M8.75 3.5 5.25 7l3.5 3.5" : "M5.25 3.5 8.75 7l-3.5 3.5"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TourDetailPage() {
  const slug = window.location.pathname.split("/").filter(Boolean).pop() ?? "";
  const { data: strapiTours, status: toursStatus, retry: retryTours } = useStrapiToursState();
  const strapiDestinations = useStrapiDestinations();
  // The shared site gallery, fetched only for a tour that turns out to have no
  // photos of its own. Same path string as GalleryPage, so the 60s cache hands
  // back the request that page already made.
  const { items: strapiGallery, status: galleryStatus, retry: retryGallery } = useStrapiList(GALLERY_PATH);
  const records = useMemo(() => tourListings(strapiTours), [strapiTours]);
  const record = records.find((h) => h.slug === slug) ?? null;
  const detail = record ? asTourDetail(record) : null;
  const [shot, setShot] = useState(0);

  const loading = toursStatus === STRAPI_STATUS.LOADING;
  // the photo strip has its own request; only that block waits on it
  const galleryLoading = galleryStatus === STRAPI_STATUS.LOADING;

  const tagline = (detail?.overview ?? "").split("\n\n")[0] ?? "";

  // Remember this tour for the forms. The record's own `destination` is a slug
  // when the CMS set the relation; the hardcoded records have no field for it,
  // so the tour's slug is looked for in the destinations that list it — either
  // way this is the name the visitor just read, not a slug. Keyed on primitives
  // rather than on the record object, which is rebuilt on every list render.
  const tourTitle = record?.title ?? "";
  const tourSlug = record?.slug ?? "";
  const tourRelation = record?.destination ?? "";
  const destinationNames = destinationList(strapiDestinations);
  let destinationName = "";
  if (tourTitle) {
    if (tourRelation) {
      destinationName = destinationNames.find((d) => d.slug === tourRelation)?.name ?? "";
    }
    if (!destinationName) {
      destinationName =
        destinationNames.find((d) => (d.tours || []).includes(tourSlug))?.name ?? "";
    }
  }

  useEffect(() => {
    if (tourTitle) rememberTour(tourTitle, destinationName);
  }, [tourTitle, destinationName]);

  usePageMeta({
    title: `${detail ? detail.title : "Tour"} — API Touch`,
    description: tagline,
  });

  // Loading: the whole detail page is held — header, hero, itinerary column,
  // booking sidebar — at the sizes the loaded page uses, for a known slug and an
  // unknown one alike. Neither the hardcoded record for this slug nor the
  // not-found copy may be shown yet: the first would be a claim the CMS has not
  // confirmed, the second would be a lie while the answer is still on its way.
  if (loading) {
    return (
      <PageShell faq={false}>
        <TourDetailSkeleton />
      </PageShell>
    );
  }

  /* The request failed, so nothing is known about this slug. Saying "this tour
     could not be found" here would be a statement about the catalogue when the
     truth is that the catalogue could not be reached; the not-found copy below
     is now reserved for a request that succeeded and matched nothing. */
  if (toursStatus === STRAPI_STATUS.ERROR) {
    return (
      <PageShell faq={false}>
        <section className="page-sec container-x flex flex-col gap-6">
          <SectionError onRetry={retryTours} />
        </section>
      </PageShell>
    );
  }

  /* The collection succeeded but holds no tours at all. That is a different thing
     from "this slug is unknown", so it is checked first: with nothing published
     there is no catalogue to have failed to match. */
  if (!records.length) {
    return (
      <PageShell faq={false}>
        <section className="page-sec container-x flex flex-col gap-6">
          <SectionEmpty />
        </section>
      </PageShell>
    );
  }

  /* Reached only once the request has finished successfully and the collection
     is not empty. A slug Strapi knows nothing about is out of date or removed. */
  if (!record) {
    return (
      <PageShell faq={false}>
        <section className="page-sec container-x flex flex-col gap-6">
          <PageHeader badge="Tour" title="This tour could not be found" />
          <a href="/tours" className="btn btn-dark w-[160px]">
            Browse all tours
          </a>
        </section>
      </PageShell>
    );
  }

  const [bodyTagline = "", ...overview] = detail.overview.split("\n\n");
  const [amount, unit] = detail.price ? detail.price.split(" /") : [];
  const others = records.filter((h) => h.slug !== slug).slice(0, 2);
  /* The tour's own photos, or the shared site gallery when it has none. The CMS
     gallery is the only source now: when it errors the strip reports that and
     offers a retry rather than filling itself with the hand-picked photos from
     GALLERY, which are hardcoded copy for a collection we could not read. */
  const cmsGallery = galleryItems(Array.isArray(strapiGallery) ? strapiGallery[0]?.photos : null);
  const gallery = record.gallery?.length ? record.gallery : cmsGallery;
  const tourSchema = tourJsonLd({
    ...record,
    // structured values the schema already knows how to emit
    price: record.priceAmount == null ? null : { amount: record.priceAmount, currency: "USD" },
    duration: record.durationDays == null ? null : { days: record.durationDays },
  });
  const breadcrumbSchema = breadcrumbJsonLd(tourBreadcrumbs(detail.title, slug));

  return (
    <PageShell>
      <JsonLd id="jsonld-tour" data={tourSchema} />
      <JsonLd id="jsonld-breadcrumb-tour" data={breadcrumbSchema} />
      {/* headline + standfirst, as on the original detail page */}
      <section className="container-x flex flex-col gap-8 pt-[120px] max-[1099.98px]:pt-[100px] max-[639.98px]:pt-[88px]">
        <PageHeader title={detail.title} sub={bodyTagline} />

        {/* hero photo with the trip facts glassed over it */}
        <div className="relative h-[240px] overflow-hidden rounded-lg bg-mist p-1 min-[639.98px]:h-[300px] min-[1100px]:h-[360px]">
          <div className="relative h-full w-full overflow-hidden rounded">
            <img src={record.image} alt={record.alt} className="absolute inset-0 h-full w-full object-cover" />
            <div className="grad-card absolute inset-0" />
            <ImgBlur />
            <div className="absolute inset-0 z-10 flex flex-wrap gap-2 p-4">
              {detail.chips.map((c) => (
                <span key={c} className="chip">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* body: itinerary column + booking card */}
      <section className="container-x flex flex-col gap-8 pb-[60px] pt-10 min-[1100px]:flex-row min-[1100px]:justify-between min-[1100px]:pt-12">
        <div className="flex w-full min-w-0 flex-col gap-10" style={{ maxWidth: 800 }}>
          <div className="flex flex-col gap-3">
            <h2 className="t-h4 text-ink">Overview</h2>
            {overview.map((p) => (
              <p key={p} className="t-body">
                {p}
              </p>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="t-h4 text-ink">What's Included</h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 min-[639.98px]:grid-cols-2 min-[1100px]:grid-cols-3">
              {detail.inclusions.map((i) => (
                <div key={i} className="flex items-center gap-2 text-ink">
                  <CheckIcon />
                  <p className="t-body text-ink">{i}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="t-h4 text-ink">Gallery</h2>
            {galleryLoading ? (
              <GalleryStripSkeleton />
            ) : galleryStatus === STRAPI_STATUS.ERROR ? (
              /* held at the strip's own 240 / 300 / 380px box, so the page does
                 not jump when the retry brings the photos in */
              <SectionError
                onRetry={retryGallery}
                className="flex h-[240px] items-center min-[639.98px]:h-[300px] min-[1100px]:h-[380px]"
              />
            ) : !gallery.length ? (
              /* this tour published no photos and the shared gallery has none
                 either: an empty frame in the same box, not a broken one */
              <div className="relative h-[240px] overflow-hidden rounded-lg min-[639.98px]:h-[300px] min-[1100px]:h-[380px]">
                <SectionEmpty className="h-full w-full justify-center" />
              </div>
            ) : (
              <div className="relative h-[240px] overflow-hidden rounded-lg min-[639.98px]:h-[300px] min-[1100px]:h-[380px]">
                <img
                  key={shot}
                  src={gallery[shot]?.src}
                  alt={gallery[shot]?.alt ?? record.alt}
                  className="shot-in absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={() => setShot((i) => (i - 1 + gallery.length) % gallery.length)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-mist text-ink"
                  >
                    <Arrow dir="left" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={() => setShot((i) => (i + 1) % gallery.length)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-mist text-ink"
                  >
                    <Arrow dir="right" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="t-h4 text-ink">Tour Schedule</h2>
            <div className="flex flex-col gap-3">
              {detail.itinerary.map((d, i) => (
                <p key={`${d.day}-${i}`} className="t-body">
                  <span className="text-ink">{d.day}</span>
                  {d.title ? ` — ${d.title}` : ""} — {d.body}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* booking card: photo, trip facts, price and the booking CTA.

            Sticky from 1100px up, where it is the sidebar beside the itinerary
            column: it rides down as that column scrolls past instead of
            scrolling off. The section above is its containing block, so the
            card lets go at that section's bottom edge — it parks just above
            "More Tours to Explore" rather than following it down the page.
            Below 1100px the card stacks under the copy with nothing beside it,
            so it stays in flow. */}
        <aside className="flex w-full min-w-0 shrink-0 flex-col gap-5 self-start rounded-lg bg-mist p-6 min-[1100px]:sticky min-[1100px]:top-6 min-[1100px]:w-[470px]">
          <div className="h-[170px] overflow-hidden rounded-lg">
            <img src={record.image} alt="" className="h-full w-full object-cover" />
          </div>

          {detail.start ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <p className="t-link text-ink">{detail.start}</p>
                <p className="t-eyebrow text-smoke">Starting Point</p>
              </div>
              <div className="h-px flex-1 border-t border-dashed border-smoke" />
              <div className="flex flex-col items-end">
                <p className="t-link text-ink">{detail.end}</p>
                <p className="t-eyebrow text-smoke">Ending Point</p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-4">
            <div className="flex items-baseline gap-1">
              <span className="t-h2 text-ink">{amount}</span>
              {unit ? <span className="t-body">/{unit}</span> : null}
            </div>

            {/* To the contact form with this tour's title already in the field, so the
                enquiry arrives knowing which tour it is about. encodeURIComponent
                because titles carry spaces, ampersands and apostrophes. */}
            <a
              href={`/contact?tour=${encodeURIComponent(record.title)}`}
              className="btn btn-dark h-[51px] w-full"
            >
              Book This Tour
            </a>
          </div>
        </aside>
      </section>

      <section className="container-x flex flex-col gap-6 pb-[60px]">
        <h2 className="t-h3l text-ink">More Tours to Explore</h2>
        <div className="grid grid-cols-1 gap-6 min-[900px]:grid-cols-2">
          {others.map((t, i) => (
            <TourCard key={t.slug} tour={t} index={i} />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
