// Page data for the about / gallery / journal pages, extracted from the
// rendered mirror (http://localhost:8091/trova-travel.framer.website/*).
// Image URLs are the canonical framerusercontent.com CDN URLs (the mirror's
// proxied srcset candidates 404).

export const ABOUT = {
  badge: "About Us",
  title: "Where Every Journey Begins",
  sub: "Meet the passionate explorers, guides, and adventure enthusiasts creating unforgettable travel experiences.",
  banner: "/img/eletD2JNrNULFGPfhz7cuyGQ8-dc3b93.png",
  story: {
    badge: "Our Story",
    paragraphs: [
      "API Touch began with a handful of weekend hikes among friends who wanted more than a walk in the woods. We were tired of generic itineraries and guides who treated every group the same. So we built something smaller — routes chosen with care, groups kept intentionally intimate, and a belief that the outdoors deserves more attention than a checklist.",
      "What started as informal weekend trips has become a small team of guides who know these mountains personally. Every hike we run is shaped by that same instinct — go slower, plan better, and treat every group like it's the only one we're guiding that week.",
    ],
    image: "/img/RdokshmS0mFgqNy40JF6QVYHxoU-c022b9.png",
  },
  why: {
    badge: "Why API Touch",
    title: ["What sets every", "trip apart"],
    body: "Thoughtfully crafted experiences that bring together adventure, connection, and the beauty of the outdoors in every journey.",
    banner: "/img/DSeT2ifT6plLUrqFksN1V5rvoJc-36b270.jpg",
    cards: [
      { title: "Local guides, not scripts", body: "Every route led by someone who's walked it before." },
      { title: "Small groups, real caps", body: "Never more than 8 hikers joining a single guide." },
      { title: "Chosen routes, not permits", body: "Fewer routes offered, each one picked on purpose." },
    ],
  },
  guides: {
    badge: "Our Guides",
    title: ["Experts who know", "every path"],
    body: "From hidden viewpoints to challenging climbs, our guides lead every journey with experience and care.",
    people: [
      { role: "lead guide", name: "Maren K.", image: "/img/9LRjdvq7qodL0yYahLpqgygYuk-c022b9.png" },
      { role: "coastal route specialist", name: "Sofia Bianchi", image: "/img/PIX3swnixBY1QBeWJeiz8FGXcHg-c022b9.png" },
      { role: "wilderness route guide", name: "Tane Ngata", image: "/img/eFPmr6b77HuvCwgMEuxw49Onc-c022b9.png" },
      { role: "forest & lowland guide", name: "Elena Voss", image: "/img/J38JqsFGNs4XeDU3Bsfpvkb1k-c022b9.png" },
      { role: "high-altitude guide", name: "Dawa Sherpa", image: "/img/HknwrzFX9yu9Amjf9HNmHaee8Yk-c022b9.png" },
      { role: "desert & canyon guide", name: "Yuki Tanaka", image: "/img/O7n6t6GKSa6vg2e4CeolaFt0-c022b9.png" },
    ],
  },
};

// 3-column masonry; every image renders at its column's width with an exact
// aspect ratio (width/height of the file), which is what balances the columns.
// The photos are the originals in /gallery, re-encoded for the web by
// apply-gallery-photos.ps1 (long edge 1600px, JPEG q82) and packed
// shortest-column-first so all three columns come out the same height.
export const GALLERY = {
  badge: "Gallery",
  title: "Explore the Journey",
  sub: "A collection of breathtaking landscapes, meaningful moments, and unforgettable adventures waiting to inspire your next escape.",
  columns: [
    [
      { src: "/img/gallery/01.jpg", w: 1600, h: 1067 },
      { src: "/img/gallery/02.jpg", w: 1600, h: 1067 },
      { src: "/img/gallery/03.jpg", w: 950, h: 1600 },
      { src: "/img/gallery/04.jpg", w: 1600, h: 1068 },
      { src: "/img/gallery/05.jpg", w: 1600, h: 1200 },
      { src: "/img/gallery/06.jpg", w: 1600, h: 1067 },
      { src: "/img/gallery/07.jpg", w: 1600, h: 900 },
    ],
    [
      { src: "/img/gallery/08.jpg", w: 1600, h: 1200 },
      { src: "/img/gallery/09.jpg", w: 1274, h: 1600 },
      { src: "/img/gallery/10.jpg", w: 1600, h: 1067 },
      { src: "/img/gallery/11.jpg", w: 900, h: 1600 },
      { src: "/img/gallery/12.jpg", w: 1600, h: 1067 },
      { src: "/img/gallery/13.jpg", w: 1600, h: 1067 },
    ],
    [
      { src: "/img/gallery/14.jpg", w: 1600, h: 1067 },
      { src: "/img/gallery/15.jpg", w: 1200, h: 1600 },
      { src: "/img/gallery/16.jpg", w: 1067, h: 1600 },
      { src: "/img/gallery/17.jpg", w: 1600, h: 1067 },
      { src: "/img/gallery/18.jpg", w: 1280, h: 1600 },
      { src: "/img/gallery/19.jpg", w: 1600, h: 1067 },
    ],
  ],
};

export const JOURNAL_PAGE = {
  badge: "Blog & Travel Guide",
  title: "Stories, Tips & Travel inspiration",
  sub: "Explore travel guides, tips, destination highlights, and outdoor stories to inspire your next adventure.",
  featured: {
    tag: "Trip planning",
    read: "3 min read",
    title: "What we tell you before day one",
    href: "/blog/what-we-tell-you-before-day-one",
    image: "/img/NENgCJ6izkRDL4t6pG8ydu5abM-36b270.jpg",
  },
  categories: ["All", "Trip planning", "Guide notes", "Gear"],
  posts: [
    { tag: "Guide notes", read: "4 min read", title: "Why the same route feels different every season", href: "/blog/why-the-same-route-feels-different-every-season", image: "/img/QUqWUHn2rJ1LpPe4XycDXekcI0-36b270.jpg" },
    { tag: "Gear", read: "4 min read", title: "The gear we replace every year", href: "/blog/the-gear-we-replace-every-year", image: "/img/D6hhxyu1yvA3ktjfHLLQp39hGo-36b270.jpg" },
    { tag: "Guide notes", read: "4 min read", title: "When to turn a group around", href: "/blog/when-to-turn-a-group-around", image: "/img/LB8mF9nLMz2COnEkZJ8sN18k4M-36b270.jpg" },
    { tag: "Gear", read: "3 min read", title: "What actually goes in your pack", href: "/blog/what-actually-goes-in-your-pack", image: "/img/wEacF8wyJjiVnuzit9TMFQ2G0sw-36b270.jpg" },
    { tag: "Trip planning", read: "4 min read", title: "What eight days on foot actually changes", href: "/blog/what-eight-days-on-foot-actually-changes", image: "/img/QNXHdlqZw3aarEaU7hEjT7DdZZk-36b270.jpg" },
    { tag: "Trip planning", read: "4 min read", title: "What we look for in a campsite", href: "/blog/what-we-look-for-in-a-campsite", image: "/img/wOa2z7EWlsHWggwolHDiXaCMxmE-36b270.jpg" },
    { tag: "Guide notes", read: "4 min read", title: "How we choose a route", href: "/blog/how-we-pick-a-route", image: "/img/A80eHXIRREM5birbFvpWFn5E-36b270.jpg" },
    { tag: "Guide notes", read: "3 min read", title: "Reading a mountain before you climb it", href: "/blog/reading-a-mountain-before-you-climb-it", image: "/img/k54Jt90u1SbWB4REScNu4VTIVc-36b270.jpg" },
    { tag: "Trip planning", read: "3 min read", title: "Why we cap groups at eight", href: "/blog/why-we-cap-groups-at-eight", image: "/img/owzBIx6L2o5qYj65iVBUPi7GF6A-36b270.jpg" },
  ],
};
