/**
 * One-off importer: creates the Services and FAQs in Strapi v5 over the REST API.
 *
 * Nothing is ever updated or deleted — this only ever POSTs. Entries that are
 * already in Strapi (including anything you made by hand) are looked up first
 * and skipped, so a second run changes nothing.
 *
 *   node scripts/import-services-faqs.mjs --dry-run    # print the plan, no requests
 *   node scripts/import-services-faqs.mjs              # the real import
 *
 * Env:
 *   STRAPI_URL    default http://localhost:1337
 *   STRAPI_TOKEN  API token with read + create rights (required for a real
 *                 import; a dry run makes no requests and does not need one)
 *
 * The token is only ever read from the environment. It is never hardcoded,
 * printed, logged, or written to a file, and it appears in exactly one place in
 * this file — the Authorization header built by `headers()`.
 */

// ---------------------------------------------------------------------------
// constants
// ---------------------------------------------------------------------------

/**
 * Placeholder — replace with the real number. It is only used inside one FAQ
 * answer, and lives here so there is a single place to change it.
 */
const SUPPORT_PHONE = "9800000000";

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes("--dry-run");

const STRAPI_URL = (process.env.STRAPI_URL || "http://localhost:1337").replace(/\/+$/, "");
const TOKEN = process.env.STRAPI_TOKEN || "";

/** Only the one entry that stays unpublished. Everything else is published. */
const DRAFT_SLUG = "hotel-booking";

/** The FAQ category enumeration, checked before a single request goes out. */
const FAQ_CATEGORIES = new Set(["general", "pricing", "services", "support"]);

const TIMEOUT = 30_000;

// ---------------------------------------------------------------------------
// blocks helpers
// ---------------------------------------------------------------------------

/** One paragraph block. */
function paragraph(text) {
  return { type: "paragraph", children: [{ type: "text", text: String(text) }] };
}

/** One unordered list block from plain strings. */
function bulletList(items) {
  return {
    type: "list",
    format: "unordered",
    children: items.map((text) => ({
      type: "list-item",
      children: [{ type: "text", text: String(text) }],
    })),
  };
}

/**
 * A Strapi blocks array from plain text and string arrays:
 *
 *   blocks("A paragraph.")
 *   blocks(["First bullet", "Second bullet"])
 *   blocks("What we need from you:", ["From", "Departure date"])
 *
 * A string becomes a paragraph block, an array becomes one list block. Mixing
 * them in one call is how a description is a few paragraphs and then a list.
 */
function blocks(...parts) {
  return parts.map((part) => (Array.isArray(part) ? bulletList(part) : paragraph(part)));
}

// ---------------------------------------------------------------------------
// the entries
// ---------------------------------------------------------------------------

/** description is left off hotel-booking on purpose — it stays empty. */
const SERVICES = [
  {
    title: "Flight Ticketing",
    slug: "flight-ticketing",
    order: 1,
    shortDescription:
      "Flight bookings, one-way or round-trip, for adults, children and infants.",
    description: blocks(
      "Tell us where you are flying from and to, when you want to travel, and who is travelling, and we will arrange your flight tickets.",
      "What we need from you:",
      [
        "From and destination",
        "Departure date and return date",
        "One-way or round-trip",
        "Number of adults, children and infants",
      ],
    ),
  },
  {
    title: "Holiday Packages",
    slug: "holiday-packages",
    order: 2,
    shortDescription:
      "Domestic and international tours for families, couples, groups and adventure or pilgrimage travellers.",
    description: blocks([
      "Domestic and international tours",
      "Fixed departure packages",
      "Family, honeymoon and group tours",
      "Adventure and pilgrimage tours",
      "Special festival packages",
    ]),
  },
  {
    title: "Helicopter Services",
    slug: "helicopter-services",
    order: 3,
    shortDescription: "Everest helicopter tours and heli sightseeing.",
    description: blocks(["Everest helicopter tour", "Heli sightseeing"]),
  },
  {
    title: "Car Rental and Transfers",
    slug: "car-rental-and-transfers",
    order: 4,
    shortDescription:
      "Airport transfers, city transfers and vehicle rental, with or without a driver.",
    description: blocks([
      "Airport pickup and drop",
      "Kathmandu city transfer",
      "Jeep, Hiace and bus",
      "Private car with driver",
    ]),
  },
  {
    title: "Visa Assistance",
    slug: "visa-assistance",
    order: 5,
    shortDescription: "Help with tourist visas, documentation and travel insurance.",
    description: blocks([
      "Tourist visa assistance",
      "Visa documentation guidance",
      "Travel insurance",
    ]),
  },
  {
    title: "Hotel Booking",
    slug: DRAFT_SLUG,
    order: 6,
    shortDescription: "Hotel reservations for your trip.",
    // description omitted on purpose: the client has not sent the details yet.
  },
];

const FAQS = [
  {
    question: "What services do you offer?",
    answer: blocks(
      "We offer flight ticketing, holiday packages, helicopter services, car rental and transfers, visa assistance, and hotel booking, all arranged by one team.",
    ),
    category: "general",
    order: 1,
  },
  {
    question: "How do I book a service or request a quote?",
    answer: blocks(
      `Send us your details through the contact form, and our team will reply with options and a quote. You can also call us on ${SUPPORT_PHONE}.`,
    ),
    category: "general",
    order: 2,
  },
  {
    question: "What do I need to give you to book a flight?",
    answer: blocks(
      "Please share where you are flying from and to, your departure date and return date (if any), whether the trip is one-way or round-trip, and the number of adults, children and infants travelling.",
    ),
    category: "services",
    order: 3,
  },
  {
    question: "What types of holiday packages do you offer?",
    answer: blocks(
      "We arrange domestic and international tours, including fixed departure packages, family, honeymoon and group tours, adventure and pilgrimage tours, and special festival packages.",
    ),
    category: "services",
    order: 4,
  },
  {
    question: "Can you customise a package for my group?",
    answer: blocks(
      "Yes. Tell us your dates, group size and interests, and we will suggest a plan to match.",
    ),
    category: "services",
    order: 5,
  },
  {
    question: "What helicopter services do you offer?",
    answer: blocks(
      "We offer Everest helicopter tours and heli sightseeing. Contact us with your preferred date and group size to check availability.",
    ),
    category: "services",
    order: 6,
  },
  {
    question: "What does car rental and transfers include?",
    answer: blocks(
      "We provide airport pickup and drop, Kathmandu city transfers, and rentals of jeeps, Hiace vans and buses. You can also book a private car with a driver.",
    ),
    category: "services",
    order: 7,
  },
  {
    question: "Can you help with my visa?",
    answer: blocks(
      "Yes. We assist with tourist visas and guide you through the documents you need. Requirements depend on your nationality, so contact us before you travel. We also arrange travel insurance.",
    ),
    category: "services",
    order: 8,
  },
  {
    question: "Do you book hotels?",
    answer: blocks("Yes, we can arrange hotel bookings as part of your trip or separately."),
    category: "services",
    order: 9,
  },
];

// ---------------------------------------------------------------------------
// payloads
// ---------------------------------------------------------------------------

/** The exact service body, so the dry run shows what the real run sends. */
function servicePayload(service) {
  const data = {
    title: service.title,
    slug: service.slug,
    order: service.order,
    shortDescription: service.shortDescription,
  };
  // left out entirely rather than sent as null, so the field stays empty
  if (service.description) data.description = service.description;
  return { data };
}

/** The exact FAQ body. */
function faqPayload(faq) {
  return {
    data: {
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order,
    },
  };
}

/** Published, except the one entry that stays a draft. */
function serviceCreatePath(service) {
  return service.slug === DRAFT_SLUG ? "services" : "services?status=published";
}

const counters = { created: 0, skipped: 0, failed: 0 };

function log(line) {
  process.stdout.write(`${line}\n`);
}

function fail(line) {
  process.stderr.write(`${line}\n`);
}

/**
 * Everything that can be checked without talking to Strapi, checked before a
 * request goes out — a category outside the enumeration would be rejected by
 * the server, and a dry run should catch it too.
 */
function problems() {
  const found = [];

  const slugs = new Set();
  for (const service of SERVICES) {
    if (!service.title || !service.slug) found.push(`service ${service.slug}: missing title or slug`);
    if (slugs.has(service.slug)) found.push(`service ${service.slug}: duplicated slug in this import`);
    slugs.add(service.slug);
    for (const [i, block] of (service.description || []).entries()) {
      if (block.type !== "paragraph" && block.type !== "list") {
        found.push(`service ${service.slug}: block ${i} is a "${block.type}"`);
      }
    }
  }

  const questions = new Set();
  for (const faq of FAQS) {
    if (!faq.question || !faq.answer?.length) found.push(`faq "${faq.question}": missing question or answer`);
    if (questions.has(faq.question)) found.push(`faq "${faq.question}": duplicated question in this import`);
    questions.add(faq.question);
    // the category enumeration rejects anything not in it
    if (!FAQ_CATEGORIES.has(faq.category)) {
      found.push(`faq "${faq.question}": category "${faq.category}" is not one of ${[...FAQ_CATEGORIES].join(", ")}`);
    }
    for (const [i, block] of faq.answer.entries()) {
      if (block.type !== "paragraph" && block.type !== "list") {
        found.push(`faq "${faq.question}": block ${i} is a "${block.type}"`);
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
 * Looks an entry up before creating it. Services are matched on slug, FAQs on
 * the question text — an FAQ has no slug and no title field.
 */
async function findExisting(collection, field, value, labelField) {
  const json = await api(
    `${collection}?filters[${field}][$eq]=${encodeURIComponent(value)}&fields[0]=${field}&fields[1]=${labelField}`,
  );
  return rows(json)[0] ?? null;
}

// ---------------------------------------------------------------------------
// dry run
// ---------------------------------------------------------------------------

/** Renders a blocks array back to readable text for the dry run listing. */
function printBlocks(blocksValue, indent) {
  if (!blocksValue) {
    log(`${indent}(field omitted — stays empty)`);
    return;
  }
  for (const block of blocksValue) {
    if (block.type === "paragraph") {
      log(`${indent}[paragraph] ${block.children[0].text}`);
    } else {
      log(`${indent}[list/${block.format}] ${block.children.length} item(s):`);
      for (const item of block.children) log(`${indent}  - ${item.children[0].text}`);
    }
  }
}

function printPlan(found) {
  log("\n=== SERVICES (6) ===");
  for (const service of SERVICES) {
    const draft = service.slug === DRAFT_SLUG;
    log(`\n  ${service.order}. ${service.title}   (${service.slug})`);
    log(`     shortDescription  ${service.shortDescription}`);
    log(`     description       ${service.description ? `${service.description.length} block(s)` : "omitted"}`);
    printBlocks(service.description, "     ");
    log(`     image             (none — not sent)`);
    log(`     create as         ${draft ? "DRAFT (POST /api/services, no status parameter)" : "published (POST /api/services?status=published)"}`);
  }

  log("\n=== FAQS (9) ===");
  log("  (no slug and no title field — matched on the question text)");
  for (const faq of FAQS) {
    log(`\n  ${faq.order}. [${faq.category}] ${faq.question}`);
    log(`     answer ${faq.answer.length} block(s):`);
    printBlocks(faq.answer, "     ");
    log(`     create as         published (POST /api/faqs?status=published)`);
  }

  log("\n=== EXACT REQUEST BODY — first service ===");
  log("  POST /api/services?status=published");
  log("  Content-Type: application/json");
  log("  (Authorization header omitted on purpose — the token is never printed)");
  for (const line of JSON.stringify(servicePayload(SERVICES[0]), null, 2).split("\n")) log(`    ${line}`);

  log("\n=== EXACT REQUEST BODY — first FAQ ===");
  log("  POST /api/faqs?status=published");
  log("  Content-Type: application/json");
  for (const line of JSON.stringify(faqPayload(FAQS[0]), null, 2).split("\n")) log(`    ${line}`);

  log("\n=== THE DRAFT, FOR COMPARISON ===");
  log(`  POST /api/${serviceCreatePath(SERVICES[SERVICES.length - 1])}   <- no status parameter, stays a draft`);
  for (const line of JSON.stringify(servicePayload(SERVICES[SERVICES.length - 1]), null, 2).split("\n")) {
    log(`    ${line}`);
  }

  log("\n=== WHAT WOULD HAPPEN ===");
  log(`  1. ${SERVICES.length} lookup(s): GET /api/services?filters[slug][$eq]=<slug>&fields[0]=slug&fields[1]=title`);
  log(`  2. ${FAQS.length} lookup(s): GET /api/faqs?filters[question][$eq]=<question>&fields[0]=question`);
  log("       -> an entry that is already there is logged 'skipped' and left alone");
  log("  3. POST /api/services (published, except the draft) and POST /api/faqs?status=published for the rest");
  log("       -> one POST per missing entry; a failure is logged and the run continues");
  log("  4. verification with plain requests, no populate: the count, the titles, and which are published");
  log("  This script never PUTs, never DELETEs, and never touches an entry it did not create.");

  log("\n=== DRY RUN SUMMARY ===");
  log(`  services to create : ${SERVICES.length}  (1 of them a draft: ${DRAFT_SLUG})`);
  log(`  faqs to create     : ${FAQS.length}`);
  log(`  categories used    : ${[...new Set(FAQS.map((f) => f.category))].join(", ")}  (all in the enumeration)`);
  log(`  support phone      : ${SUPPORT_PHONE}  (one constant at the top of this file)`);
  log(`  problems           : ${found.length}`);
  for (const problem of found) log(`    - ${problem}`);

  log("\n=== POWERSHELL COMMANDS ===");
  log("  # dry run (no requests)");
  log("  node scripts/import-services-faqs.mjs --dry-run");
  log("");
  log("  # real run");
  log('  $env:STRAPI_URL = "http://localhost:1337"');
  log('  $env:STRAPI_TOKEN = "your-api-token"');
  log("  node scripts/import-services-faqs.mjs");

  log("\nNothing was sent. Re-run without --dry-run to import.");
}

// ---------------------------------------------------------------------------
// import
// ---------------------------------------------------------------------------

async function importServices() {
  log("\n=== SERVICES ===");

  for (const service of SERVICES) {
    try {
      const existing = await findExisting("services", "slug", service.slug, "title");
      if (existing) {
        counters.skipped += 1;
        log(`  skipped  service "${service.slug}" — already exists as "${existing.title}" (documentId ${existing.documentId})`);
        continue;
      }

      const draft = service.slug === DRAFT_SLUG;
      const created = await api(serviceCreatePath(service), {
        method: "POST",
        body: JSON.stringify(servicePayload(service)),
      });
      const saved = created?.data;
      if (!saved?.documentId) throw new Error("create returned no documentId");

      counters.created += 1;
      log(
        `  created  service "${service.slug}" (documentId ${saved.documentId}${draft ? ", left as a DRAFT" : ", published"})`,
      );
    } catch (error) {
      counters.failed += 1;
      log(`  FAILED   service "${service.slug}" — ${error.message}`);
    }
  }
}

async function importFaqs() {
  log("\n=== FAQS ===");

  for (const faq of FAQS) {
    try {
      const existing = await findExisting("faqs", "question", faq.question, "question");
      if (existing) {
        counters.skipped += 1;
        log(`  skipped  faq "${faq.question}" (documentId ${existing.documentId})`);
        continue;
      }

      const created = await api("faqs?status=published", {
        method: "POST",
        body: JSON.stringify(faqPayload(faq)),
      });
      const saved = created?.data;
      if (!saved?.documentId) throw new Error("create returned no documentId");

      counters.created += 1;
      log(`  created  faq "${faq.question}" (documentId ${saved.documentId}, published)`);
    } catch (error) {
      counters.failed += 1;
      log(`  FAILED   faq "${faq.question}" — ${error.message}`);
    }
  }
}

/**
 * Verification with plain requests only — no populate anywhere.
 *
 * A default GET returns drafts, so the published list is fetched as a second
 * plain request and the two are compared. That names the unpublished entries
 * without depending on publishedAt being selectable in fields[].
 */
async function verifyCollection(collection, labelField) {
  const all = rows(
    await api(
      `${collection}?sort=order&fields[0]=${labelField}&fields[1]=slug&pagination[pageSize]=100`,
    ),
  );
  const published = rows(
    await api(
      `${collection}?status=published&sort=order&fields[0]=${labelField}&fields[1]=slug&pagination[pageSize]=100`,
    ),
  );
  const publishedLabels = new Set(published.map((row) => row[labelField]));

  log(`\n  ${collection}: ${all.length} entr${all.length === 1 ? "y" : "ies"}`);
  for (const row of all) {
    const label = String(row[labelField] ?? "(no label)");
    const isPublished = publishedLabels.has(row[labelField]);
    log(`    ${isPublished ? "published" : "DRAFT    "}  ${label}${row.slug ? `  (${row.slug})` : ""}`);
  }
  if (all.length === 0) log("    (none)");

  // Anything not in this import was made by hand and is left exactly as it is.
  const ours = new Set(
    collection === "services" ? SERVICES.map((s) => s.title) : FAQS.map((f) => f.question),
  );
  const untouched = all.filter((row) => !ours.has(row[labelField]));
  if (untouched.length > 0) {
    log(`    not in this import, left untouched: ${untouched.map((row) => row[labelField]).join(", ")}`);
  }

  return all.length;
}

async function verify() {
  log("\n=== VERIFICATION ===");
  log("  (plain requests, no populate)");
  try {
    await verifyCollection("services", "title");
  } catch (error) {
    fail(`  services verification failed: ${error.message}`);
  }
  try {
    await verifyCollection("faqs", "question");
  } catch (error) {
    fail(`  faqs verification failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

if (ARGS.includes("--help")) {
  log("usage: node scripts/import-services-faqs.mjs [--dry-run]");
  log("env:   STRAPI_URL (default http://localhost:1337), STRAPI_TOKEN");
  process.exit(0);
}

const found = problems();

if (DRY_RUN) {
  log("DRY RUN — no requests will be sent, nothing in Strapi will change.");
  log(`  STRAPI_URL : ${STRAPI_URL}`);
  log(`  target     : POST /api/services and POST /api/faqs (collections, not the single type)`);
  log(`  token      : ${TOKEN ? "present (unused in a dry run)" : "not set (not needed for a dry run)"}`);
  log("  idempotency: an entry that already exists is skipped, never updated");
  printPlan(found);
  process.exit(found.length > 0 ? 1 : 0);
}

// The token is required from here on, checked before anything is sent.
if (!TOKEN) {
  fail(
    "\nSTRAPI_TOKEN is not set.\n\n" +
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

log(`Importing ${SERVICES.length} services and ${FAQS.length} FAQs into ${STRAPI_URL}`);
log("  (token from STRAPI_TOKEN, never printed)");

let aborted = null;
try {
  await importServices();
  await importFaqs();
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