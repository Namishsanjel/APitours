import { useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import Faq from "../components/Faq.jsx";
import Footer from "../components/Footer.jsx";
import { Eyebrow, SectionHead, HeadCopy, ImgBlur, Words } from "../components/ui.jsx";
import { ABOUT } from "../data/pages.js";
import { PAGES } from "../data/content.js";

export default function AboutPage() {
  const page = PAGES["/about"];

  useEffect(() => {
    document.title = page.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", page.description);
  }, [page]);

  return (
    <>
      <Navbar variant="dark" />
      <main>
        {/* hero: badge + headline left, intro copy right, banner below */}
        <section className="page-sec container-x flex flex-col gap-8 min-[639.98px]:gap-12">
          <div className="flex flex-col items-start gap-4 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between min-[900px]:gap-8">
            <div className="flex w-full min-w-0 flex-col gap-2" style={{ maxWidth: 560 }}>
              <Eyebrow>{ABOUT.badge}</Eyebrow>
              <h1 className="t-h1p">
                <Words text={ABOUT.title} />
              </h1>
            </div>
            <p className="t-body w-full min-w-0 text-left min-[900px]:text-right" style={{ maxWidth: 706 }}>
              {ABOUT.sub}
            </p>
          </div>
          <img
            src={ABOUT.banner}
            alt=""
            className="h-[220px] w-full rounded-lg object-cover min-[639.98px]:h-[320px] min-[1100px]:h-[420px]"
          />
        </section>

        {/* our story: badge column, two paragraphs, square photo */}
        <section className="section-py container-x">
          {/* the three measured columns (160 + 650 + 360 plus two 48px gaps) only
            fit once the 1330px container can hold them */}
          <div className="flex flex-col gap-8 min-[1340px]:flex-row min-[1340px]:gap-12">
            <div className="w-full shrink-0 min-[1340px]:w-[160px]">
              <Eyebrow>{ABOUT.story.badge}</Eyebrow>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-4 min-[1340px]:w-[650px] min-[1340px]:shrink-0">
              {ABOUT.story.paragraphs.map((t) => (
                <h4 key={t} className="t-h4 text-ink">
                  {t}
                </h4>
              ))}
            </div>
            <div className="relative h-[280px] w-full shrink-0 min-[1340px]:h-auto min-[1340px]:w-[360px] min-[1340px]:self-stretch">
              <img
                src={ABOUT.story.image}
                alt=""
                className="absolute inset-0 h-full w-full rounded-lg object-cover"
              />
            </div>
          </div>
        </section>

        {/* why API touch: header + banner holding three mist cards */}
        <section className="section-py container-x flex flex-col gap-8 min-[639.98px]:gap-12">
          <SectionHead
            badge={ABOUT.why.badge}
            title={ABOUT.why.title}
            leftW={420}
            rightW={846}
          >
            <HeadCopy>{ABOUT.why.body}</HeadCopy>
            <a href="/why-apitouch" className="t-link text-ink underline underline-offset-4">
              All reasons to travel with us
            </a>
          </SectionHead>
          <div className="relative h-auto overflow-hidden rounded-lg p-4 pt-[180px] min-[639.98px]:p-6 min-[639.98px]:pt-[200px] min-[1100px]:h-[444px] min-[1100px]:p-[24px] min-[1100px]:pt-[240px]">
            <img
              src={ABOUT.why.banner}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="relative z-10 flex flex-col gap-4 min-[900px]:flex-row min-[900px]:gap-6">
              {ABOUT.why.cards.map((c) => (
                <div
                  key={c.title}
                  className="flex min-h-[160px] flex-1 flex-col justify-end gap-1 rounded-lg bg-mist p-4"
                >
                  <h4 className="t-h4 text-ink">{c.title}</h4>
                  <p className="t-body">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* our guides: 2 x 3 photo cards */}
        <section className="section-py container-x flex flex-col gap-8 min-[639.98px]:gap-12">
          <SectionHead
            badge={ABOUT.guides.badge}
            title={ABOUT.guides.title}
            leftW={560}
            rightW={706}
          >
            <HeadCopy>{ABOUT.guides.body}</HeadCopy>
          </SectionHead>
          <div className="grid grid-cols-1 gap-6 min-[639.98px]:grid-cols-2 min-[1100px]:grid-cols-3">
            {ABOUT.guides.people.map((g) => (
              <div key={g.name} className="relative h-[420px] overflow-hidden rounded-lg min-[1100px]:h-[501px]">
                <img src={g.image} alt={g.name} className="absolute inset-0 h-full w-full object-cover" />
                <ImgBlur />
                <div className="absolute inset-0 z-10 flex flex-col justify-end gap-1 p-4">
                  <Eyebrow className="capitalize" color="var(--color-mist)">
                    {g.role}
                  </Eyebrow>
                  <h4 className="t-h4 text-mist">{g.name}</h4>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Faq />
      </main>
      <Footer />
    </>
  );
}
