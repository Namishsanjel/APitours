/**
 * One-off importer: copies the site's hardcoded destinations and tours into
 * Strapi v5 over the REST API.
 *
 * Reads the same data modules the site renders from, so the script can never
 * drift from what the pages show. It does not write to, or otherwise touch,
 * any site file.
 *
 *   node scripts/import-to-strapi.mjs --dry-run    # parse + print, no requests
 *   node scripts/import-to-strapi.mjs              # the real import
 *
 * Env:
 *   STRAPI_URL    default http://localhost:1337
 *   STRAPI_TOKEN  API token with create rights (required for a real import;
 *                 a dry run makes no requests and does not need one)
 *
 * The token is only ever read from the environment. It is never printed,
 * logged, or written to a file, and no request line in this file includes it.
 */

import { readFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The project's own data modules. Read-only imports.
import { HIKES_ALL } from "../src/data/hikes.js";
import { TOUR_DETAILS } from "../src/data/tourDetails.js";
import { DESTINATIONS_ALL } from "../src/data/newPages.js";
import { EXPERIENCE_BY_TOUR } from "../src/data/newPages.js";
import { HIKES } from "../src/data/content.js";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const PUBLIC_DIR = resolve(HERE, "..", "public");

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes("--dry-run");
const ONLY = (ARGS.find((a) => a.startsWith("--only=")) || "").split("=")[1] || null; // "destinations" | "tours"

/** --limit=N keeps only the first N of each collection, for a small test run. */
const LIMIT = (() => {
  const raw = (ARGS.find((a) => a.startsWith("--limit=")) || "").split("=")[1];
  if (raw === undefined || raw === "") return null;
  const n = Number.parseInt(raw, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
})();

const STRAPI_URL = (process.env.STRAPI_URL || "http://localhost:1337").replace(/\/+$/, "");
const TOKEN = process.env.STRAPI_TOKEN || "";

const DIFFICULTIES = new Set(["easy", "moderate", "tough"]);
const TRAVEL_TYPES = new Set(["trekking", "culture", "family", "adventure"]);

// ---------------------------------------------------------------------------
// parsing
// ---------------------------------------------------------------------------

/** Chip matching is by pattern, never by index: the listing and the detail
 *  records order their chips differently (and put different things in them). */
const RE_DIFFICULTY = /^(easy|moderate|tough)$/i;
const RE_DAYS = /(\d+)\s*days?\b/i;
const RE_PEOPLE = /\bpeople\b/i;
const RE_KM = /(\d+(?:\.\d+)?)\s*km\b/i;
const RE_PRICE = /^\s*\$\s*([\d.,]+)\s*([KkMm])?\s*(?:\/\s*(.+?))?\s*$/;

function chipMatching(chips, re) {
  for (const chip of chips) {
    const text = String(chip).trim();
    if (re.test(text)) return text;
  }
  return null;
}

/** One block per paragraph, which is what a Strapi blocks field expects. */
function toBlocks(text) {
  return String(text ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({ type: "paragraph", children: [{ type: "text", text: p }] }));
}

function parsePrice(raw) {
  const match = String(raw ?? "").match(RE_PRICE);
  if (!match) return { raw: raw ?? null, amount: null, per: null, note: "unparsed" };

  const [, number, scale, per] = match;
  const base = Number.parseFloat(number.replace(/,/g, ""));
  const amount = scale ? Math.round(base * (scale.toLowerCase() === "k" ? 1000 : 1_000_000)) : base;

  return {
    raw: String(raw),
    amount,
    per: per ? per.trim() : null,
    note: scale ? `scaled by ${scale.toUpperCase()}` : "no scale",
  };
}

/** The site's "Nepal · Himalaya" wording -> the enumeration values Strapi accepts. */
const CONTINENT_ENUM = {
  Asia: "asia",
  Europe: "europe",
  Africa: "africa",
  Oceania: "oceania",
  "South America": "south_america",
};

/** String array -> repeatable component array. */
function toItems(list) {
  return (list || []).map((text) => ({ text }));
}

/**
 * Continent is an enumeration, so an unmapped value must not be guessed at or
 * defaulted — it aborts before a single request goes out, naming the entries
 * that need a rule.
 */
function parseContinent(value, slug) {
  const mapped = CONTINENT_ENUM[value];
  if (!mapped) {
    throw new Error(
      `continent "${value}" on destination "${slug}" has no mapping. ` +
        `Add it to CONTINENT_ENUM in this script. Known values: ${Object.keys(CONTINENT_ENUM).join(", ")}.`,
    );
  }
  return mapped;
}

/** "/img/abc.jpg" -> an absolute path inside public/. */
function imageFile(url) {
  if (!url || typeof url !== "string") return null;
  const clean = url.split("?")[0];
  if (!clean.startsWith("/")) return null;
  return join(PUBLIC_DIR, clean.replace(/^\/+/, ""));
}

// ---------------------------------------------------------------------------
// build the two record lists
// ---------------------------------------------------------------------------

/** Tour slugs the homepage shows — the ones the import marks featured. */
const FEATURED_SLUGS = new Set(HIKES.map((h) => h.slug));

/** destination slug -> tour slugs, inverted from DESTINATIONS_ALL[].tours. */
const DESTINATION_OF_TOUR = new Map();
for (const destination of DESTINATIONS_ALL) {
  for (const slug of destination.tours || []) DESTINATION_OF_TOUR.set(slug, destination.slug);
}

function buildDestinations() {
  return DESTINATIONS_ALL.map((d) => ({
    source: d,
    data: {
      name: d.name,
      slug: d.slug,
      // enumeration: "South America" -> "south_america", etc. Throws on
      // anything else rather than sending a value the field will reject.
      continent: parseContinent(d.continent, d.slug),
      // "Nepal · Himalaya" is the short line the page shows under the name.
      shortDescription: d.region || null,
      description: toBlocks(d.body),
      attractions: toItems(d.attractions),
      activities: toItems(d.activities),
      // en dashes in the month ranges are copied through untouched
      bestTime: toItems(d.bestTime),
      // attached at create time, once the upload has run
      image: null,
    },
    imageFile: imageFile(d.image),
    imageAlt: d.alt || d.name,
    unmapped: ["tours"],
  }));
}

function buildTours() {
  const problems = [];

  const records = HIKES_ALL.map((hike, index) => {
    const detail = TOUR_DETAILS[hike.slug];
    if (!detail) problems.push(`${hike.slug}: no entry in TOUR_DETAILS — listing fields only`);

    // Both chip sets together, so pattern matching does not care which record
    // a chip came from or what order they are in.
    const chips = [...(hike.chips || []), ...((detail && detail.chips) || [])];

    const difficultyChip = chipMatching(chips, RE_DIFFICULTY);
    const difficulty = difficultyChip ? difficultyChip.toLowerCase() : null;
    if (difficulty && !DIFFICULTIES.has(difficulty)) {
      problems.push(`${hike.slug}: difficulty "${difficulty}" is not one of easy/moderate/tough`);
    }

    const daysChip = chipMatching(chips, RE_DAYS);
    const kmChip = chipMatching(chips, RE_KM);
    const groupChip = chipMatching(chips, RE_PEOPLE);

    const travelType = EXPERIENCE_BY_TOUR[hike.slug] || null;
    if (!travelType) problems.push(`${hike.slug}: no entry in EXPERIENCE_BY_TOUR`);
    if (travelType && !TRAVEL_TYPES.has(travelType)) {
      problems.push(`${hike.slug}: travelType "${travelType}" is not one of trekking/culture/family/adventure`);
    }

    const price = detail ? parsePrice(detail.price) : { raw: null, amount: null, per: null, note: "no detail" };

    // Parsed as written. distanceKm is a decimal field, so Milford Track's
    // "53.5 Km" stays 53.5 rather than being rounded to an integer.
    const distanceKm = kmChip ? Number.parseFloat(kmChip.match(RE_KM)[1]) : null;

    const data = {
      title: hike.title,
      slug: hike.slug,
      overview: detail ? detail.overview : null,
      difficulty,
      travelType,
      durationDays: daysChip ? Number.parseInt(daysChip.match(RE_DAYS)[1], 10) : null,
      groupSize: groupChip,
      distanceKm,
      priceAmount: price.amount,
      priceCurrency: price.amount === null ? null : "USD",
      pricePer: price.per,
      startLocation: detail?.start || null,
      endLocation: detail?.end || null,
      itinerary: (detail?.itinerary || []).map((day) => ({
        day: day.day,
        title: day.title || "",
        body: day.body,
      })),
      inclusions: (detail?.inclusions || []).map((text) => ({ text })),
      exclusions: (detail?.exclusions || []).map((text) => ({ text })),
      destinationSlug: DESTINATION_OF_TOUR.get(hike.slug) || null,
      featured: FEATURED_SLUGS.has(hike.slug),
      order: index + 1,
      // attached at create time
      coverImage: null,
    };

    if (!data.destinationSlug) problems.push(`${hike.slug}: no destination points at this tour`);

    return {
      slug: hike.slug,
      data,
      imageFile: imageFile(hike.image),
      imageAlt: hike.alt || hike.title,
      price,
      chipsSeen: chips,
    };
  });

  return { records, problems };
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const counters = { created: 0, skipped: 0, failed: 0 };

function log(line) {
  process.stdout.write(`${line}\n`);
}

function fail(kind, label, error) {
  counters.failed += 1;
  log(`  FAILED  ${kind} "${label}" — ${error}`);
}

function headers(extra = {}) {
  return { Authorization: `Bearer ${TOKEN}`, ...extra };
}

/**
 * Every request goes through here, so the auth header lives in exactly one
 * place. `extraHeaders` has to be merged in rather than ignored: a create
 * without `Content-Type: application/json` reaches Strapi as untyped body text
 * and comes back as "Missing \"data\" payload in the request body" even though
 * the body was sent.
 */
async function api(path, { method = "GET", body, headers: extraHeaders = {}, raw = false } = {}) {
  const res = await fetch(`${STRAPI_URL}/api/${path}`, { method, headers: headers(extraHeaders), body });
  const text = await res.text();

  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const detail = json?.error?.message || text.slice(0, 300) || res.statusText;
    throw new Error(`${method} ${path} -> ${res.status} ${detail}`);
  }
  return raw ? { json, text } : json;
}

/**
 * The two collections do not agree on what their entry is called: a
 * Destination has `name`, a Tour has `title`. Asking for the wrong one in
 * `fields[]` silently costs you the label, so each collection declares its own
 * and every lookup and log line below reads it from here.
 */
const COLLECTIONS = {
  destinations: { label: "destination", labelField: "name" },
  tours: { label: "tour", labelField: "title" },
};

/** Every existing entry for a collection, keyed by slug. */
async function existingBySlug(collection) {
  const { labelField } = COLLECTIONS[collection];
  const data = await api(
    `${collection}?pagination[pageSize]=100&fields[0]=slug&fields[1]=${labelField}`,
  );
  const list = Array.isArray(data?.data) ? data.data : [];
  return new Map(list.map((entry) => [entry.slug, entry]));
}

/**
 * How an entry already in Strapi is named, using that collection's own field.
 * Falls back to the slug if the entry somehow came back without its label.
 */
function labelOf(collection, entry) {
  return entry?.[COLLECTIONS[collection].labelField] || entry?.slug || "(unnamed)";
}

/**
 * file path -> media entry, so an image shared by a tour and a destination
 * uploads once within a run.
 */
const mediaCache = new Map();

/**
 * Looks for a file of the same name already in the Media Library. Without this,
 * a run that fails partway through and is then retried would leave a duplicate
 * upload behind for every image it had already sent.
 */
async function findInLibrary(name) {
  try {
    const result = await api(`upload/files?filters[name][$eq]=${encodeURIComponent(name)}`);
    // this endpoint answers with a bare array; tolerate a { data } wrapper too
    const list = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : [];
    return list.find((file) => file?.id) ?? null;
  } catch (error) {
    // A read failure must not stop the import — fall through and upload.
    log(`         media library lookup for ${name} failed (${error.message}); uploading anyway`);
    return null;
  }
}

async function uploadImage(filePath, altText) {
  if (mediaCache.has(filePath)) return mediaCache.get(filePath);

  const name = basename(filePath);

  const existing = await findInLibrary(name);
  if (existing) {
    log(`         reusing ${name} from the Media Library (id ${existing.id})`);
    mediaCache.set(filePath, existing);
    return existing;
  }

  const buffer = await readFile(filePath);

  const form = new FormData();
  form.append("files", new Blob([buffer]), name);
  // fileInfo carries the media fields through the upload itself, so no second
  // write is needed to set the alt text.
  form.append("fileInfo", JSON.stringify({ name, alternativeText: altText || null }));
  // No Content-Type here on purpose: fetch has to set the multipart boundary
  // itself, and overriding it produces a body Strapi cannot parse.
  const result = await api("upload", { method: "POST", body: form });
  const media = Array.isArray(result) ? result[0] : result;
  if (!media?.id) throw new Error("upload returned no media id");

  // Strapi usually honours fileInfo, but confirm rather than assume — and fix
  // it through the media endpoint if it was dropped.
  if (altText && media.alternativeText !== altText) {
    try {
      const updated = await api(`upload/${media.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { id: media.id, alternativeText: altText } }),
      });
      log(`         alt text patched on ${name} (fileInfo was ignored)`);
      mediaCache.set(filePath, { ...media, ...updated });
      return mediaCache.get(filePath);
    } catch (error) {
      log(`         WARNING could not set alt text on ${name}: ${error.message}`);
    }
  }

  mediaCache.set(filePath, media);
  return media;
}

/** Creates one entry and publishes it in the same request. */
async function createPublished(collection, data) {
  const created = await api(`${collection}?status=published`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  return created?.data ?? null;
}

/**
 * The exact object sent to Strapi for one destination. The dry run prints this
 * same structure, so what you read there is what goes over the wire.
 */
function destinationPayload(record, mediaId) {
  const { data } = record;
  return {
    name: data.name,
    slug: data.slug,
    continent: data.continent,
    shortDescription: data.shortDescription,
    description: data.description,
    attractions: data.attractions,
    activities: data.activities,
    bestTime: data.bestTime,
    image: mediaId,
  };
}

/** The same for a tour. `destinationId` is null when nothing matched. */
function tourPayload(record, mediaId, destinationId) {
  const { data } = record;
  return {
    title: data.title,
    slug: data.slug,
    coverImage: mediaId,
    overview: data.overview,
    difficulty: data.difficulty,
    travelType: data.travelType,
    durationDays: data.durationDays,
    groupSize: data.groupSize,
    distanceKm: data.distanceKm,
    priceAmount: data.priceAmount,
    priceCurrency: data.priceCurrency,
    pricePer: data.pricePer,
    startLocation: data.startLocation,
    endLocation: data.endLocation,
    itinerary: data.itinerary,
    inclusions: data.inclusions,
    exclusions: data.exclusions,
    destination: destinationId,
    featured: data.featured,
    order: data.order,
  };
}

// ---------------------------------------------------------------------------
// dry run
// ---------------------------------------------------------------------------

function printDestinations(records) {
  log("\n=== DESTINATIONS — field mapping ===");
  log("  DESTINATIONS_ALL.name        -> name");
  log("  DESTINATIONS_ALL.slug        -> slug");
  log("  DESTINATIONS_ALL.continent   -> continent   (enumeration, mapped: Asia->asia, Europe->europe, Africa->africa, Oceania->oceania, South America->south_america)");
  log("  DESTINATIONS_ALL.region      -> shortDescription   (e.g. \"Nepal · Himalaya\")");
  log("  DESTINATIONS_ALL.body        -> description        (blocks: one paragraph block per \\n\\n paragraph)");
  log("  DESTINATIONS_ALL.attractions -> attractions    (repeatable component, [{ text }])");
  log("  DESTINATIONS_ALL.activities  -> activities     (repeatable component, [{ text }])");
  log("  DESTINATIONS_ALL.bestTime    -> bestTime       (repeatable component, [{ text }]; en dashes copied verbatim)");
  log("  DESTINATIONS_ALL.image       -> image              (uploaded from public/img, attached by id)");
  log("  DESTINATIONS_ALL.alt         -> image alternativeText");
  log("  NOT MAPPED: tours — it is the relation, not a field");

  for (const record of records) {
    const { data } = record;
    log(`\n  destination "${data.slug}"`);
    log(`    name             ${data.name}`);
    log(`    continent        ${data.continent}`);
    log(`    shortDescription ${data.shortDescription}`);
    log(`    description      ${data.description.length} block(s):`);
    for (const block of data.description) log(`      [paragraph] ${block.children[0].text.slice(0, 90)}…`);
    log(`    attractions      ${data.attractions.length} item(s):`);
    for (const item of data.attractions) log(`      [${String(item.text.length).padStart(2)}] ${item.text}`);
    log(`    activities       ${data.activities.length} item(s):`);
    for (const item of data.activities) log(`      [${String(item.text.length).padStart(2)}] ${item.text}`);
    log(`    bestTime         ${data.bestTime.length} item(s):`);
    for (const item of data.bestTime) log(`      [${String(item.text.length).padStart(2)}] ${item.text}`);
    log(`    image            ${basename(record.imageFile || "(none)")}  alt="${record.imageAlt}"`);
  }
}

function printTours(records, problems) {
  log("\n=== TOURS — field mapping ===");
  log("  HIKES_ALL.title/slug            -> title / slug");
  log("  HIKES_ALL.image                 -> coverImage (uploaded, attached by id)");
  log("  HIKES_ALL.alt                   -> coverImage alternativeText");
  log("  TOUR_DETAILS.overview           -> overview (string, \\n\\n paragraphs kept as-is)");
  log("  chips matching /^(easy|moderate|tough)$/i -> difficulty (lowercased)");
  log("  chips matching /(\\d+)\\s*days?\\b/i      -> durationDays (integer)");
  log("  chips matching /\\bpeople\\b/i            -> groupSize (string)");
  log("  chips matching /(\\d+(\\.\\d+)?)\\s*km\\b/i -> distanceKm (decimal, parsed as written)");
  log("  TOUR_DETAILS.price              -> priceAmount / pricePer  (+ priceCurrency \"USD\")");
  log("  TOUR_DETAILS.start / end        -> startLocation / endLocation");
  log("  TOUR_DETAILS.itinerary          -> itinerary [{ day, title, body }]");
  log("  TOUR_DETAILS.inclusions         -> inclusions [{ text }]");
  log("  TOUR_DETAILS.exclusions         -> exclusions [{ text }]  (empty on every tour: component sent as [])");
  log("  DESTINATIONS_ALL[].tours        -> destination (by documentId, resolved at import)");
  log("  content.js HIKES (homepage 4)   -> featured: true");
  log("  position in HIKES_ALL + 1       -> order");
  log("  SKIPPED: highlights (empty), gallery (site-wide, not per tour)");

  log("\n  price parsing (raw -> parsed):");
  for (const record of records) {
    const { price } = record;
    log(`    ${record.slug.padEnd(26)} "${price.raw}" -> ${price.amount} ${price.amount === null ? "" : "USD"}  per="${price.per ?? ""}"  (${price.note})`);
  }

  log("\n  chip matching (which chip answered which field):");
  for (const record of records) {
    const d = record.data;
    log(
      `    ${record.slug.padEnd(26)} difficulty=${d.difficulty ?? "—"}  days=${d.durationDays ?? "—"}  group=${d.groupSize ?? "—"}  km=${d.distanceKm ?? "—"}`,
    );
    log(`    ${" ".repeat(26)} chips seen: ${JSON.stringify(record.chipsSeen)}`);
  }

  for (const record of records) {
    const d = record.data;
    log(`\n  tour "${d.slug}"`);
    log(`    title           ${d.title}`);
    log(`    difficulty      ${d.difficulty}   travelType ${d.travelType}`);
    log(`    durationDays    ${d.durationDays}   distanceKm ${d.distanceKm}   groupSize "${d.groupSize}"`);
    log(`    price           ${d.priceAmount} ${d.priceCurrency} per "${d.pricePer}"`);
    log(`    start / end     "${d.startLocation}" -> "${d.endLocation}"`);
    log(`    itinerary       ${d.itinerary.length} day(s): ${d.itinerary.map((i) => i.day).join(", ") || "—"}`);
    log(`    inclusions      ${d.inclusions.length}: ${d.inclusions.map((i) => i.text).join(" | ") || "—"}`);
    log(`    exclusions      ${d.exclusions.length}${d.exclusions.length ? "" : "  (empty on every tour in the source data)"}`);
    log(`    destination     ${d.destinationSlug ?? "(none — left empty)"}`);
    log(`    featured        ${d.featured}   order ${d.order}`);
    log(`    coverImage      ${basename(record.imageFile || "(none)")}  alt="${record.imageAlt}"`);
    log(`    overview        ${d.overview ? `${d.overview.split("\n\n").length} paragraph(s), ${d.overview.length} chars` : "(none)"}`);
  }

  if (problems.length) {
    log("\n  problems found while parsing:");
    for (const problem of problems) log(`    - ${problem}`);
  }
}

// ---------------------------------------------------------------------------
// import
// ---------------------------------------------------------------------------

async function importDestinations(records) {
  log("\n=== DESTINATIONS ===");

  const existing = await existingBySlug("destinations");
  const documentIds = new Map();
  for (const record of records) {
    const found = existing.get(record.data.slug);
    if (found) {
      documentIds.set(record.data.slug, found.documentId);
      counters.skipped += 1;
      // labelled with the Destination's own `name` field, not the Tour's `title`
      log(
        `  skipped  destination "${record.data.slug}" — already exists as "${labelOf("destinations", found)}" (documentId ${found.documentId})`,
      );
    }
  }
  // Entries the user made by hand are listed but never touched.
  const ours = new Set(records.map((r) => r.data.slug));
  for (const slug of existing.keys()) {
    if (!ours.has(slug)) {
      log(
        `  ignored  destination "${slug}" — "${labelOf("destinations", existing.get(slug))}" is not in this import, left untouched`,
      );
    }
  }

  for (const record of records) {
    if (documentIds.has(record.data.slug)) continue;
    try {
      const media = await uploadImage(record.imageFile, record.imageAlt);
      const created = await createPublished("destinations", destinationPayload(record, media.id));
      if (!created) throw new Error("create returned no data");
      documentIds.set(record.data.slug, created.documentId);
      counters.created += 1;
      log(`  created  destination "${record.data.slug}" (documentId ${created.documentId})`);
    } catch (error) {
      fail("destination", record.data.slug, error.message);
    }
  }

  return documentIds;
}

async function importTours(records, destinationIds) {
  log("\n=== TOURS ===");

  const existing = await existingBySlug("tours");
  const ours = new Set(records.map((r) => r.slug));
  for (const slug of existing.keys()) {
    if (ours.has(slug)) {
      counters.skipped += 1;
      log(
        `  skipped  tour "${slug}" — already exists as "${labelOf("tours", existing.get(slug))}" (documentId ${existing.get(slug).documentId})`,
      );
    } else {
      log(`  ignored  tour "${slug}" — "${labelOf("tours", existing.get(slug))}" is not in this import, left untouched`);
    }
  }

  let lastCreated = null;

  for (const record of records) {
    if (existing.has(record.slug)) continue;
    try {
      const { data } = record;
      const media = await uploadImage(record.imageFile, record.imageAlt);
      const destinationId = data.destinationSlug ? destinationIds.get(data.destinationSlug) : null;

      const payload = tourPayload(record, media.id, destinationId);

      const created = await createPublished("tours", payload);
      if (!created) throw new Error("create returned no data");

      counters.created += 1;
      lastCreated = created.documentId;
      log(
        `  created  tour "${data.slug}" (documentId ${created.documentId}, destination ${destinationId ?? "none"})`,
      );
    } catch (error) {
      fail("tour", record.slug, error.message);
    }
  }

  return lastCreated;
}

/** Reads a created tour back with everything populated and checks it. */
async function verify(documentId) {
  log("\n=== VERIFICATION ===");

  const { data } = await api(
    `tours?filters[documentId][$eq]=${documentId}&populate[coverImage]=true&populate[destination]=true&populate[itinerary]=true&populate[inclusions]=true`,
  );
  const tour = Array.isArray(data) ? data[0] : null;
  if (!tour) {
    log("  could not read the tour back");
    return;
  }

  const checks = [
    ["published", Boolean(tour.publishedAt)],
    ["coverImage populated", Boolean(tour.coverImage?.url)],
    ["coverImage alternativeText", Boolean(tour.coverImage?.alternativeText)],
    ["itinerary populated", Array.isArray(tour.itinerary) && tour.itinerary.length > 0],
    ["inclusions populated", Array.isArray(tour.inclusions) && tour.inclusions.length > 0],
    ["destination populated", Boolean(tour.destination)],
    ["difficulty", Boolean(tour.difficulty)],
    ["travelType", Boolean(tour.travelType)],
    ["durationDays", tour.durationDays != null],
    ["priceAmount", tour.priceAmount != null],
  ];

  log(`  tour "${labelOf("tours", tour)}" (${tour.slug}), documentId ${tour.documentId}`);
  // the populated relation is a Destination, so its label is `name`, not `title`
  if (tour.destination) log(`    destination -> "${labelOf("destinations", tour.destination)}" / ${tour.destination.slug}`);
  if (tour.coverImage) log(`    coverImage -> ${tour.coverImage.url} (alt: ${tour.coverImage.alternativeText || "none"})`);
  log(`    itinerary -> ${tour.itinerary?.length ?? 0} day(s), inclusions -> ${tour.inclusions?.length ?? 0}`);

  for (const [label, ok] of checks) {
    log(`    ${ok ? "ok  " : "MISS"} ${label}`);
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

const allDestinationRecords = buildDestinations();
const allTourRecords = buildTours();

// --limit applies per collection, so a test run takes the first N of each.
const destinationRecords = LIMIT ? allDestinationRecords.slice(0, LIMIT) : allDestinationRecords;
const tourRecords = LIMIT ? allTourRecords.records.slice(0, LIMIT) : allTourRecords.records;
const problems = allTourRecords.problems;

if (ARGS.includes("--help")) {
  log("usage: node scripts/import-to-strapi.mjs [--dry-run] [--only=destinations|tours] [--limit=N]");
  log("env:   STRAPI_URL (default http://localhost:1337), STRAPI_TOKEN");
  process.exit(0);
}

/**
 * Prints the request body for one entry, so the { data: ... } wrapper and the
 * field names can be checked before anything is sent. Media ids are not known
 * until an upload has run, so they appear as a placeholder.
 */
function printRequestBody(collection, record, destinationSlug = null) {
  const placeholder = "<media id from upload>";
  const payload =
    collection === "destinations"
      ? destinationPayload(record, placeholder)
      : tourPayload(record, placeholder, destinationSlug ? "<destination documentId>" : null);

  const body = { data: payload };
  log(`\n  POST /api/${collection}?status=published`);
  log("  Content-Type: application/json");
  log("  body:");
  for (const line of JSON.stringify(body, null, 2).split("\n")) log(`    ${line}`);
}

if (DRY_RUN) {
  log("DRY RUN — no requests will be sent, nothing in Strapi will change.");
  log(`  STRAPI_URL : ${STRAPI_URL}`);
  log(`  source     : ${HIKES_ALL.length} tours, ${DESTINATIONS_ALL.length} destinations`);
  log(`  token      : ${TOKEN ? "present (unused in a dry run)" : "not set (not needed for a dry run)"}`);
  log(`  limit      : ${LIMIT ?? "none"}`);

  if (!ONLY || ONLY === "destinations") printDestinations(destinationRecords);
  if (!ONLY || ONLY === "tours") printTours(tourRecords, problems);

  log("\n=== DRY RUN — EXACT REQUEST BODY ===");
  log("  (the first of each collection, with the Authorization header omitted on purpose)");
  if (!ONLY || ONLY === "destinations") {
    if (destinationRecords[0]) printRequestBody("destinations", destinationRecords[0]);
  }
  if (!ONLY || ONLY === "tours") {
    if (tourRecords[0]) printRequestBody("tours", tourRecords[0], tourRecords[0].data.destinationSlug);
  }

  log("\n=== DRY RUN SUMMARY ===");
  log(`  destinations to create : ${destinationRecords.length}`);
  log(`  tours to create        : ${tourRecords.length}`);
  log(`  distinct images        : ${new Set([...destinationRecords, ...tourRecords].map((r) => r.imageFile)).size}`);
  log(`  featured tours         : ${tourRecords.filter((r) => r.data.featured).map((r) => r.slug).join(", ")}`);
  log(`  tours with no destination : ${tourRecords.filter((r) => !r.data.destinationSlug).map((r) => r.slug).join(", ") || "none"}`);
  log(`  problems               : ${problems.length}`);
  log("\nNothing was sent. Re-run without --dry-run to import.");
  process.exit(0);
}

if (!TOKEN) {
  process.stderr.write(
    "\nSTRAPI_TOKEN is not set.\n\n" +
      "Set it before running the import, e.g.\n" +
      "  PowerShell:  $env:STRAPI_TOKEN = \"your-api-token\"\n" +
      "  cmd:         set STRAPI_TOKEN=your-api-token\n\n" +
      "The token is read from the environment only — do not commit it anywhere.\n",
  );
  process.exit(1);
}

log(`Importing into ${STRAPI_URL} (token from STRAPI_TOKEN, never printed)`);

let destinationIds = new Map();
try {
  if (!ONLY || ONLY === "destinations") destinationIds = await importDestinations(destinationRecords);
  if (!ONLY || ONLY === "tours") {
    const lastCreated = await importTours(tourRecords, destinationIds);
    if (lastCreated) {
      try {
        await verify(lastCreated);
      } catch (error) {
        fail("verification", lastCreated, error.message);
      }
    } else {
      log("\n(no tour was created, so there is nothing to verify — every one was already there)");
    }
  }
} catch (error) {
  // A failure up here (bad URL, no permission on the collection) stops the
  // run; per-item failures were already counted and did not.
  process.stderr.write(`\nImport aborted: ${error.message}\n`);
  counters.failed += 1;
}

log("\n=== SUMMARY ===");
log(`  created : ${counters.created}`);
log(`  skipped : ${counters.skipped}   (already in Strapi — nothing duplicated)`);
log(`  failed  : ${counters.failed}`);

process.exit(counters.failed > 0 ? 1 : 0);