import { useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import Faq from "../components/Faq.jsx";
import Footer from "../components/Footer.jsx";
import { Eyebrow, Words } from "../components/ui.jsx";
import { Reveal } from "../anim.jsx";
import { stagger } from "../motion.js";
import { GALLERY } from "../data/pages.js";
import { PAGES } from "../data/content.js";
import { GALLERY_PATH, useStrapiList, hasContent, STRAPI_STATUS } from "../lib/strapiData.jsx";
import { galleryPageToRecord } from "../lib/catalog.js";
import { GallerySkeleton } from "../components/skeletons.jsx";

export default function GalleryPage() {
  const page = PAGES["/gallery"];

  // The CMS gallery, in the same shape the hardcoded GALLERY already has. While
  // the request is in flight a three-column skeleton stands in; on a failure, or
  // when the entry holds no photos, this is null and the hardcoded module below
  // is used instead.
  const { items, status } = useStrapiList(GALLERY_PATH);
  const gallery = galleryPageToRecord(hasContent(items) ? items[0] : null) ?? GALLERY;

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
          {/* the header row carries the CMS entry's own badge, title and sub, so
              it waits with the photos rather than showing the hardcoded copy */}
          {status === STRAPI_STATUS.LOADING ? (
            <GallerySkeleton />
          ) : (
            <>
              <div className="flex flex-col items-start gap-4 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between min-[900px]:gap-8">
                <div className="flex w-full min-w-0 flex-col gap-2" style={{ maxWidth: 560 }}>
                  <Eyebrow>{gallery.badge}</Eyebrow>
                  <h1 className="t-h1p">
                    <Words text={gallery.title} />
                  </h1>
                </div>
                <p className="t-body w-full min-w-0 text-left min-[900px]:text-right" style={{ maxWidth: 706 }}>
                  {gallery.sub}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 min-[639.98px]:grid-cols-2 min-[1100px]:grid-cols-3">
                {gallery.columns.map((col, ci) => (
                  <div key={ci} className="flex flex-col gap-6">
                    {col.map((img, i) => (
                      <Reveal
                        as="img"
                        key={img.src}
                        delay={stagger(i) + ci * 60}
                        src={img.src}
                        alt={img.alt ?? ""}
                        loading="lazy"
                        className="w-full rounded-lg object-cover"
                        style={{ aspectRatio: `${img.w} / ${img.h}` }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <Faq />
      </main>
      <Footer />
    </>
  );
}
