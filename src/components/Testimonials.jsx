import { TESTIMONIAL_SECTION, FEATURED_QUOTE, REVIEWS, IMG } from "../data/content.js";
import { SectionHead, HeadCopy } from "./ui.jsx";
import Icon from "../data/Icon.jsx";
import { useStrapiList, hasContent, imageOf } from "../lib/strapiData.jsx";

function Location({ children, color }) {
  return (
    <div className="mt-[2px] flex items-center gap-1">
      <Icon id="4159562592" size={16} style={{ color }} />
      <span className="t-eyebrow" style={{ color }}>
        {children}
      </span>
    </div>
  );
}

/** Star row for the rating field. Renders nothing when there is no rating. */
function Stars({ rating }) {
  const score = Number(rating);
  if (!Number.isFinite(score) || score <= 0) return null;

  return (
    <div className="flex items-center gap-[3px] text-primary" aria-label={`Rated ${score} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="15"
          height="15"
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={i < Math.round(score) ? "opacity-100" : "opacity-25"}
        >
          <path
            d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.6z"
            fill="currentColor"
          />
        </svg>
      ))}
    </div>
  );
}

/** Name + role/company line, shared by both testimonial shapes. */
function Attribution({ name, meta, color }) {
  return (
    <div className="min-w-0">
      <p className="font-body text-[16px] leading-[22.4px] text-ink">{name}</p>
      {meta ? <Location color={color}>{meta}</Location> : null}
    </div>
  );
}

/**
 * Testimonials from Strapi, shaped the way the section already reads:
 * the entry flagged `featured` fills the big quote over the photo, the next
 * two fill the written cards. With no CMS content — or none reachable — the
 * original featured quote and two reviews are used unchanged.
 */
export default function Testimonials() {
  const { items } = useStrapiList("testimonials?populate=avatar&sort=order:asc");
  const fromStrapi = hasContent(items);

  const featured = fromStrapi ? items.find((t) => t.featured) ?? items[0] : null;
  const written = fromStrapi ? items.filter((t) => t !== featured).slice(0, 2) : [];

  const big = fromStrapi
    ? {
        quote: featured.quote,
        name: featured.authorName,
        meta: featured.company || featured.authorRole,
        rating: featured.rating,
        // the featured card's photo is decorative; the testimonial entry has
        // no image field, so the section keeps its existing backdrop
        image: IMG.testimonial,
      }
    : { quote: FEATURED_QUOTE.quote, name: FEATURED_QUOTE.name, meta: FEATURED_QUOTE.trip, image: FEATURED_QUOTE.image };

  const cards = fromStrapi
    ? written.map((t) => ({
        key: t.documentId ?? t.id ?? t.authorName,
        title: t.quote,
        body: "",
        name: t.authorName,
        meta: [t.authorRole, t.company].filter(Boolean).join(" · "),
        rating: t.rating,
        avatar: imageOf(t.avatar, t.authorName),
      }))
    : REVIEWS.map((r) => ({
        key: r.name,
        title: r.title,
        body: r.body,
        name: r.name,
        meta: r.trip,
        rating: null,
        avatar: { src: r.avatar, alt: r.name },
      }));

  return (
    <section className="section-py">
      <div className="container-x">
        <SectionHead badge={TESTIMONIAL_SECTION.badge} title={TESTIMONIAL_SECTION.title}>
          <HeadCopy>{TESTIMONIAL_SECTION.body}</HeadCopy>
          <a href="/reviews" className="t-link text-ink underline underline-offset-4">
            Read all reviews
          </a>
        </SectionHead>

        <div className="mt-8 flex flex-col gap-6 min-[639.98px]:mt-12 min-[1100px]:flex-row">
          {/* featured quote over photo */}
          <div className="relative h-[420px] w-full shrink-0 overflow-hidden rounded-lg min-[639.98px]:h-[495px] min-[1100px]:w-[480px]">
            <img src={big.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="grad-quote absolute inset-0" />
            <div className="absolute inset-0 flex flex-col justify-end px-6 pt-6 pb-[27px]">
              <Stars rating={big.rating} />
              <h4 className={`t-h4 text-mist ${big.rating ? "mt-3" : ""}`}>{big.quote}</h4>
              <p className="mt-4 font-body text-[16px] leading-[22.4px] text-cream">
                {big.name}
              </p>
              {big.meta ? <Location color="var(--color-mist)">{big.meta}</Location> : null}
            </div>
          </div>

          {/* two written reviews */}
          <div className="flex w-full min-w-0 flex-col gap-6" style={{ maxWidth: 762 }}>
            {cards.map((r) => (
              <div key={r.key} className="h-auto min-h-[236px] rounded-lg bg-mist p-6">
                <Stars rating={r.rating} />
                <h4 className={`t-h4 ${r.rating ? "mt-3" : ""}`}>{r.title}</h4>
                {r.body ? <p className="t-body mt-6">{r.body}</p> : null}
                <div className="mt-6 flex gap-[10px]">
                  {r.avatar ? (
                    <img src={r.avatar.src} alt={r.avatar.alt} loading="lazy" className="h-[41px] w-[41px] shrink-0 rounded-md object-cover" />
                  ) : null}
                  <Attribution name={r.name} meta={r.meta} color="var(--color-smoke)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}