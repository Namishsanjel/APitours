import { FOOTER, IMG } from "../data/content.js";

export default function Footer() {
  const { title, body, cta, ctaHref, background, backgroundAlt, subline, copyright, columns } = FOOTER;

  return (
    <footer className="relative overflow-hidden bg-cream">
      <img src={background} alt={backgroundAlt} className="footer-bg-mask absolute inset-0 h-full w-full object-cover" />
      <div className="footer-bg-mask grad-footer absolute inset-0" />

      <div className="container-x relative">
        {/* closing call to action */}
        <div className="pt-[140px] text-center min-[639.98px]:pt-[200px] min-[1100px]:pt-[300px]">
          <h2 className="t-h2 text-mist">
            {title.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
          <p className="mx-auto mt-4 w-full max-w-[420px] font-body text-[16px] leading-[22.4px] text-mist [text-wrap:balance] [will-change:transform]">
            {body}
          </p>
          <a href={ctaHref} className="btn btn-cream mt-4 w-[129px]">
            {cta}
          </a>
        </div>

        {/* company info + sitemaps */}
        <div className="mt-16 flex flex-col gap-10 min-[639.98px]:mt-20 min-[900px]:flex-row min-[900px]:justify-between min-[900px]:gap-12 min-[1100px]:mt-[120px]">
          <div className="w-full min-w-0" style={{ maxWidth: 520 }}>
            <img
              src={IMG.logo}
              alt="API Touch"
              className="block h-[46px] w-[92px] object-contain max-[639.98px]:h-[40px] max-[639.98px]:w-[80px]"
            />
            <p className="t-body mt-4 text-sage [will-change:transform]">{subline}</p>
            <p className="mt-4 font-body text-[16px] leading-[16px] text-mist">{copyright}</p>
          </div>

          {/* 4 columns x 160px + 3 x 16px gap, wrapping to two then one */}
          <div className="flex w-full min-w-0 flex-wrap gap-x-4 gap-y-8 min-[639.98px]:gap-y-12" style={{ maxWidth: 688 }}>
            {columns.map((col) => (
              <div key={col.label} className="min-w-[140px] flex-1 basis-[140px]">
                <p className="t-eyebrow text-mist">{col.label}</p>
                <div className="mt-4 flex flex-col gap-4">
                  {col.links.map((l) =>
                    /* no href yet — kept in the tab order and announced as a
                       disabled link, but it navigates nowhere */
                    l.href ? (
                      <a key={l.label} href={l.href} className="t-link text-mist">
                        {l.label}
                      </a>
                    ) : (
                      <a
                        key={l.label}
                        role="link"
                        aria-disabled="true"
                        tabIndex={0}
                        title={`${l.label} — coming soon`}
                        className="t-link text-mist/60"
                      >
                        {l.label}
                      </a>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* oversized brand mark */}
        <div className="logomark-mask mt-10 min-[639.98px]:mt-[60px]">
          <img src={IMG.logo} alt="" className="mx-auto block h-[100px] w-[200px] object-contain min-[639.98px]:h-[150px] min-[639.98px]:w-[300px]" />
          <div className="h-0 min-[639.98px]:h-[133.75px]" />
        </div>
      </div>
    </footer>
  );
}
