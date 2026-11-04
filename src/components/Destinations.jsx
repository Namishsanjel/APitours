import { DESTINATIONS_SECTION, DESTINATIONS } from "../data/content.js";
import { SectionHead, HeadCopy, Eyebrow } from "./ui.jsx";
import { Reveal } from "../anim.jsx";
import { stagger } from "../motion.js";

/** Alternating rows: photo on one side, region + heading + copy on the other. */
export default function Destinations() {
  return (
    <section id="destinations" className="section-py">
      <div className="container-x">
        <SectionHead badge={DESTINATIONS_SECTION.badge} title={DESTINATIONS_SECTION.title}>
          <HeadCopy>{DESTINATIONS_SECTION.body}</HeadCopy>
          <a href="/destinations" className="t-link text-ink underline underline-offset-4">
            All destinations
          </a>
        </SectionHead>

        <div className="mt-8 flex flex-col gap-8 min-[639.98px]:mt-12 min-[639.98px]:gap-12">
          {DESTINATIONS.map((d, i) => (
            <Reveal
              key={d.title}
              delay={stagger(i, 120)}
              className={`flex flex-col items-start gap-6 min-[900px]:flex-row min-[900px]:items-center min-[900px]:gap-16 ${
                i % 2 === 1 ? "min-[900px]:flex-row-reverse" : ""
              }`}
            >
              <img
                src={d.image}
                alt={d.alt}
                loading="lazy"
                className="h-[240px] w-full shrink-0 rounded-lg object-cover min-[639.98px]:h-[320px] min-[900px]:h-[420px] min-[900px]:w-[645px]"
              />
              <div className="w-full min-w-0 flex-1">
                <Eyebrow>{d.region}</Eyebrow>
                <h3 className="t-h3l mt-3">
                  <a href={`/destinations/${d.slug}`}>{d.title}</a>
                </h3>
                <p className="t-body mt-3 max-w-[470px]">{d.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
