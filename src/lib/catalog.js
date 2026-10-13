import { bestImage, blocksToText, mediaUrl } from "./strapi.js";
import { HIKES_ALL } from "../data/hikes.js";
import { TOUR_DETAILS } from "../data/tourDetails.js";
import { DESTINATIONS_ALL } from "../data/newPages.js";
import { GALLERY } from "../data/pages.js";

/**
 * Turns Strapi tours and destinations into the shapes the existing components
 * already read, so the pages barely have to change.
 *
 * Every function here falls back to the hardcoded data module when Strapi has
 * nothing to give: `items` is null while loading, on a request failure, and
 * while the collection is empty. Nothing in the site's data files is removed —
 * they remain the source of truth whenever the CMS is silent.
 */

/** Strapi stores the difficulty lowercase; the site shows it capitalised. */
const DIFFICULTY_LABEL = { easy: "Easy", moderate: "Moderate", tough: "Tough" };

/** Enumeration values back to the labels DestinationsPage groups by. */
const CONTINENT_LABEL = {
  asia: "Asia",
  europe: "Europe",
  africa: "Africa",
  oceania: "Oceania",
  south_america: "South America",
};

/**
 * Price as the site writes it: "$890 /Per Person", "$1.5K /Per Person".
 *
 * The ten existing strings use the K suffix only where it reads cleanly to one
 * decimal (1.5K, 1.3K) and plain dollars below 1000, so that is the rule here.
 * An amount that does not divide cleanly keeps its full digits.
 */
export function formatPrice(amount, per) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "";

  let text = String(amount);
  if (amount >= 1000) {
    const thousands = amount / 1000;
    if (Number.isFinite(thousands) && Math.round(thousands * 10) / 10 === thousands) {
      text = `${thousands}K`;
    }
  }

  return per ? `$${text} /${per}` : `$${text}`;
}

/** "53.5" stays 53.5, 38 stays 38 — Number#toString already does this. */
const km = (value) => (value == null ? null : `${value} Km`);
const days = (value) => (value == null ? null : `${value} Days`);

/** Difficulty chip, or null when the entry has none. */
function difficultyChip(difficulty) {
  return DIFFICULTY_LABEL[difficulty] ?? null;
}

/** Drops the empty slots so a chip row never carries a "null" chip. */
function chips(...values) {
  return values.filter(Boolean);
}

/** The hardcoded listing record for a slug, used to fill gaps the CMS leaves. */
function fallbackListing(slug) {
  return HIKES_ALL.find((h) => h.slug === slug) || null;
}

/**
 * A Strapi tour as the two objects the site consumes today:
 *   - listing fields (slug, chips, title, href, image, alt) at the top level,
 *     the shape HikesPage's cards, TourCard and the nav menus read;
 *   - detail fields (price, detailChips, start, end, overview, highlights,
 *     itinerary, inclusions, exclusions) beside them.
 *
 * Anything the tour's own image is missing falls back to the photo the site
 * already ships for that slug, so a card never renders a broken <img>.
 */
export function tourToRecord(entry) {
  const listing = fallbackListing(entry.slug);
  const detail = TOUR_DETAILS[entry.slug];

  const image =
    bestImage(entry.coverImage, entry.title) ??
    (listing ? { src: listing.image, alt: listing.alt } : null);

  return {
    // --- HIKES_ALL shape ---
    slug: entry.slug,
    title: entry.title,
    href: `/tours/${entry.slug}`,
    chips: chips(difficultyChip(entry.difficulty), days(entry.durationDays)),
    image: image?.src ?? null,
    alt: image?.alt || entry.title,

    // --- TOUR_DETAILS shape ---
    price: formatPrice(entry.priceAmount, entry.pricePer),
    detailChips: chips(
      difficultyChip(entry.difficulty),
      entry.groupSize || null,
      days(entry.durationDays),
      km(entry.distanceKm),
    ),
    start: entry.startLocation || "",
    end: entry.endLocation || "",
    overview: entry.overview || "",
    highlights: [],
    itinerary: (entry.itinerary || []).map((day) => ({
      day: day.day,
      title: day.title || "",
      body: day.body,
    })),
    inclusions: (entry.inclusions || []).map((i) => i.text).filter(Boolean),
    exclusions: (entry.exclusions || []).map((i) => i.text).filter(Boolean),

    // --- carried through for the pages that need more than a card ---
    documentId: entry.documentId,
    travelType: entry.travelType || null,
    featured: entry.featured === true,
    order: entry.order ?? null,
    priceAmount: typeof entry.priceAmount === "number" ? entry.priceAmount : null,
    gallery: (entry.gallery || []).map((m) => bestImage(m, entry.title)).filter(Boolean),
    destination: entry.destination || null,
    /** True when the CMS record is missing something the hardcoded one had. */
    detailFallback: !detail,
  };
}

/**
 * Strapi tours as listing records, or the hardcoded HIKES_ALL when there are
 * none to use.
 */
export function tourListings(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return HIKES_ALL;
  return entries.map(tourToRecord);
}

/** One tour by slug, from either source. */
export function tourBySlug(entries, slug) {
  return tourListings(entries).find((t) => t.slug === slug) ?? null;
}

/**
 * The listing view of a record, with the detail chip row put back under `chips`
 * for the one component (the detail hero) that shows all four.
 */
export function asTourDetail(record) {
  return { ...record, chips: record.detailChips };
}

/**
 * Featured tours in `order`, capped — the four the homepage section shows.
 * An empty array means "no CMS data", and the caller keeps its own fallback
 * rather than being handed the first four rows of an unrelated list.
 */
export function featuredTours(entries, limit = 4) {
  if (!Array.isArray(entries) || entries.length === 0) return [];

  const listing = entries.map(tourToRecord);
  const featured = listing.filter((t) => t.featured);
  const pool = featured.length ? featured : listing;

  return [...pool]
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
    .slice(0, limit);
}

/** Tour titles in `order` — the contact form's select. Empty without CMS data. */
export function tourTitles(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  return entries
    .map(tourToRecord)
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
    .map((t) => t.title);
}

/**
 * Budget band from the numeric amount. The listing page used to recover this by
 * parsing the display string; the price is a real number in Strapi now.
 */
export function budgetOf(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "Other";
  if (amount < 700) return "Under $700";
  if (amount < 1000) return "$700 – $1,000";
  return "$1,000+";
}

/**
 * A Strapi destination as the object DestinationDetailPage and
 * DestinationsPage already read. The `[{ text }]` components become plain
 * string arrays for FactList, and the blocks description is kept alongside the
 * flattened copy the page's meta description uses.
 */
export function destinationToRecord(entry) {
  const fallback = DESTINATIONS_ALL.find((d) => d.slug === entry.slug) || null;
  const image =
    bestImage(entry.image, entry.name) ??
    (fallback ? { src: fallback.image, alt: fallback.alt } : null);

  return {
    slug: entry.slug,
    name: entry.name,
    // the site shows the region line as the page badge and the footer subline
    region: entry.shortDescription || fallback?.region || "",
    continent: CONTINENT_LABEL[entry.continent] ?? "",
    image: image?.src ?? null,
    alt: image?.alt || entry.name,
    body: blocksToText(entry.description) || fallback?.body || "",
    // the unflattened blocks, for the Blocks renderer
    description: entry.description || null,
    attractions: (entry.attractions || []).map((i) => i.text).filter(Boolean),
    activities: (entry.activities || []).map((i) => i.text).filter(Boolean),
    bestTime: (entry.bestTime || []).map((i) => i.text).filter(Boolean),
    tours: (entry.tours || []).map((t) => t.slug),
    // null on the hardcoded list, which has no order field — same as tourToRecord
    order: entry.order ?? null,
    documentId: entry.documentId,
  };
}

/** Strapi destinations as records, or the hardcoded list when there are none. */
export function destinationList(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return DESTINATIONS_ALL;
  return entries.map(destinationToRecord);
}

/** One destination by slug, from either source. */
export function destinationBySlug(entries, slug) {
  return destinationList(entries).find((d) => d.slug === slug) ?? null;
}

// ---------------------------------------------------------------------------
// gallery page
// ---------------------------------------------------------------------------

/**
 * Strapi's gallery-page has no columns, but the page draws a three-column
 * masonry, so the columns are built here — the same rule the hand-packed
 * columns in GALLERY were built by: walk the photos in order and drop each one
 * into whichever column is currently shortest.
 *
 * "Shortest" is measured in rendered pixels, so an image's height is its
 * column's width divided by its aspect ratio. Every column is the same width
 * in the grid (1fr tracks), so COLUMN_WIDTH is only a scale factor: any value
 * picks the same winners. The gap between images is left out — it is the same
 * in all three columns and does not change which column wins.
 */
const GALLERY_COLUMN_COUNT = 3;
const GALLERY_COLUMN_WIDTH = 480;

/** Strapi measures every image, so a missing width/height is only a guard. */
const SQUARE = { w: 1, h: 1 };

/**
 * One photo as { src, w, h, alt } — the same keys GALLERY's items carry, plus
 * the alt text the editor wrote in the Media Library.
 *
 * `src` prefers the large rendition and falls back to the original, since a
 * gallery column is roughly a third of the container and the originals are
 * 1600px on the long edge. `w` and `h` are always the *original* dimensions, so
 * the aspect ratio the page sets on the <img> matches the picture rather than
 * whichever rendition was picked.
 */
function galleryPhoto(media) {
  const pick = media?.formats?.large ?? (media?.url ? media : null);
  const src = mediaUrl(pick?.url);
  if (!src) return null;

  const width = Number(media.width);
  const height = Number(media.height);

  return {
    src,
    w: Number.isFinite(width) && width > 0 ? width : SQUARE.w,
    h: Number.isFinite(height) && height > 0 ? height : SQUARE.h,
    alt: media.alternativeText || "",
  };
}

/** The photos as flat { src, w, h, alt } items, in the order Strapi holds them. */
export function galleryItems(photos) {
  if (!Array.isArray(photos)) return [];
  return photos.map(galleryPhoto).filter(Boolean);
}

function packGalleryColumns(items) {
  const columns = Array.from({ length: GALLERY_COLUMN_COUNT }, () => []);
  const heights = new Array(GALLERY_COLUMN_COUNT).fill(0);

  for (const item of items) {
    // strict <, so a tie goes to the leftmost column and the packing is stable
    let shortest = 0;
    for (let i = 1; i < columns.length; i += 1) if (heights[i] < heights[shortest]) shortest = i;

    columns[shortest].push(item);
    heights[shortest] += GALLERY_COLUMN_WIDTH / (item.w / item.h);
  }

  return columns;
}

/**
 * The gallery-page single type as the object GalleryPage already renders:
 * { badge, title, sub, columns }. The page's markup is unchanged, and the
 * hand-written GALLERY stays the source of truth whenever the CMS has nothing
 * to offer.
 *
 * Returns null when the entry has no usable photo — the same "nothing to show,
 * keep the fallback" signal the other adapters use.
 */
export function galleryPageToRecord(entry) {
  const items = galleryItems(entry?.photos);
  if (items.length === 0) return null;

  return {
    // the CMS copy wins, but a field left empty falls back rather than blanking
    // the page: this is a drop-in for a module that always had these three
    badge: entry.badge || GALLERY.badge,
    title: entry.title || GALLERY.title,
    sub: entry.sub || GALLERY.sub,
    columns: packGalleryColumns(items),
  };
}