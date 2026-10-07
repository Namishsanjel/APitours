import { JOURNAL_SECTION, JOURNAL } from "../data/content.js";
import { SectionHead, HeadCopy } from "./ui.jsx";

export default function Journal() {
  return (
    <section id="journal" className="section-py">
      <div className="container-x">
        <SectionHead badge={JOURNAL_SECTION.badge} title={JOURNAL_SECTION.title}>
          <HeadCopy>{JOURNAL_SECTION.body}</HeadCopy>
          <a href={JOURNAL_SECTION.ctaHref} className="btn btn-dark w-[146px]">
            {JOURNAL_SECTION.cta}
          </a>
        </SectionHead>

        <div className="mt-8 grid grid-cols-1 gap-4 min-[639.98px]:mt-12 min-[900px]:grid-cols-3">
          {JOURNAL.map((post) => (
            <a
              key={post.href}
              href={post.href}
              className="relative block h-[380px] overflow-hidden rounded-lg min-[639.98px]:h-[480px]"
            >
              <img src={post.image} alt={post.alt} className="absolute inset-0 h-full w-full object-cover" />
              <div className="grad-card absolute inset-0" />
              <div className="absolute inset-0 flex flex-col justify-between p-5">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((t) => (
                    <span key={t} className="chip">
                      {t}
                    </span>
                  ))}
                </div>
                <h3 className="t-h3l text-mist">{post.title}</h3>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
