import { SERVICES_SECTION, SERVICES } from "../data/content.js";
import { Eyebrow } from "./ui.jsx";
import Icon from "../data/Icon.jsx";

export default function Services() {
  const { badge, title, body, cta, ctaHref } = SERVICES_SECTION;

  return (
    <section id="services" className="section-py">
      <div className="container-x flex flex-col gap-8 min-[1100px]:flex-row min-[1100px]:justify-between min-[1100px]:gap-6">
        {/* left column — badge/h2 sit 10px lower here than in other sections */}
        <div className="w-full min-w-0" style={{ maxWidth: 420 }}>
          <Eyebrow>{badge}</Eyebrow>
          <h2 className="t-h2 mt-[18px]">
            {title.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
          <p className="t-body mt-[6px]">{body}</p>
          <a href={ctaHref} className="btn btn-dark mt-4 w-[134px]">
            {cta}
          </a>
          <a href="/services" className="t-link mt-3 block text-ink underline underline-offset-4">
            All services
          </a>
        </div>

        {/* right column — three service cards (Visas / Air Ticketing / Hotel Booking) */}
        <div className="grid w-full min-w-0 grid-cols-1 gap-6 min-[639.98px]:grid-cols-2 min-[1100px]:grid-cols-3" style={{ maxWidth: 798 }}>
          {SERVICES.map((s) => (
            <div key={s.title} className="flex flex-col rounded-lg bg-mist p-6">
              <Icon id={s.icon} size={36} />
              <h4 className="t-h4 mt-6">{s.title}</h4>
              <p className="t-body mt-2">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
