import { useState } from "react";
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

const DOTS = ["3975609195", "1118047839", "739446849"];

export default function About() {
  // which photo the stack is showing; the dot buttons drive it
  const [active, setActive] = useState(1);

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

            {/* Tilted polaroid stack. The selected photo is lifted forward and
                brought to full opacity; the other two stay in place, dimmed.
                Sizes and offsets stay as measured so only the emphasis moves. */}
            <div className="pointer-events-none absolute inset-0">
              {ABOUT.polaroids.map((src, i) => {
                const on = i === active;
                return (
                  <div
                    key={src}
                    /* sized off the card's own width (136/406 measured) so the
                       stack stays inside it on a narrow phone */
                    className="polaroid-shadow absolute aspect-square w-[33.5%] rounded-xl bg-cream p-1 transition-[opacity,transform] duration-500 ease-out"
                    style={{
                      left: POLAROIDS[i].left,
                      top: POLAROIDS[i].top,
                      zIndex: on ? 20 : 10,
                      opacity: on ? 1 : 0.42,
                      transform: `rotate(${POLAROIDS[i].rotate}) scale(${on ? 1.16 : 1})`,
                    }}
                  >
                    <img src={src} alt="" className="h-full w-full rounded-lg object-cover" />
                  </div>
                );
              })}
            </div>

            <div className="mt-auto flex justify-center gap-[10px]" role="group" aria-label="Choose a photo">
              {DOTS.map((icon, i) => {
                const on = i === active;
                return (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`Show photo ${i + 1}`}
                    aria-pressed={on}
                    className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-colors duration-200 ${
                      on ? "bg-primary" : "bg-mist hover:bg-e4"
                    }`}
                    style={{ color: on ? "#ffffff" : "var(--color-ink)" }}
                  >
                    <Icon id={icon} size={24} />
                  </button>
                );
              })}
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
