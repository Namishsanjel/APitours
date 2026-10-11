import { CONTACT, PAGES, SITE_URL } from "../data/content.js";

function contactValue(label) {
  return CONTACT.info.find((item) => item.label === label)?.value ?? null;
}

const phone = contactValue("Phone");
const location = contactValue("Location"); // e.g. "Aspen, Colorado, USA"

function locationToAddress() {
  if (!location) return null;
  const [city, region, country] = location.split(",").map((s) => s.trim());
  const address = { "@type": "PostalAddress" };
  if (city) address.addressLocality = city;
  if (region) address.addressRegion = region;
  if (country) address.addressCountry = country === "USA" ? "US" : country;
  return address;
}

/**
 * Site-wide Organization schema. Every value comes from existing project
 * data (content.js) — nothing is invented. Fields whose source value is
 * missing or unusable (e.g. the malformed contact email in CONTACT) are
 * omitted rather than filled in.
 */
export function organizationJsonLd() {
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "API Touch",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: PAGES["/"].description,
  };
  const address = locationToAddress();
  if (address) org.address = address;
  if (phone) org.telephone = phone;
  return org;
}

/**
 * Site-wide WebSite schema.
 */
export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "API Touch",
    url: SITE_URL,
    description: PAGES["/"].description,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

function absoluteUrl(path) {
  if (!path) return null;
  try {
    return new URL(path, SITE_URL).href;
  } catch {
    return null;
  }
}

const crumb = (name, path) => ({ name, path });

/**
 * BreadcrumbList for pages that really sit inside a hierarchy.
 * Items are ordered top-level first; positions are assigned from 1.
 * Names mirror the actual pages in src/App.jsx (Home, /tours, /destinations, /blog).
 */
export function breadcrumbJsonLd(items) {
  const list = (items || []).filter((i) => i && i.name && i.path);
  if (list.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: list.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function tourBreadcrumbs(title, slug) {
  if (!title || !slug) return null;
  return [crumb("Home", "/"), crumb("Tours", "/tours"), crumb(title, `/tours/${slug}`)];
}

export function destinationBreadcrumbs(name, slug) {
  if (!name || !slug) return null;
  return [
    crumb("Home", "/"),
    crumb("Destinations", "/destinations"),
    crumb(name, `/destinations/${slug}`),
  ];
}

export function blogBreadcrumbs(title, slug) {
  if (!title || !slug) return null;
  return [crumb("Home", "/"), crumb("Blog", "/blog"), crumb(title, `/blog/${slug}`)];
}

/**
 * Normalises the date the article data already carries (e.g. "May 12, 2026"
 * or "2026-05-12") to YYYY-MM-DD. Local date parts are used on purpose so
 * the day never shifts when the build machine is in another timezone.
 */
function toIsoDate(value) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * BlogPosting for an individual blog article.
 * Uses only values the article data actually carries: title, intro, image
 * (taken from the blog index card for that slug), slug and author.
 * No author, date, image or publication history is invented.
 */
export function articleJsonLd(post, options = {}) {
  if (!post || !post.slug || !post.title) return null;

  const url = `${SITE_URL}/blog/${post.slug}`;
  const out = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: post.title,
    url,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en",
  };

  if (post.intro) out.description = post.intro;

  const image = absoluteUrl(options.image || post.image);
  if (image) out.image = image;

  const datePublished = toIsoDate(post.date);
  if (datePublished) out.datePublished = datePublished;

  if (post.author && post.author.name) {
    out.author = { "@type": "Person", name: post.author.name };
    if (post.author.role) out.author.jobTitle = post.author.role;
  }

  return out;
}

/**
 * Schema.org TouristTrip template for a tour.
 *
 * Only fields that are actually present and safely mappable are emitted.
 * The CURRENT tour data (TOUR_DETAILS / HIKES_ALL) only supplies:
 * title, overview, image (relative path), slug, itinerary. Price is a
 * display string, currency/duration/group size live in the untyped `chips`
 * array, and start/end are free text — none of those are mapped yet.
 *
 * The generator accepts FUTURE structured data (price: { amount, currency,
 * unit }, duration: { days }, groupSize, start/end as { city, country })
 * and emits the corresponding Schema.org fields only when they exist.
 *
 * `options.image` overrides the image path for callers that hold it
 * separately from the tour record.
 */
export function tourJsonLd(tour, options = {}) {
  if (!tour) return null;

  const out = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
  };

  if (tour.title) out.name = tour.title;

  // Complete existing overview as-is (paragraphs separated by "\n\n").
  if (tour.overview) out.description = tour.overview;

  const image = absoluteUrl(options.image || tour.image);
  if (image) out.image = image;

  if (tour.slug) {
    const url = `${SITE_URL}/tours/${tour.slug}`;
    out["@id"] = `${url}#tour`;
    out.url = url;
    out.mainEntityOfPage = { "@type": "WebPage", "@id": url };
    out.isPartOf = { "@id": `${SITE_URL}/#website` };
  }

  out.provider = { "@id": `${SITE_URL}/#organization` };

  // Itinerary: reuse the existing day/title/body text verbatim.
  if (Array.isArray(tour.itinerary) && tour.itinerary.length > 0) {
    out.itinerary = {
      "@type": "ItemList",
      itemListElement: tour.itinerary.map((step, i) => {
        const item = {
          "@type": "ListItem",
          position: i + 1,
        };
        item.name = step?.title
          ? `${step.day} — ${step.title}`
          : step?.day;
        if (step?.body) item.description = step.body;
        return item;
      }),
    };
  }

  // --- Future structured fields (emitted only when supplied) ---

  if (tour.price && typeof tour.price.amount === "number" && tour.price.currency) {
    out.offers = {
      "@type": "Offer",
      price: tour.price.amount,
      priceCurrency: tour.price.currency,
    };
  }

  if (tour.duration && Number.isFinite(tour.duration.days)) {
    out.duration = `P${tour.duration.days}D`;
  }

  // groupSize / structured start-end are accepted by the template for
  // forward compatibility but deliberately not emitted yet: the current
  // data holds them only as display strings, which must not be parsed.

  return out;
}
