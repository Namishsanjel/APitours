import { TESTIMONIAL_SECTION, FEATURED_QUOTE, REVIEWS } from "../data/content.js";
import { SectionHead, HeadCopy } from "./ui.jsx";
import Icon from "../data/Icon.jsx";

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

export default function Testimonials() {
  return (
    <section className="section-py">
      <div className="container-x">
        <SectionHead badge={TESTIMONIAL_SECTION.badge} title={TESTIMONIAL_SECTION.title}>
          <HeadCopy>{TESTIMONIAL_SECTION.body}</HeadCopy>
          <a href="/reviews" className="t-link text-ink underline underline-offset-4">
            Read all reviews
          </a>
        </SectionHead>

        <div className="mt-8 flex flex-col gap-6 min-[639.98px]:mt-12 min-[1100px]:flex-row">
          {/* featured quote over photo */}
          <div className="relative h-[420px] w-full shrink-0 overflow-hidden rounded-lg min-[639.98px]:h-[495px] min-[1100px]:w-[480px]">
            <img src={FEATURED_QUOTE.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="grad-quote absolute inset-0" />
            <div className="absolute inset-0 flex flex-col justify-end px-6 pt-6 pb-[27px]">
              <h4 className="t-h4 text-mist">{FEATURED_QUOTE.quote}</h4>
              <p className="mt-4 font-body text-[16px] leading-[22.4px] text-cream">
                {FEATURED_QUOTE.name}
              </p>
              <Location color="var(--color-mist)">{FEATURED_QUOTE.trip}</Location>
            </div>
          </div>

          {/* two written reviews */}
          <div className="flex w-full min-w-0 flex-col gap-6" style={{ maxWidth: 762 }}>
            {REVIEWS.map((r) => (
              <div key={r.name} className="h-auto min-h-[236px] rounded-lg bg-mist p-6">
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
      </div>
    </section>
  );
}
