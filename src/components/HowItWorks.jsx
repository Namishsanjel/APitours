import { STEPS_SECTION, STEPS } from "../data/content.js";
import { Eyebrow } from "./ui.jsx";

export default function HowItWorks() {
  const { badge, title, body, cta, ctaHref } = STEPS_SECTION;

  return (
    <section className="section-py">
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
        </div>

        {/* right column — four step cards */}
        <div className="flex w-full min-w-0 flex-col gap-6" style={{ maxWidth: 798 }}>
          {STEPS.map((s) => (
            <div key={s.n} className="flex min-h-[128px] gap-6 rounded-lg bg-mist p-6 min-[639.98px]:gap-9">
              <span className="w-[36px] shrink-0 pt-1 text-center font-body text-[20px] leading-[28px] font-medium text-ink">
                {s.n}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="t-h4">{s.title}</h4>
                <p className="t-body mt-1">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
