import { useEffect } from "react";
import PageShell from "../components/PageShell.jsx";
import { PageHeader } from "../components/ui.jsx";
import Icon from "../data/Icon.jsx";
import { ABOUT } from "../data/pages.js";
import { GUIDE_SECTION, PAGES } from "../data/content.js";

// Bodies are lifted verbatim from the home page's "Why API Touch" cards and
// the guide section; only two headings are new.
const STRENGTHS = [
  ...ABOUT.why.cards,
  { title: "Experienced guides", body: GUIDE_SECTION.points[0].body },
  { title: "Personalized service", body: "Beginners get the full walkthrough, gear to footing, no assumptions made." },
  { title: "Safety & support", body: GUIDE_SECTION.points[1].body },
];

const STRENGTH_ICON = ["2327548604", "535953797", "1118047839", "2784223275", "50407791", "2109778876"];

export default function WhyPage() {
  const page = PAGES["/why-apitouch"];

  useEffect(() => {
    document.title = page.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", page.description);
  }, [page]);

  return (
    <PageShell>
      <section className="page-sec container-x flex flex-col gap-8 min-[639.98px]:gap-12">
        <PageHeader badge={ABOUT.why.badge} title={ABOUT.why.title.join(" ")} sub={ABOUT.why.body} />

        {/* banner with the three mist cards sitting on it, as on the About page */}
        <div className="relative h-auto overflow-hidden rounded-lg p-4 pt-[180px] min-[639.98px]:p-6 min-[639.98px]:pt-[200px] min-[1100px]:h-[444px] min-[1100px]:p-[24px] min-[1100px]:pt-[240px]">
          <img src={ABOUT.why.banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="relative z-10 flex flex-col gap-4 min-[900px]:flex-row min-[900px]:gap-6">
            {STRENGTHS.slice(0, 3).map((c) => (
              <div key={c.title} className="flex min-h-[160px] flex-1 flex-col justify-end gap-1 rounded-lg bg-mist p-4">
                <h4 className="t-h4 text-ink">{c.title}</h4>
                <p className="t-body">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* the rest of the strengths */}
        <div className="grid grid-cols-1 gap-6 min-[639.98px]:grid-cols-2 min-[1100px]:grid-cols-3">
          {STRENGTHS.slice(3).map((c, i) => (
            <div key={c.title} className="flex flex-col gap-3 rounded-lg bg-mist p-6">
              <Icon id={STRENGTH_ICON[i + 3]} size={36} />
              <h4 className="t-h4 text-ink">{c.title}</h4>
              <p className="t-body">{c.body}</p>
            </div>
          ))}
        </div>

        {/* the people behind those strengths */}
        <div className="flex flex-col items-start gap-4 rounded-lg bg-mist p-6 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between min-[900px]:gap-6">
          <div className="flex min-w-0 items-center gap-4">
            <img src={GUIDE_SECTION.image} alt={GUIDE_SECTION.imageAlt} className="h-[64px] w-[64px] shrink-0 rounded-lg object-cover min-[639.98px]:h-[72px] min-[639.98px]:w-[72px]" />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="t-h4 text-ink">{GUIDE_SECTION.title.join(" ")}</p>
              <p className="t-body">{GUIDE_SECTION.body1}</p>
            </div>
          </div>
          <a href="/about" className="btn btn-dark w-[110px]">
            meet us
          </a>
        </div>
      </section>
    </PageShell>
  );
}
