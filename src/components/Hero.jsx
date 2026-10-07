import { HERO } from "../data/content.js";
import { Eyebrow } from "./ui.jsx";
import { Reveal } from "../anim.jsx";

export default function Hero() {
  return (
    /* 100svh so the mobile browser's collapsing chrome doesn't clip the
       copy; min-heights step down so short landscape phones still fit. */
    <section data-hero className="relative h-screen min-h-[700px] max-[1023.98px]:h-[100svh] max-[1023.98px]:min-h-[600px] max-[639.98px]:min-h-[520px] overflow-hidden bg-cream">
      {/* full-bleed photo inside an 8px cream frame. The original opens with
          the frame's photo easing back from 1.05 to 1 (1.5s, delay 0.1s) —
          it never fades, so this section opts out of the generic reveal. */}
      <div className="absolute inset-2 overflow-hidden rounded-lg max-[639.98px]:inset-1.5">
        <img
          src={HERO.image}
          alt={HERO.imageAlt}
          className="hero-zoom h-full w-full object-cover"
        />
        <div className="grad-hero absolute inset-0" />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 pb-[60px] max-[639.98px]:pb-8">
        <div className="container-x flex flex-col items-start gap-6 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between min-[900px]:gap-8">
          <div className="min-w-0">
            {/* copy arrives late — the original's load delays run 0.8 → 1.2s */}
            <Reveal effect="up" delay={700}>
              <Eyebrow color="var(--color-mist)">{HERO.eyebrow}</Eyebrow>
            </Reveal>
            <Reveal effect="up" delay={800}>
              <h1 className="t-h1 mt-2 w-full" style={{ maxWidth: 700 }}>
                {HERO.title}
              </h1>
            </Reveal>
            {/* flex wrapper keeps the inline-flex button off the line strut,
                so the hero keeps its measured spacing */}
            <Reveal effect="up" delay={1000} className="flex">
              <a href={HERO.ctaHref} className="btn btn-cream mt-2 w-[172px]">
                {HERO.cta}
              </a>
            </Reveal>
          </div>
          <Reveal
            as="p"
            effect="up"
            delay={1200}
            className="w-full min-w-0 font-body text-[clamp(16px,1.5vw,20px)] leading-[1.4] text-sage min-[900px]:text-right"
            style={{ maxWidth: 420 }}
          >
            {HERO.sub}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
