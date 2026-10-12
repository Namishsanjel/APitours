/**
 * One-off importer: copies the site's hardcoded GALLERY into the Strapi v5
 * `gallery-page` single type.
 *
 * Reads the same data module the /gallery page renders from, so the order and
 * the count can never drift from what the page shows. It does not write to, or
 * otherwise touch, any site file or anything under backend/.
 *
 *   node scripts/import-gallery.mjs --dry-run    # print the plan, no requests
 *   node scripts/import-gallery.mjs              # the real import
 *   node scripts/import-gallery.mjs --force      # re-import over existing photos
 *
 * Env:
 *   STRAPI_URL    default http://localhost:1337
 *   STRAPI_TOKEN  API token with read + create + update rights (required for a
 *                 real import; a dry run makes no requests and does not need one)
 *
 * The token is only ever read from the environment. It is never hardcoded,
 * printed, logged, or written to a file, and it appears in exactly one place in
 * this file — the Authorization header built by `headers()`.
 *
 * alternativeText and caption are deliberately left empty: those are written by
 * hand in the Media Library afterwards, and this script never writes them on a
 * file it did not just upload — so re-running it cannot wipe an editor's work.
 */

import { readFile, stat } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The project's own data module. Read-only import.
import { GALLERY } from "../src/data/pages.js";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const PUBLIC_DIR = resolve(HERE, "..", "public");

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes("--dry-run");
const FORCE = ARGS.includes("--force");

const STRAPI_URL = (process.env.STRAPI_URL || "http://localhost:1337").replace(/\/+$/, "");
const TOKEN = process.env.STRAPI_TOKEN || "";

const SINGLE_TYPE = "gallery-page";

/** Per-request timeout. Uploads get longer: a 1600px JPEG is a few hundred KB. */
const TIMEOUT = 30_000;
const UPLOAD_TIMEOUT = 120_000;

function log(line) {
  process.stdout.write(`${line}\n`);
}

function fail(line) {
  process.stderr.write(`${line}\n`);
}

// ---------------------------------------------------------------------------
// the plan: GALLERY.columns flattened, in the order the page stacks them
// ---------------------------------------------------------------------------

/**
 * The page draws three flex columns side by side, so "file order" means
 * column by column, top to bottom — which is also the order the numbers run in
 * (01..07 in the first column, 08..13 in the second, 14..19 in the third).
 */
function buildPlan() {
  const items = GALLERY.columns.flat().map((item, index) => {
    const file = join(PUBLIC_DIR, item.src.replace(/^\/+/, ""));
    return {
      position: index + 1,
      file,
      name: basename(file),
      // w/h travel with the item so the dry run can show them, but they are
      // not sent: Strapi reads the real dimensions off the uploaded file.
      w: item.w,
      h: item.h,
      bytes: null,
    };
  });

  return { items, problems: [] };
}

async function sizePlan(plan) {
  const problems = [];
  for (const item of plan.items) {
    try {
      const info = await stat(item.file);
      item.bytes = info.size;
    } catch {
      item.bytes = null;
      problems.push(`${item.name}: not found at ${item.file}`);
    }
  }
  plan.problems.push(...problems);
  return plan;
}

/** The exact body sent to Strapi, so the dry run shows what the real run sends. */
function pageBody(mediaIds) {
  return {
    data: {
      badge: GALLERY.badge,
      title: GALLERY.title,
      sub: GALLERY.sub,
      photos: mediaIds,
    },
  };
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
 * message instead of a bare status code.
 *
 * `tolerate` lists the status codes a caller wants to handle rather than throw
 * on — the single type answers 404 when no entry exists yet, which is a normal
 * starting state, not a failure.
 */
async function api(path, { method = "GET", body, extraHeaders = {}, timeout = TIMEOUT, tolerate = [] } = {}) {
  const res = await fetch(`${STRAPI_URL}/api/${path}`, {
    method,
    headers: headers(extraHeaders),
    body,
    signal: AbortSignal.timeout(timeout),
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok && !tolerate.includes(res.status)) {
    const detail = json?.error?.message || text.slice(0, 300) || res.statusText;
    throw new Error(`${method} ${path} -> ${res.status} ${detail}`);
  }

  return { status: res.status, json };
}

/**
 * Looks for a file of the same name already in the Media Library and reuses it.
 * Without this, a run that fails partway through and is then retried leaves a
 * duplicate upload behind for every image it had already sent.
 */
async function findInLibrary(name) {
  const { json } = await api(`upload/files?filters[name][$eq]=${encodeURIComponent(name)}`, {
    tolerate: [404],
  });
  // this endpoint answers with a bare array; tolerate a { data } wrapper too
  const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
  return list.find((file) => file?.id) ?? null;
}

/**
 * Uploads one image, or returns the Media Library's copy of it.
 *
 * alternativeText and caption are left unset on purpose — the editor writes
 * them by hand afterwards.
 */
async function uploadImage(item) {
  const existing = await findInLibrary(item.name);
  if (existing) {
    log(`         reused  ${item.name} (media id ${existing.id})`);
    return existing;
  }

  const buffer = await readFile(item.file);

  const form = new FormData();
  form.append("files", new Blob([buffer]), item.name);
  // name only: no alternativeText, no caption, so the Media Library copy stays
  // exactly as the editor leaves it and a later re-run cannot clear it.
  form.append("fileInfo", JSON.stringify({ name: item.name }));
  // No Content-Type here on purpose: fetch has to set the multipart boundary
  // itself, and overriding it produces a body Strapi cannot parse.
  const { json } = await api("upload", {
    method: "POST",
    body: form,
    timeout: UPLOAD_TIMEOUT,
  });

  const media = Array.isArray(json) ? json[0] : json?.data?.[0] ?? json;
  if (!media?.id) throw new Error("upload returned no media id");

  log(`         uploaded ${item.name} (media id ${media.id})`);
  return media;
}

/** What the single type currently holds, or null when it has no entry yet. */
async function currentState() {
  const { status, json } = await api(`${SINGLE_TYPE}?populate[photos][fields][0]=url`, {
    tolerate: [404],
  });
  if (status === 404) return null;
  const data = json?.data;
  if (!data) return null;
  const photos = Array.isArray(data.photos) ? data.photos : [];
  return { documentId: data.documentId, publishedAt: data.publishedAt ?? null, photos };
}

// ---------------------------------------------------------------------------
// dry run
// ---------------------------------------------------------------------------

function printPlan(plan) {
  log("\n=== SOURCE — GALLERY from src/data/pages.js ===");
  log(`  badge  ${GALLERY.badge}`);
  log(`  title  ${GALLERY.title}`);
  log(`  sub    ${GALLERY.sub}`);
  log(`  columns ${GALLERY.columns.length} (${GALLERY.columns.map((c) => c.length).join(" / ")} images)`);
  log(`  flattened, in file order: ${plan.items.length} photo(s)`);

  log("\n=== FILES ===");
  log("  #   file            on disk     GALLERY w x h    note");
  for (const item of plan.items) {
    const size = item.bytes == null ? "MISSING" : `${(item.bytes / 1024).toFixed(0).padStart(4)} KB`;
    const dims = `${item.w} x ${item.h}`;
    log(
      `  ${String(item.position).padStart(2)}  ${item.name.padEnd(14)} ${size}   ${dims.padEnd(14)}  ${
        item.bytes == null ? "would abort the run" : "ready"
      }`,
    );
  }
  const total = plan.items.reduce((sum, item) => sum + (item.bytes ?? 0), 0);
  log(`      ${"".padEnd(14)} ${`${(total / 1024 / 1024).toFixed(2)} MB`.padStart(4)} total`);
}

function printBody() {
  log("\n=== REQUEST BODY (exact) ===");
  log(`  PUT /api/${SINGLE_TYPE}?status=published`);
  log("  Content-Type: application/json");
  log("  (Authorization header omitted on purpose — the token is never printed)");
  log("  media ids are unknown until the uploads run, so they are placeholders:");
  const body = pageBody(PLAN.items.map(() => "<media id>"));
  for (const line of JSON.stringify(body, null, 2).split("\n")) log(`    ${line}`);
}

function printDryRun(plan) {
  log("DRY RUN — no requests will be sent, nothing in Strapi will change.");
  log(`  STRAPI_URL : ${STRAPI_URL}`);
  log(`  target     : PUT /api/${SINGLE_TYPE}?status=published  (single type)`);
  log(`  token      : ${TOKEN ? "present (unused in a dry run)" : "not set (not needed for a dry run)"}`);
  log(`  force      : ${FORCE}`);

  printPlan(plan);
  printBody();

  log("\n=== WHAT WOULD HAPPEN ===");
  log(`  1. GET  /api/${SINGLE_TYPE}?populate[photos][fields][0]=url`);
  log("       -> if it already has photos, stop here unless --force is passed");
  log(`  2. ${plan.items.length} media lookup(s) on GET /api/upload/files?filters[name][$eq]=<file>`);
  log("       -> a file of the same name already in the Media Library is reused, never re-uploaded");
  log(`  3. POST /api/upload for whichever files were not found`);
  log("       -> fileInfo carries { name } only: alternativeText and caption stay empty for you to write");
  log(`  4. PUT  /api/${SINGLE_TYPE}?status=published with badge, title, sub and ${plan.items.length} media ids in file order`);
  log(`  5. GET  /api/${SINGLE_TYPE}?status=published&populate[photos] -> print published state, count, first photo url/width/height`);

  log("\n=== DRY RUN SUMMARY ===");
  log(`  photos in GALLERY     : ${plan.items.length}`);
  log(`  files found on disk   : ${plan.items.filter((i) => i.bytes != null).length}`);
  log(`  bytes to upload (max) : ${(plan.items.reduce((s, i) => s + (i.bytes ?? 0), 0) / 1024 / 1024).toFixed(2)} MB`);
  log(`  alternativeText       : left empty on purpose`);
  log(`  caption               : left empty on purpose`);
  log(`  problems              : ${plan.problems.length}`);
  for (const problem of plan.problems) log(`    - ${problem}`);

  log("\nNothing was sent. Re-run without --dry-run to import.");
}

// ---------------------------------------------------------------------------
// import
// ---------------------------------------------------------------------------

async function run(plan) {
  log(`Importing ${plan.items.length} photo(s) into ${SINGLE_TYPE} at ${STRAPI_URL}`);
  log(`  (token from STRAPI_TOKEN, never printed)`);

  log(`\n=== CURRENT STATE ===`);
  const before = await currentState();
  if (!before) {
    log("  no entry yet — this will create the first draft and publish it");
  } else {
    log(`  documentId ${before.documentId}, ${before.photos.length} photo(s) already attached`);
    log(`  published  ${before.publishedAt ? "yes" : "no"}`);
    if (before.photos.length > 0 && !FORCE) {
      log(
        "\nAlready has photos, so there is nothing to do. Re-run with --force to replace them:\n" +
          "  node scripts/import-gallery.mjs --force",
      );
      return 0;
    }
    if (before.photos.length > 0) {
      log("  --force: the existing photo list will be replaced by the files below");
    }
  }

  log("\n=== MEDIA ===");
  const ids = [];
  const failures = [];
  for (const item of plan.items) {
    try {
      const media = await uploadImage(item);
      ids.push(media.id);
    } catch (error) {
      failures.push(`${item.name}: ${error.message}`);
      log(`         FAILED  ${item.name} — ${error.message}`);
    }
  }

  // A partial gallery must never reach the published page: bail out with the
  // media already uploaded (harmless, and reused on the next run) rather than
  // publishing a gallery that is missing photos.
  if (failures.length > 0) {
    fail(
      `\n${failures.length} of ${plan.items.length} upload(s) failed, so ${SINGLE_TYPE} was left untouched:\n` +
        failures.map((line) => `  - ${line}`).join("\n") +
        "\n\nRe-run once the problem is fixed — the uploads that did succeed are reused, not repeated.",
    );
    return 1;
  }

  log(`\n=== PUBLISHING ===`);
  const { json } = await api(`${SINGLE_TYPE}?status=published`, {
    method: "PUT",
    extraHeaders: { "Content-Type": "application/json" },
    body: JSON.stringify(pageBody(ids)),
  });

  const saved = json?.data;
  if (!saved) {
    fail(`PUT ${SINGLE_TYPE} returned no data — nothing was confirmed as saved.`);
    return 1;
  }
  log(`  saved ${SINGLE_TYPE} (documentId ${saved.documentId}) with ${ids.length} photo(s)`);

  await verify();

  log("\n=== SUMMARY ===");
  log(`  uploaded or reused : ${ids.length}`);
  log(`  failed             : 0`);
  return 0;
}

/** Reads the published single type back and reports what Strapi actually holds. */
async function verify() {
  log("\n=== VERIFICATION ===");

  const { json } = await api(`${SINGLE_TYPE}?status=published&populate[photos]`);
  const page = json?.data;
  if (!page) {
    fail("  could not read the single type back");
    return;
  }

  const photos = Array.isArray(page.photos) ? page.photos : [];
  const published = Boolean(page.publishedAt);

  log(`  published   : ${published ? "yes" : "NO — the PUT did not publish"}`);
  log(`  photo count : ${photos.length}`);
  log(`  badge       : ${page.badge ?? "(empty)"}`);
  log(`  title       : ${page.title ?? "(empty)"}`);

  const first = photos[0];
  if (first) {
    log("\n  first photo:");
    log(`    url    ${first.url ?? "(none)"}`);
    log(`    width  ${first.width ?? "(none)"}`);
    log(`    height ${first.height ?? "(none)"}`);
  } else {
    log("\n  first photo: (none — the list came back empty)");
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

const PLAN = buildPlan();

if (ARGS.includes("--help")) {
  log("usage: node scripts/import-gallery.mjs [--dry-run] [--force]");
  log("env:   STRAPI_URL (default http://localhost:1337), STRAPI_TOKEN");
  process.exit(0);
}

await sizePlan(PLAN);

if (DRY_RUN) {
  printDryRun(PLAN);
  process.exit(PLAN.problems.length > 0 ? 1 : 0);
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

// Files the plan could not find are fatal: an import that silently dropped a
// photo would publish a gallery with a gap in it.
if (PLAN.problems.length > 0) {
  fail(
    `\n${PLAN.problems.length} file(s) in GALLERY are not in public/img/gallery, so nothing was sent:\n` +
      PLAN.problems.map((line) => `  - ${line}`).join("\n") +
      "\n\nRun with --dry-run to see the full plan.",
  );
  process.exit(1);
}

let code = 0;
try {
  code = await run(PLAN);
} catch (error) {
  // A failure up here (unreachable Strapi, no permission on the collection)
  // stops the run.
  fail(`\nImport aborted: ${error.message}`);
  code = 1;
}

process.exit(code);