import { useEffect, useMemo, useRef, useState } from "react";
import { NAV_LINKS } from "../data/content.js";
import { DESTINATIONS_PAGE } from "../data/newPages.js";
import { HIKES_PAGE } from "../data/hikes.js";
import { ImgBlur } from "./ui.jsx";
import { useReveal } from "../motion.js";
import {
  useGlobalState,
  useStrapiToursState,
  useStrapiDestinationsState,
  imageOf,
  STRAPI_STATUS,
} from "../lib/strapiData.jsx";
import { tourListings, destinationList } from "../lib/catalog.js";
import { NavMenuSkeleton, LogoSkeleton } from "./skeletons.jsx";
import { Skeleton, SkeletonRegion } from "./Skeleton.jsx";
import { SectionErrorInline, SectionEmptyInline } from "./SectionError.jsx";

/**
 * Tours as the listing records.
 *
 * `listings` is empty whenever the collection is errored or empty, and the
 * status comes back with it so each menu can say which of the two it is rather
 * than rendering an empty panel.
 */
function useTourListings() {
  const { data, status, retry } = useStrapiToursState();
  const listings = useMemo(() => tourListings(data), [data]);
  return { listings, status, retry };
}

/**
 * Destinations as the records the menus read, sorted on `order`.
 *
 * The same provider and the same `destinationList` adapter DestinationsPage
 * uses, so the bar and the page share one cached request — the destinations
 * collection is fetched once in StrapiProvider, never once per mount.
 */
function useDestinations() {
  const { data, status, retry } = useStrapiDestinationsState();
  const destinations = useMemo(() => {
    return [...destinationList(data)].sort(
      (a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER),
    );
  }, [data]);
  return { destinations, status, retry };
}

/** The 11x7 chevron the booking form's select already uses, pointed down. */
function ChevronDown({ className = "" }) {
  return (
    <svg className={className} width="11" height="7" viewBox="0 0 11 7" fill="none" aria-hidden="true">
      <path
        d="M1 1 5.5 5.6 10 1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Regions read "Country · Area"; the list already shows the country.
 *
 * Strapi's shortDescription uses the same shape ("India · Golden Triangle and
 * beyond"), so this is unchanged — but an entry with no region, or one with no
 * " · " in it, must not throw on the way to rendering the rest of the menu.
 */
function areaOf(dest) {
  return String(dest?.region ?? "").split("·").pop().trim();
}

/**
 * Destination preview — the destinations page card (photo + grad-card +
 * ImgBlur + glass region chip + name + cream CTA) at menu size, with the
 * page's body copy set beside the name.
 *
 * A destination with no image published renders as the same card over the
 * mist background instead of an <img> with no src. Its height is a minimum
 * rather than a fixed 300/380px, so with a longer list the card grows with the
 * list beside it rather than leaving a gap under it.
 */
function DestinationPreview({ dest }) {
  return (
    <a href={`/destinations/${dest.slug}`} className="relative min-w-0 flex-1 rounded-lg bg-mist p-1">
      <div className="relative h-full min-h-[300px] w-full overflow-hidden rounded min-[1100px]:min-h-[380px]">
        {dest.image ? (
          <img src={dest.image} alt={dest.alt} className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="grad-card absolute inset-0" />
        <ImgBlur />
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-6">
          <div className="flex flex-wrap gap-2">
            <span className="chip">{dest.region}</span>
          </div>
          <div className="flex items-end justify-between gap-4 min-[1100px]:gap-8">
            <div className="flex min-w-0 flex-col gap-3">
              <h3 className="t-h3l text-mist">{dest.name}</h3>
              <p className="t-body max-w-[430px] text-mist max-[1099.98px]:hidden">{dest.body}</p>
            </div>
            <span className="btn btn-cream w-[104px]">explore</span>
          </div>
        </div>
      </div>
    </a>
  );
}

/**
 * Destinations mega-menu: the page's continent groups down the left (name +
 * area, in the order the page files them), the hovered destination's card
 * filling the right, and the banner the page closes with underneath. Flush
 * with the nav bar above it — the bar itself turns white while this is open,
 * so the two read as one panel.
 *
 * The list is the Strapi one (`useDestinations`), already sorted on `order`.
 * `destinationList` maps Strapi's continent enumeration back to the same
 * labels DESTINATIONS_PAGE.groups is written in — south_america reads as
 * "South America" here — so the grouping below is unchanged code.
 */
function DestinationsMenu({ onNavigate }) {
  const { destinations, status, retry } = useDestinations();
  const [active, setActive] = useState(() => destinations[0]?.slug ?? null);
  const groups = DESTINATIONS_PAGE.groups
    .map((group) => destinations.filter((d) => d.continent === group))
    .filter((list) => list.length);
  const total = groups.reduce((n, list) => n + list.length, 0);
  const current = destinations.find((d) => d.slug === active) ?? destinations[0];
  const currentSlug = current?.slug ?? null;

  // Still in flight: the rows of the menu and the count beside its closing link
  // are both read off the collection, so both are held. The hovered
  // destination's card has nothing to show yet and is left out rather than
  // filled with a placeholder photo.
  if (status === STRAPI_STATUS.LOADING) {
    return (
      <div id="nav-destinations-menu" className="absolute inset-x-0 top-full hidden min-[1024px]:block">
        <NavMenuSkeleton
          rows={destinations.length}
          label="Loading destinations…"
          linkLabel="All destinations"
          linkHref="/destinations"
          ctaLabel="Browse all tours"
          ctaHref="/tours"
          onNavigate={onNavigate}
        />
      </div>
    );
  }

  /* A failed request, or a collection with nothing published: the panel says so
     where its rows would have been and keeps every static link below, so the
     rest of the bar still works. The count line is dropped in both cases — it
     is read off a collection we do not have, and "0 destinations" would be a
     different lie. */
  if (status === STRAPI_STATUS.ERROR || status === STRAPI_STATUS.EMPTY) {
    return (
      <div id="nav-destinations-menu" className="absolute inset-x-0 top-full hidden min-[1024px]:block">
        <div className="menu-in flex max-h-[calc(100dvh-92px)] flex-col gap-2 overflow-y-auto overscroll-contain rounded-b-lg bg-cream p-6">
          {status === STRAPI_STATUS.ERROR ? (
            <SectionErrorInline onRetry={retry} />
          ) : (
            <SectionEmptyInline />
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-5">
            <a href="/destinations" onClick={onNavigate} className="t-link text-ink underline underline-offset-4">
              All destinations
            </a>
            <a href="/tours" onClick={onNavigate} className="btn btn-dark w-[150px]">
              Browse all tours
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="nav-destinations-menu" className="absolute inset-x-0 top-full hidden min-[1024px]:block">
      <div className="menu-in flex max-h-[calc(100dvh-92px)] flex-col gap-5 overflow-y-auto overscroll-contain rounded-b-lg bg-cream p-6">
        <div className="flex gap-5">
          <nav className="flex w-[260px] shrink-0 flex-col min-[1100px]:w-[360px]">
            {groups.flat().map((d) => (
              <a
                key={d.slug}
                href={`/destinations/${d.slug}`}
                onClick={onNavigate}
                onMouseEnter={() => setActive(d.slug)}
                onFocus={() => setActive(d.slug)}
                aria-current={d.slug === currentSlug ? "true" : undefined}
                className={`flex flex-1 items-center justify-between gap-3 rounded-lg px-3 transition-colors ${
                  d.slug === currentSlug ? "bg-mist" : "hover:bg-mist"
                }`}
              >
                <span className={`t-h6 min-w-0 truncate ${d.slug === currentSlug ? "text-primary" : "text-ink"}`}>
                  {d.name}
                </span>
                {/* the area can now be a whole phrase ("Golden Triangle and
                    beyond"), so it truncates like the name rather than taking a
                    fixed share the name then has to give back */}
                <span className="t-eyebrow-s min-w-0 truncate text-smoke">{areaOf(d)}</span>
              </a>
            ))}
          </nav>

          {current ? <DestinationPreview dest={current} /> : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-5">
          <div className="flex flex-wrap items-center gap-4 min-[1100px]:gap-6">
            <p className="t-eyebrow text-smoke">
              {total} destinations · {groups.length} continents
            </p>
            <a href="/destinations" onClick={onNavigate} className="t-link text-ink underline underline-offset-4">
              All destinations
            </a>
          </div>
          <a href="/tours" onClick={onNavigate} className="btn btn-dark w-[150px]">
            Browse all tours
          </a>
        </div>
      </div>
    </div>
  );
}

/** Tours grouped by their difficulty chip; "All" is a filter, not a level. */
const DIFFICULTIES = HIKES_PAGE.filters.filter((f) => f !== "All");

/**
 * Package preview — the tours page card (photo + grad-card + ImgBlur +
 * chips + name + price + cream CTA) at menu size, mirroring the destination
 * preview above. The listing record carries its own formatted price now.
 */
function PackagePreview({ pkg }) {
  return (
    <a href={pkg.href} className="relative min-w-0 flex-1 rounded-lg bg-mist p-1">
      <div className="relative h-[300px] w-full overflow-hidden rounded min-[1100px]:h-[380px]">
        <img src={pkg.image} alt={pkg.alt} className="absolute inset-0 h-full w-full object-cover" />
        <div className="grad-card absolute inset-0" />
        <ImgBlur />
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-6">
          <div className="flex flex-wrap gap-2">
            {pkg.chips.map((c) => (
              <span key={c} className="chip">
                {c}
              </span>
            ))}
          </div>
          <div className="flex items-end justify-between gap-4 min-[1100px]:gap-8">
            <div className="flex min-w-0 flex-col gap-3">
              <h3 className="t-h3l text-mist">{pkg.title}</h3>
              {pkg.price ? (
                <p className="t-body text-mist max-[1099.98px]:hidden">{pkg.price}</p>
              ) : null}
            </div>
            <span className="btn btn-cream w-[104px]">explore</span>
          </div>
        </div>
      </div>
    </a>
  );
}

/**
 * Packages mega-menu, built to the same shape as the destinations one: the
 * tours down the left (name + duration, grouped by difficulty), the hovered
 * tour's card filling the right, and the closing banner underneath.
 */
function PackagesMenu({ onNavigate }) {
  const { listings: tours, status, retry } = useTourListings();
  const [active, setActive] = useState(() => tours[0]?.slug ?? null);
  const groups = DIFFICULTIES.map((level) => tours.filter((p) => p.chips[0] === level)).filter(
    (list) => list.length
  );
  // The list can legitimately be empty now that it no longer falls back to the
  // data file, so `current` is nullable and the preview below is skipped rather
  // than reached through tours[0].
  const current = tours.find((p) => p.slug === active) ?? tours[0] ?? null;
  const currentSlug = current?.slug ?? null;

  if (status === STRAPI_STATUS.LOADING) {
    return (
      <div id="nav-packages-menu" className="absolute inset-x-0 top-full hidden min-[1024px]:block">
        <NavMenuSkeleton
          rows={tours.length}
          label="Loading packages…"
          linkLabel="All packages"
          linkHref="/tours"
          ctaLabel="Plan your trip"
          ctaHref="/plan-your-trip"
          onNavigate={onNavigate}
        />
      </div>
    );
  }

  /* Same shape as the destinations panel: the message replaces the rows, and
     the static links and the CTA below it stay live so the bar is still
     navigable. */
  if (status === STRAPI_STATUS.ERROR || status === STRAPI_STATUS.EMPTY) {
    return (
      <div id="nav-packages-menu" className="absolute inset-x-0 top-full hidden min-[1024px]:block">
        <div className="menu-in flex max-h-[calc(100dvh-92px)] flex-col gap-2 overflow-y-auto overscroll-contain rounded-b-lg bg-cream p-6">
          {status === STRAPI_STATUS.ERROR ? (
            <SectionErrorInline onRetry={retry} />
          ) : (
            <SectionEmptyInline />
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-5">
            <a href="/tours" onClick={onNavigate} className="t-link text-ink underline underline-offset-4">
              All packages
            </a>
            <a href="/plan-your-trip" onClick={onNavigate} className="btn btn-dark w-[150px]">
              Plan your trip
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="nav-packages-menu" className="absolute inset-x-0 top-full hidden min-[1024px]:block">
      <div className="menu-in flex max-h-[calc(100dvh-92px)] flex-col gap-5 overflow-y-auto overscroll-contain rounded-b-lg bg-cream p-6">
        <div className="flex gap-5">
          <nav className="flex w-[260px] shrink-0 flex-col min-[1100px]:w-[360px]">
            {groups.flat().map((p) => (
              <a
                key={p.slug}
                href={p.href}
                onClick={onNavigate}
                onMouseEnter={() => setActive(p.slug)}
                onFocus={() => setActive(p.slug)}
                aria-current={p.slug === currentSlug ? "true" : undefined}
                className={`flex flex-1 items-center justify-between gap-3 rounded-lg px-3 transition-colors ${
                  p.slug === currentSlug ? "bg-mist" : "hover:bg-mist"
                }`}
              >
                <span className={`t-h6 min-w-0 truncate ${p.slug === currentSlug ? "text-primary" : "text-ink"}`}>
                  {p.title}
                </span>
                <span className="t-eyebrow-s shrink-0 text-smoke">{p.chips[1]}</span>
              </a>
            ))}
          </nav>

          {current ? <PackagePreview pkg={current} /> : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-5">
          <div className="flex flex-wrap items-center gap-4 min-[1100px]:gap-6">
            <p className="t-eyebrow text-smoke">
              {tours.length} packages · {groups.length} difficulty levels
            </p>
            <a href="/tours" onClick={onNavigate} className="t-link text-ink underline underline-offset-4">
              All packages
            </a>
          </div>
          <a href="/plan-your-trip" onClick={onNavigate} className="btn btn-dark w-[150px]">
            Plan your trip
          </a>
        </div>
      </div>
    </div>
  );
}

/** menu key -> the panel it opens, keyed for aria-controls. */
const MENUS = {
  destinations: DestinationsMenu,
  packages: PackagesMenu,
};

/**
 * The drawer that replaces the whole bar below 1100px. Same links, but the two
 * mega-menu entries become accordions listing every destination / tour, so
 * nothing in the nav is unreachable on a phone or tablet.
 */
function MobileMenu({ open, onNavigate }) {
  const { listings: tours, status: toursStatus, retry: retryTours } = useTourListings();
  const { destinations, status: destinationsStatus, retry: retryDestinations } = useDestinations();
  const [group, setGroup] = useState(null);

  if (!open) return null;

  return (
    <div id="nav-mobile-menu" className="absolute inset-x-0 top-full min-[1024px]:hidden">
      <div className="menu-in flex max-h-[calc(100dvh-84px)] flex-col overflow-y-auto overscroll-contain rounded-b-lg bg-cream p-4 min-[1024px]:max-h-[calc(100dvh-92px)]">
        <nav className="flex flex-col">
          {NAV_LINKS.map((l) => {
            const isGroup = Boolean(l.menu && MENUS[l.menu]);
            const expanded = isGroup && group === l.menu;
            const status = l.menu === "destinations" ? destinationsStatus : toursStatus;
            const retry = l.menu === "destinations" ? retryDestinations : retryTours;
            const loading = status === STRAPI_STATUS.LOADING;

            if (!isGroup) {
              return (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={onNavigate}
                  className="t-link border-b border-ink/10 py-4 text-ink"
                >
                  {l.label}
                </a>
              );
            }

            const list = l.menu === "destinations" ? destinations : tours;

            return (
              <div key={l.label} className="border-b border-ink/10">
                <button
                  type="button"
                  onClick={() => setGroup(expanded ? null : l.menu)}
                  aria-expanded={expanded}
                  className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent py-4 text-left"
                >
                  <span className="t-link text-ink">{l.label}</span>
                  <ChevronDown className={`text-ink transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                </button>

                {expanded ? (
                  loading ? (
                    /* the drawer's list of rows is the same read as the desktop
                       menu, so it holds too — name line only, no preview */
                    <SkeletonRegion label={`Loading ${l.menu}…`} className="flex flex-col gap-1 pb-4">
                      {Array.from({ length: Math.min(list.length, 8) }, (_, i) => (
                        <div key={i} className="flex items-center rounded-lg px-3 py-2">
                          <Skeleton className="h-[22px] w-[62%]" />
                        </div>
                      ))}
                    </SkeletonRegion>
                  ) : status === STRAPI_STATUS.ERROR ? (
                    /* the accordion's own message; every other row of the drawer,
                       and the links at its foot, stay exactly as they are */
                    <SectionErrorInline onRetry={retry} className="w-full" />
                  ) : status === STRAPI_STATUS.EMPTY ? (
                    <SectionEmptyInline className="w-full" />
                  ) : (
                    <ul className="flex flex-col gap-1 pb-4">
                      {list.map((d) => (
                        <li key={d.slug}>
                          <a
                            href={l.menu === "destinations" ? `/destinations/${d.slug}` : d.href}
                            onClick={onNavigate}
                            className="t-body block rounded-lg px-3 py-2 text-ink hover:bg-mist"
                          >
                            {d.name ?? d.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3 pt-4">
          <a href="/destinations" onClick={onNavigate} className="t-link text-ink underline underline-offset-4">
            All destinations
          </a>
          <a href="/tours" onClick={onNavigate} className="t-link text-ink underline underline-offset-4">
            All packages
          </a>
          <a href="/plan-your-trip" onClick={onNavigate} className="btn btn-dark w-full">
            Plan your trip
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * The bar carries no fill while it sits over a photo: variant "light" (default)
 * leaves it transparent so the hero runs unbroken behind it, with the white
 * logo and light links the dark photo needs to read.
 *
 * variant "dark", and any bar with a panel open, switches to the page
 * background colour instead — on the cream pages that is the same cream the
 * body already is, and over the hero it is the panel's own cream, so bar and
 * panel meet with no seam.
 *
 * Nothing here casts a shadow. A drop shadow is what stops this from actually
 * matching the background: it darkened the cream around the bar, and each
 * panel's shadow fell upward onto the bar, so opening a menu tinted the bar
 * off-colour. The bar is separated from the hero photo by the photo itself,
 * and on the cream pages it is meant to disappear into them.
 */
export default function Navbar({ variant = "light" }) {
  const dark = variant === "dark";
  // which menu is open, or null — a key into MENUS rather than a flag, so the
  // bar only ever has one panel up but can swap between them
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rv = useReveal({ effect: "fade" });
  const shell = useRef(null);
  // one trigger per menu, so Escape can hand focus back to the right one
  const triggers = useRef({});
  // set only while Escape moves focus back onto a trigger, whose onFocus would
  // otherwise re-open the panel we just closed
  const suppressOpen = useRef(false);

  const open = openMenu !== null;

  // the open panel is cream all the way up, so the bar fills to match it —
  // and swaps to the cream page's colours (dark logo, ink links) with it
  const solid = dark || open || mobileOpen;

  // Strapi's global entry owns the name and the logos. Two slots, because the
  // bar needs one that reads over a photo and one that reads on cream:
  //   global.logo     -> transparent bar sitting over the hero photo
  //   global.logoDark -> the bar turned solid (cream panel / page background)
  //
  // While that entry is in flight the logo is a neutral block of exactly the
  // image's box. The site's text name stays in the link's label throughout, so
  // the bar is never an empty gap — only a bar whose logo has not arrived.
  //
  // On an error or an empty global entry there is no logo to show and no hardcoded
  // one to borrow: the site's text name is rendered in the image's own box
  // instead, which is the same degradation the footer makes. The rest of the bar
  // is untouched either way.
  const { data: global, status: globalStatus } = useGlobalState();
  const logoLoading = globalStatus === STRAPI_STATUS.LOADING;
  const siteName = global?.siteName || "API Touch";
  const photoLogo = imageOf(global?.logo, siteName);
  const panelLogo = imageOf(global?.logoDark, siteName) ?? photoLogo;
  const logo = solid ? panelLogo?.src ?? null : photoLogo?.src ?? null;
  const link = solid ? "text-ink hover:text-primary" : "text-mist hover:text-sage";

  const close = () => setOpenMenu(null);
  const closeAll = () => {
    setOpenMenu(null);
    setMobileOpen(false);
  };

  // Escape and outside clicks close the panel; the pointer/keyboard handlers on
  // the container itself keep it open while you travel from the trigger into it.
  useEffect(() => {
    if (!open && !mobileOpen) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") {
        if (mobileOpen) setMobileOpen(false);
        return;
      }
      setOpenMenu(null);
      setMobileOpen(false);
      // only pull focus back to the trigger when it was inside the panel —
      // focusing it from elsewhere would re-open through onFocus
      const active = document.activeElement;
      if (active && shell.current?.contains(active)) {
        // focus() dispatches synchronously, so the flag is consumed by this
        // onFocus and cleared again before we return
        suppressOpen.current = true;
        triggers.current[openMenu]?.focus();
        suppressOpen.current = false;
      }
    };
    const onDown = (e) => {
      if (shell.current && !shell.current.contains(e.target)) {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, openMenu, mobileOpen]);

  // the drawer covers the page: stop the document scrolling behind it
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const Panel = openMenu ? MENUS[openMenu] : null;

  return (
    <header {...rv} className="rv absolute inset-x-0 top-2 z-50">
      <div
        ref={shell}
        className={`container-x relative flex items-center ${
          solid ? "rounded-t-lg bg-cream" : ""
        } h-[76px] max-[1023.98px]:h-[68px]`}
        onMouseLeave={close}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) close();
        }}
      >
        <a href="/" aria-label={siteName} className="shrink-0">
          {logoLoading ? (
            <LogoSkeleton />
          ) : logo ? (
            <img
              src={logo}
              alt={siteName}
              className="block h-[42px] w-[84px] object-contain max-[1023.98px]:h-[36px] max-[1023.98px]:w-[72px]"
            />
          ) : (
            /* no logo image available: the name stands in, in the same box */
            <span className="block h-[42px] w-[84px] leading-[42px] max-[1023.98px]:h-[36px] max-[1023.98px]:w-[72px] max-[1023.98px]:leading-[36px]">
              <span className={`t-h4 truncate ${link}`}>{siteName}</span>
            </span>
          )}
        </a>
        <div className="ml-auto hidden items-center gap-6 min-[1024px]:flex">
          <nav className="flex items-center gap-6">
            {NAV_LINKS.map((l) =>
              l.menu && MENUS[l.menu] ? (
                <button
                  key={l.label}
                  ref={(el) => {
                    triggers.current[l.menu] = el;
                  }}
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={openMenu === l.menu}
                  aria-controls={`nav-${l.menu}-menu`}
                  onMouseEnter={() => setOpenMenu(l.menu)}
                  onFocus={() => {
                    if (suppressOpen.current) return;
                    setOpenMenu(l.menu);
                  }}
                  onClick={() => setOpenMenu((o) => (o === l.menu ? null : l.menu))}
                  className={`t-link flex cursor-pointer items-center gap-[6px] border-0 bg-transparent p-0 transition-colors ${link}`}
                >
                  {l.label}
                  <ChevronDown
                    className={`transition-transform duration-200 ${openMenu === l.menu ? "rotate-180" : ""}`}
                  />
                </button>
              ) : (
                <a
                  key={l.label}
                  href={l.href}
                  onMouseEnter={close}
                  className={`t-link ${link}`}
                >
                  {l.label}
                </a>
              ),
            )}
          </nav>
          <a href="/plan-your-trip" onMouseEnter={close} className="btn btn-dark w-[140px] normal-case">
            Plan your trip
          </a>
        </div>

        {Panel ? <Panel onNavigate={close} /> : null}
        <MobileMenu open={mobileOpen} onNavigate={closeAll} />

        {/* narrow screens: two-bar menu trigger (measured 39x36, bars 18x1 / gap 6) */}
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="nav-mobile-menu"
          onClick={() => setMobileOpen((o) => !o)}
          className="ml-auto flex h-[36px] w-[39px] cursor-pointer flex-col items-center justify-center gap-[6px] border-0 bg-transparent p-0 min-[1024px]:hidden"
        >
          <span className="block h-px w-[18px] bg-ink" />
          <span className="block h-px w-[18px] bg-ink" />
        </button>
      </div>
    </header>
  );
}