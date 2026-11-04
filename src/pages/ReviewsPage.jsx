import { useEffect } from "react";
import PageShell from "../components/PageShell.jsx";
import { PageHeader } from "../components/ui.jsx";
import Icon from "../data/Icon.jsx";
import { TESTIMONIAL_SECTION, FEATURED_QUOTE, REVIEWS, PAGES } from "../data/content.js";

function Location({ children, color }) {
  return (
    <div className="mt-[2px] flex items-center gap-1">
      <Icon id="4159562592" size={16} style={{ color }} />
      <span className="t-eyebrow" style={{ color }}>
        {children}
      </span>
    </div>
  );
}

export default function ReviewsPage() {
  const page = PAGES["/reviews"];

  useEffect(() => {
    document.title = page.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", page.description);
  }, [page]);

  return (
    <PageShell>
      <section className="page-sec container-x flex flex-col gap-8 min-[639.98px]:gap-12">
        <PageHeader badge={TESTIMONIAL_SECTION.badge} title={TESTIMONIAL_SECTION.title.join(" ")} sub={TESTIMONIAL_SECTION.body} />

        <div className="flex flex-col gap-6 min-[1100px]:flex-row">
          {/* featured quote over photo */}
          <div className="relative h-[420px] w-full shrink-0 overflow-hidden rounded-lg min-[1100px]:h-[495px] min-[1100px]:w-[480px]">
            <img src={FEATURED_QUOTE.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="grad-quote absolute inset-0" />
            <div className="absolute inset-0 flex flex-col justify-end px-6 pt-6 pb-[27px]">
              <h4 className="t-h4 text-mist">{FEATURED_QUOTE.quote}</h4>
              <p className="mt-4 font-body text-[16px] leading-[22.4px] text-cream">{FEATURED_QUOTE.name}</p>
              <Location color="var(--color-mist)">{FEATURED_QUOTE.trip}</Location>
            </div>
          </div>

          {/* written reviews */}
          <div className="flex w-full min-w-0 flex-col gap-6" style={{ maxWidth: 762 }}>
            {REVIEWS.map((r) => (
              <div key={r.name} className="rounded-lg bg-mist p-6">
                <h4 className="t-h4">{r.title}</h4>
                <p className="t-body mt-6">{r.body}</p>
                <div className="mt-6 flex gap-[10px]">
                  <img src={r.avatar} alt="" className="h-[41px] w-[41px] shrink-0 rounded-md object-cover" />
                  <div className="min-w-0">
                    <p className="font-body text-[16px] leading-[22.4px] text-ink">{r.name}</p>
                    <Location color="var(--color-smoke)">{r.trip}</Location>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start gap-4 rounded-lg bg-mist p-6 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between min-[900px]:gap-6">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="t-h4 text-ink">Traveled with us?</p>
            <p className="t-body">Tell us how the route felt — the next group reads every word of it.</p>
          </div>
          <a href="/contact" className="btn btn-dark w-[140px]">
            get in touch
          </a>
        </div>
      </section>
    </PageShell>
  );
}
