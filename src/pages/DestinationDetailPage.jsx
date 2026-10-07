import { useEffect } from "react";
import PageShell from "../components/PageShell.jsx";
import { PageHeader } from "../components/ui.jsx";
import TourCard from "../components/TourCard.jsx";
import DestinationsPage from "./DestinationsPage.jsx";
import { DESTINATIONS_ALL } from "../data/newPages.js";
import { HIKES_ALL } from "../data/hikes.js";

function FactList({ title, items }) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <h2 className="t-h4 text-ink">{title}</h2>
      <ul className="flex flex-col gap-2">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-primary" />
            <span className="t-body">{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DestinationDetailPage() {
  const slug = window.location.pathname.split("/").filter(Boolean).pop() ?? "";
  const dest = DESTINATIONS_ALL.find((d) => d.slug === slug);

  useEffect(() => {
    document.title = `${dest ? dest.name : "Destination"} — API Touch`;
  }, [dest]);

  if (!dest) return <DestinationsPage />;

  const tours = HIKES_ALL.filter((h) => dest.tours.includes(h.slug));

  return (
    <PageShell>
      <section className="container-x flex flex-col gap-6 pt-[120px] max-[1099.98px]:pt-[100px] max-[639.98px]:pt-[88px]">
        <PageHeader badge={dest.region} title={dest.name} sub={dest.body} />
        <img src={dest.image} alt={dest.alt} className="h-[240px] w-full rounded-lg object-cover min-[639.98px]:h-[320px] min-[1100px]:h-[420px]" />
      </section>

      <section className="container-x flex flex-col gap-8 pb-[60px] pt-10 min-[639.98px]:gap-12 min-[639.98px]:pt-12">
        <div className="flex flex-col gap-8 min-[900px]:flex-row min-[900px]:gap-12">
          <FactList title="Attractions" items={dest.attractions} />
          <FactList title="Activities" items={dest.activities} />
          <FactList title="Best time to visit" items={dest.bestTime} />
        </div>

        {tours.length ? (
          <div className="flex flex-col gap-6">
            <div className="flex items-baseline justify-between border-b border-smoke/30 pb-3">
              <h2 className="t-h3s text-ink">Tour packages</h2>
              <a href="/tours" className="t-link text-smoke">
                All tours
              </a>
            </div>
            <div className="grid grid-cols-1 gap-6 min-[639.98px]:grid-cols-2 min-[1100px]:grid-cols-2">
              {tours.map((t, i) => (
                <TourCard key={t.slug} tour={t} index={i} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col items-start gap-4 rounded-lg bg-mist p-6 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between min-[900px]:gap-6">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="t-h4 text-ink">Want {dest.name} built around you?</p>
            <p className="t-body">Tell us your dates and group size — we come back with a route and a price.</p>
          </div>
          <a href="/plan-your-trip" className="btn btn-dark w-[160px]">
            Plan your trip
          </a>
        </div>
      </section>
    </PageShell>
  );
}
