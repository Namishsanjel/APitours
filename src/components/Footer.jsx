import { FOOTER } from "../data/content.js";
import { useGlobalState, imageOf, STRAPI_STATUS } from "../lib/strapiData.jsx";
import { FooterBrandSkeleton, FooterLogomarkSkeleton } from "./skeletons.jsx";
import Logo from "./Logo.jsx";
import { resolveLogo, SITE_NAME, LOGO_SIZES, LOGO_CLASSES } from "../lib/brand.js";

/** "linkedin" / "LinkedIn" -> "LinkedIn", for a social column label. */
function platformLabel(platform) {
  const text = String(platform ?? "").trim();
  if (!text) return "Social";
  return text.length <= 3 ? text.toUpperCase() : text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Read once at module load rather than during render, so the year cannot change
// under a component that happens to be holding on to this text.
const YEAR = new Date().getFullYear();

/**
 * The footer's brand mark: the CMS logo when the global entry carries one, the
 * site's text name when it does not.
 *
 * Declared outside the component so React is not handed a brand new component
 * type on every render, which would unmount and remount the node each time.
 */
function BrandMark({ logo, siteName, height, className = "" }) {
  return <Logo src={logo.src} alt={logo.alt || siteName} height={height} className={className} />;
}

export default function Footer() {
  const { title, body, cta, ctaHref, background, backgroundAlt, subline, copyright, columns } = FOOTER;
  const { data: global, status: globalStatus } = useGlobalState();

  // The logo, the closing line and the contact details all come out of the same
  // global entry, so while it is in flight the whole brand column is held as a
  // neutral placeholder. The copyright line is the site's own and is always
  // shown.
  const loading = globalStatus === STRAPI_STATUS.LOADING;
  /* An error is not an error state here. The footer is chrome, not content: it
     is the one place a visitor must still be able to reach every page, so it
     degrades to the site's static half rather than showing a message. With no
     global entry the logo falls back to the bundled /logo.png, the closing line
     and the contact block drop out, and the static link columns and the
     copyright stay exactly where they are. */
  const degraded = globalStatus === STRAPI_STATUS.ERROR || globalStatus === STRAPI_STATUS.EMPTY;

  const siteName = global?.siteName || SITE_NAME;
  // Falls back to the bundled /logo.png when the CMS entry has no logo.
  const logo = resolveLogo(imageOf(global?.logo, siteName), siteName);

  // footerText is the closing line of the footer, so it takes the subline's
  // place; the hardcoded one stays until Strapi has something to say.
  const closingLine = global?.footerText || subline;
  const copyrightLine = global?.siteName ? `© ${YEAR} ${global.siteName}` : copyright;

  const contacts = degraded
    ? []
    : [
        global?.contactEmail ? { label: "Email", value: global.contactEmail, href: `mailto:${global.contactEmail}` } : null,
        global?.contactPhone ? { label: "Phone", value: global.contactPhone, href: `tel:${String(global.contactPhone).replace(/[^+\d]/g, "")}` } : null,
        global?.address ? { label: "Address", value: global.address, href: null } : null,
      ].filter(Boolean);

  // The Social column keeps its place in the grid; only its links come from
  // Strapi. Without them the original "coming soon" placeholders stay.
  const socials = !degraded && Array.isArray(global?.socialLinks)
    ? global.socialLinks.filter((l) => l && l.url && l.platform)
    : [];
  const linkColumns = socials.length
    ? columns.map((col) =>
        col.label === "Social"
          ? { label: col.label, links: socials.map((l) => ({ label: platformLabel(l.platform), href: l.url })) }
          : col
      )
    : columns;

  /* The mark sits in a fixed-height box so the column does not change height. */
  const brandMarkClass = `block ${LOGO_CLASSES.footer}`;

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
            {loading ? (
              <FooterBrandSkeleton />
            ) : (
              <>
                <BrandMark logo={logo} siteName={siteName} height={LOGO_SIZES.footer} className={brandMarkClass} />
                {!degraded ? <p className="t-body mt-4 text-sage [will-change:transform]">{closingLine}</p> : null}

                {/* contact details, only once Strapi's global entry carries them */}
                {contacts.length ? (
                  <div className="mt-6 flex flex-col gap-3">
                    {contacts.map((c) => (
                      <div key={c.label} className="flex flex-col gap-1">
                        <p className="t-eyebrow text-mist/70">{c.label}</p>
                        {c.href ? (
                          <a href={c.href} className="t-link w-fit break-words text-sage">
                            {c.value}
                          </a>
                        ) : (
                          <p className="t-body text-sage">{c.value}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            )}

            <p className="mt-6 font-body text-[16px] leading-[16px] text-mist">{copyrightLine}</p>
          </div>

          {/* 4 columns x 160px + 3 x 16px gap, wrapping to two then one */}
          <div className="flex w-full min-w-0 flex-wrap gap-x-4 gap-y-8 min-[639.98px]:gap-y-12" style={{ maxWidth: 688 }}>
            {linkColumns.map((col) => (
              <div key={col.label} className="min-w-[140px] flex-1 basis-[140px]">
                <p className="t-eyebrow text-mist">{col.label}</p>
                <div className="mt-4 flex flex-col gap-4">
                  {col.links.map((l) =>
                    /* no href yet — kept in the tab order and announced as a
                       disabled link, but it navigates nowhere */
                    l.href ? (
                      <a
                        key={l.label}
                        href={l.href}
                        {...(l.href.startsWith("http")
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        className="t-link text-mist"
                      >
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
          {loading ? (
            <FooterLogomarkSkeleton />
          ) : (
            <Logo
              src={logo.src}
              alt=""
              height={LOGO_SIZES.footerMarkDesktop}
              className={`mx-auto block ${LOGO_CLASSES.footerMark}`}
            />
          )}
          <div className="h-0 min-[639.98px]:h-[133.75px]" />
        </div>
      </div>
    </footer>
  );
}