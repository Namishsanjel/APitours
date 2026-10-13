/**
 * One-off importer: creates the Destinations in Strapi v5 over the REST API.
 *
 * Nothing is ever updated or deleted — this only ever POSTs. Entries that are
 * already in Strapi (including anything you made by hand) are looked up first
 * and skipped, so a second run changes nothing.
 *
 *   node scripts/import-destinations.mjs --dry-run    # print the plan, no requests
 *   node scripts/import-destinations.mjs              # the real import
 *
 * Env:
 *   STRAPI_URL    default http://localhost:1337
 *   STRAPI_TOKEN  API token with read + create rights (required for a real
 *                 import; a dry run makes no requests and does not need one)
 *
 * The token is only ever read from the environment. It is never hardcoded,
 * printed, logged, or written to a file, and it appears in exactly one place in
 * this file — the Authorization header built by `headers()`.
 *
 * No images: every image field is left out so you can upload them in the admin.
 */

// ---------------------------------------------------------------------------
// constants
// ---------------------------------------------------------------------------

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes("--dry-run");

const STRAPI_URL = (process.env.STRAPI_URL || "http://localhost:1337").replace(/\/+$/, "");
const TOKEN = process.env.STRAPI_TOKEN || "";

/** The continent enumeration, checked before a single request goes out. */
const CONTINENTS = new Set(["asia", "europe", "africa", "oceania", "south_america"]);

const TIMEOUT = 30_000;

// ---------------------------------------------------------------------------
// field helpers
// ---------------------------------------------------------------------------

/** One paragraph block — the only block kind a destination description uses. */
function paragraph(text) {
  return { type: "paragraph", children: [{ type: "text", text: String(text) }] };
}

/**
 * A repeatable component: plain strings in, `[{ text }]` out.
 *   list("Taj Mahal", "Varanasi ghats")
 */
function list(...items) {
  return items.map((text) => ({ text: String(text) }));
}

/**
 * The month ranges use an en dash (U+2013), not a hyphen. Asserted once at
 * startup so a mangled save cannot quietly ship "October - March".
 */
const EN_DASH = "\u2013";

/**
 * Every string a destination sends, paired with the field it came from, so the
 * dash check can cover the description and the lists as well as bestTime.
 */
function allTextFields(destination) {
  const pairs = [["shortDescription", destination.shortDescription]];
  pairs.push(["description", destination.description?.children?.[0]?.text]);
  for (const field of ["attractions", "activities", "bestTime"]) {
    for (const item of destination[field] || []) pairs.push([field, item.text]);
  }
  return pairs.filter(([, value]) => typeof value === "string");
}

// ---------------------------------------------------------------------------
// the destinations
// ---------------------------------------------------------------------------

const DESTINATIONS = [
  {
    name: "India",
    slug: "india",
    order: 11,
    continent: "asia",
    shortDescription: "India \u00b7 Golden Triangle and beyond",
    description: paragraph(
      "Palaces, living bazaars and river ghats, linked by routes that balance the famous sights with quieter corners. Pick a region and we build the pace around it.",
    ),
    attractions: list("Taj Mahal", "Amber Fort, Jaipur", "Varanasi ghats", "Kerala backwaters"),
    activities: list(
      "Heritage city tours",
      "Ganges sunrise boat rides",
      "Houseboat stays",
      "Street-food walks",
    ),
    bestTime: list(
      "October \u2013 March",
      "Cool, dry season",
      "Avoid peak summer heat",
      "Book trains in advance",
    ),
  },
  {
    name: "Indonesia",
    slug: "indonesia",
    order: 12,
    continent: "asia",
    shortDescription: "Indonesia \u00b7 Bali and beyond",
    description: paragraph(
      "Temples, rice terraces and volcanic skylines spread across thousands of islands. We pair culture-rich Java and Bali with quieter islands further out.",
    ),
    attractions: list(
      "Borobudur temple",
      "Ubud rice terraces",
      "Komodo National Park",
      "Mount Bromo sunrise",
    ),
    activities: list("Temple visits", "Island hopping", "Volcano sunrise hikes", "Snorkelling and diving"),
    bestTime: list(
      "May \u2013 September",
      "Dry season for most islands",
      "Wetter November \u2013 March",
      "Book Komodo boats early",
    ),
  },
  {
    name: "Malaysia",
    slug: "malaysia",
    order: 13,
    continent: "asia",
    shortDescription: "Malaysia \u00b7 Peninsula and Borneo",
    description: paragraph(
      "Colonial towns, tea hills and ancient rainforest, with some of Asia's best street food between them. Easy to combine a city break with wildlife in Borneo.",
    ),
    attractions: list(
      "Petronas Twin Towers",
      "Georgetown street art",
      "Cameron highlands tea farms",
      "Borneo rainforest",
    ),
    activities: list("Street-food tours", "Tea plantation walks", "Wildlife river cruises", "Island beach days"),
    bestTime: list(
      "December \u2013 February",
      "June \u2013 August",
      "Check the coast before booking",
      "Monsoon differs by coast",
    ),
  },
  {
    name: "Singapore",
    slug: "singapore",
    order: 14,
    continent: "asia",
    shortDescription: "Singapore \u00b7 City-state",
    description: paragraph(
      "A compact city of gardens, skyline views and hawker centres, ideal as a short stopover or the start of a wider Southeast Asia trip.",
    ),
    attractions: list("Gardens by the Bay", "Marina Bay skyline", "Hawker centres", "Sentosa island"),
    activities: list("Hawker food crawls", "Night Safari", "Skyline walks", "Heritage quarter walks"),
    bestTime: list(
      "February \u2013 April",
      "Slightly drier months",
      "Hot and humid all year",
      "Carry an umbrella any day",
    ),
  },
  {
    name: "Spain",
    slug: "spain",
    order: 15,
    continent: "europe",
    shortDescription: "Spain \u00b7 Andalusia and Catalonia",
    description: paragraph(
      "Moorish palaces, Gaud\u00ed's Barcelona and long tapas evenings. We link the big-name cities with whitewashed villages and the coast.",
    ),
    attractions: list(
      "Sagrada Fam\u00edlia",
      "Alhambra in Granada",
      "Seville old town",
      "San Sebasti\u00e1n pintxos",
    ),
    activities: list("Tapas evenings", "Flamenco nights", "Old-town walking tours", "Coastal day trips"),
    bestTime: list(
      "April \u2013 June",
      "September \u2013 October",
      "Avoid August heat in the south",
      "Book Alhambra tickets early",
    ),
  },
  {
    name: "Vietnam",
    slug: "vietnam",
    order: 16,
    continent: "asia",
    shortDescription: "Vietnam \u00b7 North to south",
    description: paragraph(
      "Limestone bays, lantern-lit old towns and river delta life, all on a single long coastline. Routes run north to south or the other way.",
    ),
    attractions: list("Ha Long Bay", "Hoi An old town", "Hanoi Old Quarter", "Mekong Delta"),
    activities: list("Bay cruises", "Lantern-lit evening walks", "Street-food tours", "Cyclo and bike rides"),
    bestTime: list(
      "November \u2013 April",
      "Dry season in the south",
      "Central coast wet in autumn",
      "Book bay cruises early",
    ),
  },
  {
    name: "Albania",
    slug: "albania",
    order: 17,
    continent: "europe",
    shortDescription: "Albania \u00b7 Balkans",
    description: paragraph(
      "Unspoilt beaches, stone-built old towns and wild mountain valleys, still far quieter than the rest of the Mediterranean.",
    ),
    attractions: list(
      "Albanian Riviera beaches",
      "Berat old town",
      "Gjirokast\u00ebr Castle",
      "Theth mountain valley",
    ),
    activities: list("Coastal beach days", "Old-town walks", "Village hikes", "Local farm meals"),
    bestTime: list(
      "May \u2013 June",
      "September \u2013 October",
      "Beaches busy in August",
      "Mountain passes snowy in winter",
    ),
  },
];

// ---------------------------------------------------------------------------
// payloads
// ---------------------------------------------------------------------------

/**
 * The exact create body: `{ "data": { ... } }`.
 *
 * No image field is present — nothing here touches media, so every image stays
 * empty for you to fill in the admin.
 */
function destinationPayload(destination) {
  return {
    data: {
      name: destination.name,
      slug: destination.slug,
      order: destination.order,
      shortDescription: destination.shortDescription,
      description: destination.description,
      continent: destination.continent,
      attractions: destination.attractions,
      activities: destination.activities,
      bestTime: destination.bestTime,
    },
  };
}

const counters = { created: 0, skipped: 0, failed: 0 };

function log(line) {
  process.stdout.write(`${line}\n`);
}

function fail(line) {
  process.stderr.write(`${line}\n`);
}

/**
 * Everything checkable without talking to Strapi, checked before a request goes
 * out — a continent outside the enumeration would be rejected by the server,
 * and a dry run should catch it too.
 */
function problems() {
  const found = [];

  const slugs = new Set();
  const orders = new Set();

  for (const destination of DESTINATIONS) {
    const label = `destination "${destination.slug}"`;

    if (!destination.name || !destination.slug) found.push(`${label}: missing name or slug`);
    if (slugs.has(destination.slug)) found.push(`${label}: duplicated slug in this import`);
    slugs.add(destination.slug);

    if (!Number.isInteger(destination.order)) found.push(`${label}: order is not an integer`);
    if (orders.has(destination.order)) found.push(`${label}: order ${destination.order} is used twice in this import`);
    orders.add(destination.order);

    if (!CONTINENTS.has(destination.continent)) {
      found.push(`${label}: continent "${destination.continent}" is not one of ${[...CONTINENTS].join(", ")}`);
    }

    if (destination.description?.type !== "paragraph") {
      found.push(`${label}: description is not a paragraph block`);
    }

    for (const field of ["attractions", "activities", "bestTime"]) {
      const items = destination[field];
      if (!Array.isArray(items) || items.length === 0) {
        found.push(`${label}: ${field} is empty`);
        continue;
      }
      for (const item of items) {
        if (typeof item?.text !== "string" || item.text.trim() === "") {
          found.push(`${label}: ${field} has an item that is not { text }`);
        }
      }
    }

    // A dash surrounded by spaces is a month range, so it must be the en dash
    // (U+2013). Compound words like "Street-food" keep their plain hyphen —
    // that is correct and deliberately not flagged.
    for (const [field, value] of allTextFields(destination)) {
      for (const dash of value.match(/\s[-\u2010-\u2015\u2212]\s/g) || []) {
        const char = dash.trim();
        if (char !== EN_DASH) {
          found.push(
            `${label}: ${field} has "${char}" (U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}) where an en dash (U+2013) belongs`,
          );
        }
      }
    }
  }

  return found;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** The one place the token is used. Nothing else builds an auth header. */
function headers(extra = {}) {
  return { Authorization: `Bearer ${TOKEN}`, ...extra };
}

/**
 * Every request goes through here so the auth header lives in exactly one
 * place, and so a non-2xx answer becomes an Error carrying Strapi's own
 * message rather than a bare status code.
 */
async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${STRAPI_URL}/api/${path}`, {
    method,
    headers: headers(body ? { "Content-Type": "application/json" } : {}),
    body,
    signal: AbortSignal.timeout(TIMEOUT),
  });

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

  return json;
}

/** Entries of a collection as a plain array. */
function rows(json) {
  return Array.isArray(json?.data) ? json.data : [];
}

/**
 * Looks a destination up before creating it, matched on slug. Destination has
 * `name`, not `title`.
 */
async function findExisting(slug) {
  const json = await api(
    `destinations?filters[slug][$eq]=${encodeURIComponent(slug)}&fields[0]=slug&fields[1]=name`,
  );
  return rows(json)[0] ?? null;
}

// ---------------------------------------------------------------------------
// dry run
// ---------------------------------------------------------------------------

/** Renders the repeated component lists for the dry-run listing. */
function printItems(items, indent) {
  for (const item of items) log(`${indent}- ${item.text}`);
}

function printPlan(found) {
  log(`\n=== DESTINATIONS (${DESTINATIONS.length}) ===`);
  for (const destination of DESTINATIONS) {
    log(`\n  ${destination.order}. ${destination.name}   (${destination.slug})`);
    log(`     continent         ${destination.continent}`);
    log(`     shortDescription  ${destination.shortDescription}`);
    log(`     description       [${destination.description.type}] ${destination.description.children[0].text}`);
    log(`     attractions (${destination.attractions.length})`);
    printItems(destination.attractions, "       ");
    log(`     activities (${destination.activities.length})`);
    printItems(destination.activities, "       ");
    log(`     bestTime (${destination.bestTime.length})`);
    printItems(destination.bestTime, "       ");
    log(`     images            (none — not sent, upload in the admin)`);
    log(`     create as         published (POST /api/destinations?status=published)`);
  }

  log("\n=== EXACT REQUEST BODY — first destination (India) ===");
  log("  POST /api/destinations?status=published");
  log("  Content-Type: application/json");
  log("  (Authorization header omitted on purpose — the token is never printed)");
  for (const line of JSON.stringify(destinationPayload(DESTINATIONS[0]), null, 2).split("\n")) {
    log(`    ${line}`);
  }

  log("\n=== WHAT WOULD HAPPEN ===");
  log(`  1. ${DESTINATIONS.length} lookup(s): GET /api/destinations?filters[slug][$eq]=<slug>&fields[0]=slug&fields[1]=name`);
  log("       -> a destination that is already there is logged 'skipped' and left alone");
  log("  2. POST /api/destinations?status=published for each missing destination");
  log("       -> one POST per missing entry; a failure is logged and the run continues");
  log("  3. verification with one plain request, no populate:");
  log("       GET /api/destinations?sort=order&fields[0]=name&fields[1]=slug&pagination[pageSize]=100");
  log("  This script never PUTs, never DELETEs, and never touches a destination it did not create.");

  log("\n=== DRY RUN SUMMARY ===");
  log(`  destinations to create : ${DESTINATIONS.length}`);
  log(`  slugs                  : ${DESTINATIONS.map((d) => d.slug).join(", ")}`);
  log(`  orders                 : ${DESTINATIONS.map((d) => d.order).join(", ")}`);
  log(`  continents used        : ${[...new Set(DESTINATIONS.map((d) => d.continent))].join(", ")}  (all in the enumeration)`);
  log(`  images                 : 0 sent`);
  log(`  problems               : ${found.length}`);
  for (const problem of found) log(`    - ${problem}`);

  log("\n=== POWERSHELL COMMANDS ===");
  log("  # dry run (no requests)");
  log("  node scripts/import-destinations.mjs --dry-run");
  log("");
  log("  # real run");
  log('  $env:STRAPI_URL = "http://localhost:1337"');
  log('  $env:STRAPI_TOKEN = "your-api-token"');
  log("  node scripts/import-destinations.mjs");

  log("\nNothing was sent. Re-run without --dry-run to import.");
}

// ---------------------------------------------------------------------------
// import
// ---------------------------------------------------------------------------

async function importDestinations() {
  log("\n=== DESTINATIONS ===");

  for (const destination of DESTINATIONS) {
    try {
      const existing = await findExisting(destination.slug);
      if (existing) {
        counters.skipped += 1;
        log(
          `  skipped  destination "${destination.slug}" — already exists as "${existing.name}" (documentId ${existing.documentId})`,
        );
        continue;
      }

      const created = await api("destinations?status=published", {
        method: "POST",
        body: JSON.stringify(destinationPayload(destination)),
      });
      const saved = created?.data;
      if (!saved?.documentId) throw new Error("create returned no documentId");

      counters.created += 1;
      log(`  created  destination "${destination.slug}" (documentId ${saved.documentId}, published)`);
    } catch (error) {
      counters.failed += 1;
      log(`  FAILED   destination "${destination.slug}" — ${error.message}`);
    }
  }
}

/** One plain request, no populate — the count and the names. */
async function verify() {
  log("\n=== VERIFICATION ===");
  const all = rows(
    await api("destinations?sort=order&fields[0]=name&fields[1]=slug&pagination[pageSize]=100"),
  );

  log(`  ${all.length} destination${all.length === 1 ? "" : "s"}`);
  for (const row of all) {
    log(`    ${String(row.name ?? "(no name)")}${row.slug ? `  (${row.slug})` : ""}`);
  }
  if (all.length === 0) log("    (none)");

  // Anything not in this import was made by hand and is left exactly as it is.
  const ours = new Set(DESTINATIONS.map((d) => d.slug));
  const untouched = all.filter((row) => !ours.has(row.slug));
  if (untouched.length > 0) {
    log(`    not in this import, left untouched: ${untouched.map((row) => row.slug ?? row.name).join(", ")}`);
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

if (ARGS.includes("--help")) {
  log("usage: node scripts/import-destinations.mjs [--dry-run]");
  log("env:   STRAPI_URL (default http://localhost:1337), STRAPI_TOKEN");
  process.exit(0);
}

const found = problems();

if (DRY_RUN) {
  log("DRY RUN — no requests will be sent, nothing in Strapi will change.");
  log(`  STRAPI_URL : ${STRAPI_URL}`);
  log("  target     : POST /api/destinations (collection, not the single type)");
  log(`  token      : ${TOKEN ? "present (unused in a dry run)" : "not set (not needed for a dry run)"}`);
  log("  idempotency: a destination that already exists is skipped, never updated");
  printPlan(found);
  process.exit(found.length > 0 ? 1 : 0);
}

// The token is required from here on, checked before anything is sent.
if (!TOKEN) {
  fail(
    "\nSTRAPI_TOKEN is not set, so nothing was sent.\n\n" +
      "Set it in the current shell, then re-run:\n" +
      '  $env:STRAPI_TOKEN = "your-api-token"\n\n' +
      "It is read from the environment only — do not commit it anywhere.\n",
  );
  process.exit(1);
}

// An entry the server would reject is caught here rather than half-way through.
if (found.length > 0) {
  fail(`\n${found.length} problem(s) in the data, so nothing was sent:\n${found.map((line) => `  - ${line}`).join("\n")}`);
  process.exit(1);
}

log(`Importing ${DESTINATIONS.length} destinations into ${STRAPI_URL}`);
log("  (token from STRAPI_TOKEN, never printed)");
log("  (no images are sent — upload them in the admin)");

let aborted = null;
try {
  await importDestinations();
  await verify();
} catch (error) {
  // A failure up here (Strapi unreachable, no permission) stops the run; the
  // per-item failures above were already logged and did not.
  aborted = error.message;
  counters.failed += 1;
}

log("\n=== SUMMARY ===");
log(`  created : ${counters.created}`);
log(`  skipped : ${counters.skipped}   (already in Strapi — nothing duplicated)`);
log(`  failed  : ${counters.failed}`);
if (aborted) log(`  aborted : ${aborted}`);

process.exit(counters.failed > 0 ? 1 : 0);