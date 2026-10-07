import { ABOUT } from "../data/content.js";
import Icon from "../data/Icon.jsx";
import { Eyebrow } from "./ui.jsx";

/* Measured off the original inside its 406x374 card; kept as percentages of
   that card so the stack holds its proportions when the card narrows. */
const POLAROIDS = [
  { left: "16.6%", top: "44.2%", rotate: "-12deg" },
  { left: "33.3%", top: "40.4%", rotate: "-1deg" },
  { left: "49.6%", top: "44.2%", rotate: "12deg" },
];

const DOTS = [
  { icon: "3975609195", selected: false },
  { icon: "1118047839", selected: true },
  { icon: "739446849", selected: false },
];

export default function About() {
  return (
    <section id="about" className="section-py">
      <div className="container-x flex flex-col gap-6 min-[1100px]:flex-row min-[1100px]:justify-between">
        {/* stats + story card */}
        <div className="w-full min-w-0" style={{ maxWidth: 406 }}>
          <div>
            {ABOUT.stats.map((s) => (
              <div
                key={s.label}
                className="flex min-h-[60px] items-center justify-between gap-3 border-b border-smoke py-2"
              >
                <span className="t-link text-smoke">{s.label}</span>
                <span className="font-body text-[20px] leading-[28px] font-medium text-ink">
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          <div className="relative mt-8 flex min-h-[374px] flex-col rounded-2xl bg-mist p-4 min-[639.98px]:mt-[46px]">
            <h3 className="t-h4">{ABOUT.cardTitle}</h3>
            <p className="t-body mt-2">{ABOUT.cardBody}</p>

            {/* tilted polaroid stack */}
            <div className="pointer-events-none absolute inset-0">
              {ABOUT.polaroids.map((src, i) => (
                <div
                  key={src}
                  /* sized off the card's own width (136/406 measured) so the
                     stack stays inside it on a narrow phone */
                  className="polaroid-shadow absolute aspect-square w-[33.5%] rounded-xl bg-cream p-1"
                  style={{
                    left: POLAROIDS[i].left,
                    top: POLAROIDS[i].top,
                    transform: `rotate(${POLAROIDS[i].rotate})`,
                  }}
                >
                  <img src={src} alt="" className="h-full w-full rounded-lg object-cover" />
                </div>
              ))}
            </div>

            <div className="mt-auto flex justify-center gap-[10px]">
              {DOTS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg ${
                    d.selected ? "bg-primary" : "bg-mist"
                  }`}
                  style={{ color: d.selected ? "#ffffff" : "var(--color-ink)" }}
                >
                  <Icon id={d.icon} size={24} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* centre photo */}
        <img
          src={ABOUT.image}
          alt="Scenic travel landscape used to introduc"
          className="h-[380px] w-full shrink-0 rounded-lg object-cover min-[1100px]:h-[600px] min-[1100px]:w-[406px]"
        />

        {/* copy */}
        <div className="w-full min-w-0" style={{ maxWidth: 406 }}>
          <Eyebrow>{ABOUT.badge}</Eyebrow>
          <h2 className="t-h2 mt-2">
            {ABOUT.title.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
          <p className="t-body mt-4">{ABOUT.body}</p>
          <a href={ABOUT.ctaHref} className="btn btn-dark mt-4 w-[100px]">
            {ABOUT.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
