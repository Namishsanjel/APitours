import { useEffect } from "react";
import PageShell from "../components/PageShell.jsx";
import { PageHeader } from "../components/ui.jsx";
import { PAGES } from "../data/content.js";

// The two documents in legal/ are served from public/legal/ under URL-safe names.
const DOCUMENTS = [
  {
    title: "API Touch PAN",
    href: "/legal/api-touch-pan.pdf",
    download: "api-touch-pan.pdf",
  },
  {
    title: "API Touch Tours & Travels (Gharelu)",
    href: "/legal/api-touch-tours-and-travels-gharelu.pdf",
    download: "api-touch-tours-and-travels-gharelu.pdf",
  },
];

export default function LegalDocsPage() {
  const page = PAGES["/legal"];

  useEffect(() => {
    document.title = page.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", page.description);
  }, [page]);

  return (
    <PageShell faq={false}>
      <section className="page-sec container-x flex flex-col gap-8 min-[639.98px]:gap-12">
        <PageHeader
          badge="Legal"
          title="Legal Documents"
          sub="Official API Touch documents, available to view in a new tab or download as a PDF."
        />

        <div className="grid grid-cols-1 gap-6 min-[900px]:grid-cols-2">
          {DOCUMENTS.map((doc) => (
            <div key={doc.href} className="flex flex-col gap-6 rounded-lg bg-mist p-6">
              <div className="flex flex-col gap-1">
                <p className="t-eyebrow text-smoke">PDF document</p>
                <h2 className="t-h4 text-ink">{doc.title}</h2>
              </div>
              <div className="mt-auto flex flex-wrap gap-3">
                <a
                  href={doc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-dark w-[120px]"
                >
                  View
                </a>
                <a href={doc.href} download={doc.download} className="btn btn-cream w-[150px]">
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
