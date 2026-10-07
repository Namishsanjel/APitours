import { useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import Faq from "../components/Faq.jsx";
import Footer from "../components/Footer.jsx";
import { Eyebrow, Words } from "../components/ui.jsx";
import { Reveal } from "../anim.jsx";
import { stagger } from "../motion.js";
import { GALLERY } from "../data/pages.js";
import { PAGES } from "../data/content.js";

export default function GalleryPage() {
  const page = PAGES["/gallery"];

  useEffect(() => {
    document.title = page.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", page.description);
  }, [page]);

  return (
    <>
      <Navbar variant="dark" />
      <main>
        {/* hero + masonry grid share one section (measured: pt120 / gap48 / pb60) */}
        <section className="page-sec container-x flex flex-col gap-8 min-[639.98px]:gap-12">
          <div className="flex flex-col items-start gap-4 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between min-[900px]:gap-8">
            <div className="flex w-full min-w-0 flex-col gap-2" style={{ maxWidth: 560 }}>
              <Eyebrow>{GALLERY.badge}</Eyebrow>
              <h1 className="t-h1p">
                <Words text={GALLERY.title} />
              </h1>
            </div>
            <p className="t-body w-full min-w-0 text-left min-[900px]:text-right" style={{ maxWidth: 706 }}>
              {GALLERY.sub}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 min-[639.98px]:grid-cols-2 min-[1100px]:grid-cols-3">
            {GALLERY.columns.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-6">
                {col.map((img, i) => (
                  <Reveal
                    as="img"
                    key={img.src}
                    delay={stagger(i) + ci * 60}
                    src={img.src}
                    alt=""
                    loading="lazy"
                    className="w-full rounded-lg object-cover"
                    style={{ aspectRatio: `${img.w} / ${img.h}` }}
                  />
                ))}
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
