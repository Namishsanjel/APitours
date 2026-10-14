import { useEffect } from "react";
import PageShell from "../components/PageShell.jsx";
import { PageHeader } from "../components/ui.jsx";
import Icon from "../data/Icon.jsx";
import { INCLUDED_SECTION, INCLUDED_FEATURES, PAGES } from "../data/content.js";
import { SERVICES_PAGE } from "../data/newPages.js";
import { useStrapiList, imageOf, STRAPI_STATUS } from "../lib/strapiData.jsx";
import { ServicesGridSkeleton } from "../components/skeletons.jsx";
import { SectionError, SectionEmpty } from "../components/SectionError.jsx";

/** One card per Strapi service: picture, title, summary, linking to its detail page. */
function ServiceCard({ service }) {
  const image = imageOf(service.image, service.title);

  return (
    <a href={`/services/${service.slug}`} className="flex flex-col gap-4 rounded-lg bg-mist p-6">
      {image ? (
        <img src={image.src} alt={image.alt} loading="lazy" className="h-[140px] w-full rounded-lg object-cover" />
      ) : (
        <Icon id={EXTRA_ICON[service.title]} size={36} />
      )}
      <div className="flex flex-col gap-2">
        <h4 className="t-h4">{service.title}</h4>
        {service.shortDescription ? <p className="t-body">{service.shortDescription}</p> : null}
      </div>
    </a>
  );
}

// icon ids from the site's own set, one per extra service card
const EXTRA_ICON = {
  Transportation: "535953797",
  Permits: "1118047839",
  "Travel insurance": "2109778876",
};

const FEATURES = [INCLUDED_FEATURES.guiding, INCLUDED_FEATURES.gear, INCLUDED_FEATURES.meals, INCLUDED_FEATURES.groups];

export default function ServicesPage() {
  const page = PAGES["/services"];
  const { items, status, retry } = useStrapiList("services?populate=image&sort=order:asc");
  const ready = status === STRAPI_STATUS.READY && Array.isArray(items) && items.length > 0;

  useEffect(() => {
    document.title = page.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", page.description);
  }, [page]);

  return (
    <PageShell>
      <section className="page-sec container-x flex flex-col gap-8 min-[639.98px]:gap-12">
        <PageHeader badge={SERVICES_PAGE.badge} title={SERVICES_PAGE.title} sub={SERVICES_PAGE.sub} />

        {/* Four states. While the request is in flight the grid is a skeleton at
            the same 1 / 2 / 3 columns and the same card boxes — the hardcoded
            copy is NOT shown as a placeholder for CMS content that is on its
            way. Strapi's services when it has any. An error state with its own
            retry when the request failed. One neutral line when the collection
            is empty. The two hardcoded grids (SERVICES and SERVICES_PAGE.extra)
            are no longer rendered: this page is CMS-owned, and showing a static
            list of three services next to a CMS that had failed to answer was
            the same claim as rendering them as content. */}
        {status === STRAPI_STATUS.LOADING ? (
          <ServicesGridSkeleton />
        ) : status === STRAPI_STATUS.ERROR ? (
          <SectionError onRetry={retry} />
        ) : !ready ? (
          <SectionEmpty />
        ) : (
          <div className="grid grid-cols-1 gap-6 min-[639.98px]:grid-cols-2 min-[1100px]:grid-cols-3">
            {items.map((s) => (
              <ServiceCard key={s.documentId ?? s.id ?? s.slug} service={s} />
            ))}
          </div>
        )}

        {/* what's included + the way over to the planning form */}
        <div className="flex flex-col gap-6 rounded-lg bg-mist p-6 min-[639.98px]:p-8">
          <div className="flex flex-col items-start gap-4 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between min-[900px]:gap-6">
            <div className="flex w-full min-w-0 flex-col gap-2" style={{ maxWidth: 560 }}>
              <h2 className="t-h3l text-ink">{INCLUDED_SECTION.title.join(" ")}</h2>
              <p className="t-body">{INCLUDED_SECTION.body}</p>
            </div>
            <a href={SERVICES_PAGE.ctaHref} className="btn btn-dark w-[150px]">
              {SERVICES_PAGE.cta}
            </a>
          </div>

          <div className="grid grid-cols-1 gap-6 min-[639.98px]:grid-cols-2 min-[1100px]:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col gap-2 rounded-lg bg-cream p-4">
                <Icon id={f.icon} size={30} />
                <p className="t-link text-ink">{f.title}</p>
                <p className="t-body">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
