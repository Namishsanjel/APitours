// Builds dist/sitemap.xml from the app's real routes and data files.
//
// The canonical origin comes from the SITE_ORIGIN env var so no domain is
// hardcoded here or in the app:
//   Vercel / CI:  SITE_ORIGIN=https://www.example.com npm run build
// Locally with no SITE_ORIGIN the step logs a warning and writes nothing.
//
// Only canonical, indexable URLs are listed: the static routes from
// src/App.jsx plus one entry per tour, destination and blog post. Legacy
// aliases (/hikes, /journal, old tour slugs) are deliberately excluded.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { HIKES_ALL } from "../src/data/hikes.js";
import { TOUR_DETAILS } from "../src/data/tourDetails.js";
import { DESTINATIONS_ALL } from "../src/data/newPages.js";
import { BLOG_POSTS } from "../src/data/blogPosts.js";
import { PAGES } from "../src/data/content.js";

const here = dirname(fileURLToPath(import.meta.url));
const origin = (process.env.SITE_ORIGIN || "").replace(/\/+$/, "");

const STATIC_PATHS = Object.keys(PAGES);

const paths = [
  ...STATIC_PATHS,
  ...HIKES_ALL.filter((t) => TOUR_DETAILS[t.slug]).map((t) => `/tours/${t.slug}`),
  ...DESTINATIONS_ALL.map((d) => `/destinations/${d.slug}`),
  ...Object.keys(BLOG_POSTS).map((slug) => `/blog/${slug}`),
];

const unique = [...new Set(paths)];

if (!origin) {
  console.warn(
    "[sitemap] SITE_ORIGIN is not set - skipping dist/sitemap.xml. " +
      "Set SITE_ORIGIN to the production origin to generate it.",
  );
} else {
  const urls = unique
    .map((path) => `  <url>\n    <loc>${origin}${path}</loc>\n  </url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  const out = resolve(here, "../dist/sitemap.xml");
  writeFileSync(out, xml, "utf8");
  console.log(`[sitemap] wrote ${unique.length} URLs to dist/sitemap.xml (${origin})`);
}