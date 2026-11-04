import { useEffect, useState } from "react";
import PageShell from "../components/PageShell.jsx";
import { PageHeader } from "../components/ui.jsx";
import { LEGAL } from "../data/legal.js";
import { CANCELLATION } from "../data/newPages.js";

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function LegalPage({ doc }) {
  const heads = doc.sections.filter((s) => s.heading);
  const [active, setActive] = useState(0);

  useEffect(() => {
    document.title = `${doc.title} - API Touch`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", `${doc.title} — API Touch.`);
  }, [doc]);

  useEffect(() => {
    const nodes = heads.map((s) => document.getElementById(slugify(s.heading))).filter(Boolean);
    if (!nodes.length) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const i = heads.findIndex((s) => slugify(s.heading) === visible[0].target.id);
          if (i >= 0) setActive(i);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [heads, doc]);

  return (
    <PageShell faq={false}>
      <section className="page-sec container-x flex flex-col gap-8 min-[639.98px]:gap-12">
        <PageHeader badge="Legal Page" title={doc.title} />

        <div className="flex flex-col items-start gap-8 min-[1100px]:flex-row min-[1100px]:items-start min-[1100px]:gap-12">
          {/* table of contents */}
          <nav className="flex w-full shrink-0 flex-col gap-2 min-[1100px]:w-[300px]">
            <p className="t-h5 text-ink">Table of contents</p>
            <div className="flex flex-col gap-1">
              {heads.map((s, i) => (
                <a
                  key={s.heading}
                  href={`#${slugify(s.heading)}`}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2 ${
                    active === i ? "bg-mist" : ""
                  }`}
                >
                  <span className="t-eyebrow text-smoke">{String(i + 1).padStart(2, "0")}</span>
                  <span className="t-link text-ink">{s.heading}</span>
                </a>
              ))}
            </div>
          </nav>

          {/* document body */}
          <div className="flex w-full min-w-0 flex-col gap-10" style={{ maxWidth: 866 }}>
            {doc.sections.map((s) =>
              s.heading ? (
                <div key={s.heading} id={slugify(s.heading)} className="flex scroll-mt-28 flex-col gap-3">
                  <h2 className="t-h3s text-[clamp(21px,2.4vw,28px)] leading-[1.2] text-ink">{s.heading}</h2>
                  {s.paragraphs.map((p) => (
                    <p key={p} className="t-body">
                      {p}
                    </p>
                  ))}
                </div>
              ) : (
                <div key="intro" className="flex flex-col gap-3">
                  {s.paragraphs.map((p) => (
                    <p key={p} className="t-h5 text-ink">
                      {p}
                    </p>
                  ))}
                </div>
              ),
            )}

            {doc.slug === "terms-of-service" ? (
              <div className="flex flex-col items-start gap-4 rounded-lg bg-mist p-6 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between min-[900px]:gap-6">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="t-h5 text-ink">Cancellation &amp; Refund Policy</p>
                  <p className="t-body">The windows, percentages and date-change rules in one place.</p>
                </div>
                <a href={`/${CANCELLATION.slug}`} className="btn btn-dark w-[170px]">
                  read the policy
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

export function TermsPage() {
  return <LegalPage doc={LEGAL.terms} />;
}

export function PrivacyPage() {
  return <LegalPage doc={LEGAL.privacy} />;
}

export function CancellationPage() {
  return <LegalPage doc={CANCELLATION} />;
}
