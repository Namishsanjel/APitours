import PageShell from "../components/PageShell.jsx";
import { PageHeader } from "../components/ui.jsx";
import Blocks from "../components/Blocks.jsx";
import { useStrapiList, hasContent, imageOf } from "../lib/strapiData.jsx";
import { blocksToText } from "../lib/strapi.js";
import { usePageMeta } from "../lib/seo.js";

/**
 * One service, fetched by slug.
 *
 * The slug is read from the path on every render, the same way TourDetailPage
 * does it — this router has no params object, and a module-level read would go
 * stale the moment you navigate from one service to another. The query is built
 * with encodeURIComponent so a hand-typed slug cannot break out of the filter.
 */
export default function ServiceDetailPage() {
  const slug = window.location.pathname.split("/").filter(Boolean).pop() ?? "";
  const { items, loading } = useStrapiList(
    `services?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=image`
  );

  const service = hasContent(items) ? items[0] : null;
  const image = service ? imageOf(service.image, service.title) : null;

  usePageMeta({
    title: service ? `${service.title} — API Touch` : "Service not found — API Touch",
    description: service?.shortDescription || blocksToText(service?.description),
  });

  // While the request is in flight there is nothing true to show yet, and
  // flashing either the empty header or the not-found copy would be a lie.
  if (loading) {
    return (
      <PageShell faq={false}>
        <section className="page-sec container-x" />
      </PageShell>
    );
  }

  // Strapi answers with an empty list for a slug that does not exist, which is
  // the same state as "Strapi is unreachable" here: either way there is no
  // service to describe, so both land on the not-found copy.
  if (!service) {
    return (
      <PageShell faq={false}>
        <section className="page-sec container-x flex flex-col gap-6">
          <PageHeader badge="Service" title="This service could not be found" />
          <p className="t-body" style={{ maxWidth: 560 }}>
            The link may be out of date, or the service may have been removed.
          </p>
          <a href="/services" className="btn btn-dark w-[170px]">
            Browse all services
          </a>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="page-sec container-x flex flex-col gap-8 min-[639.98px]:gap-12">
        <PageHeader badge="Service" title={service.title} sub={service.shortDescription} />

        {/* no image in Strapi means no banner at all, rather than a broken one */}
        {image ? (
          <img
            src={image.src}
            alt={image.alt}
            className="h-[220px] w-full rounded-lg object-cover min-[639.98px]:h-[320px] min-[1100px]:h-[420px]"
          />
        ) : null}

        <div className="flex w-full min-w-0 flex-col gap-6" style={{ maxWidth: 706 }}>
          <Blocks content={service.description} />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <a href="/services" className="btn btn-dark w-[170px]">
            All services
          </a>
          <a href="/plan-your-trip" className="t-link text-ink underline underline-offset-4">
            Plan your tour
          </a>
        </div>
      </section>
    </PageShell>
  );
}