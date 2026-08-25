import type { BlockProps } from "../../types";

/** Address and phone come from facts.nap so they match the business's Google
 *  Business Profile everywhere they appear.
 *
 *  The map is a real embedded map, not a button. A visitor deciding whether to
 *  drive over wants to see where the shop sits relative to the centre and the
 *  car parks; "plan uw route" answers a question they have not asked yet.
 *
 *  It is OpenStreetMap rather than Google, because OSM's embed sets no cookies.
 *  That keeps this site free of a consent banner, which is worth more than
 *  Street View. Requires facts.nap.geo; falls back to the route link without it
 *  rather than dropping a map on a guessed coordinate. */
export type MapContactProps = {
  heading?: string;
  showRouteLink?: boolean;
  extraNote?: string;
};

/** A window of roughly 600m around the shop — close enough to recognise the
 *  street, wide enough to show how to get into it. */
function bbox(lat: number, lng: number, pad = 0.004) {
  return [lng - pad * 1.7, lat - pad, lng + pad * 1.7, lat + pad]
    .map((n) => n.toFixed(5))
    .join(",");
}

export function MapContact({ heading, showRouteLink = true, extraNote, facts }: BlockProps<MapContactProps>) {
  const { nap } = facts;
  const query = encodeURIComponent(`${nap.address.street}, ${nap.address.postalCode} ${nap.address.city}`);
  const geo = nap.geo;

  return (
    <section className="page py-16">
      {heading && <h2 className="text-3xl font-semibold">{heading}</h2>}
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
        <div>
          <address className="not-italic leading-relaxed">
            <strong>{nap.tradingName ?? nap.legalName}</strong><br />
            {nap.proprietor && <>{nap.proprietor}<br /></>}
            {nap.address.street}<br />
            {nap.address.postalCode} {nap.address.city}
            <p className="mt-4">
              <a href={`tel:${nap.phone}`} className="font-medium text-(--color-brand) underline">{nap.phoneDisplay}</a>
              {nap.email && <><br /><a href={`mailto:${nap.email}`} className="underline">{nap.email}</a></>}
            </p>
          </address>
          {nap.contactNote && <p className="mt-2 text-sm text-(--color-muted)">{nap.contactNote}</p>}
          {nap.parking && <p className="mt-2 text-sm text-(--color-muted)">{nap.parking}</p>}
          {extraNote && <p className="mt-2 text-sm text-(--color-muted)">{extraNote}</p>}
          {showRouteLink && (
            <p className="mt-6">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${query}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-(--radius-soft) bg-(--color-brand) px-5 py-3 font-medium text-(--color-brand-ink)"
              >
                Route plannen
              </a>
            </p>
          )}
        </div>

        {geo ? (
          <div className="overflow-hidden rounded-(--radius-soft) border border-black/10">
            <iframe
              title={`Kaart met de locatie van ${nap.tradingName ?? nap.legalName} aan de ${nap.address.street} in ${nap.address.city}`}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox(geo.lat, geo.lng)}&layer=mapnik&marker=${geo.lat},${geo.lng}`}
              loading="lazy"
              className="h-80 w-full border-0 lg:h-96"
            />
            <p className="bg-(--color-brand-tint) px-4 py-2 text-xs text-(--color-muted)">
              Kaartgegevens{" "}
              <a
                href={`https://www.openstreetmap.org/?mlat=${geo.lat}&mlon=${geo.lng}#map=17/${geo.lat}/${geo.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                © OpenStreetMap-bijdragers
              </a>
            </p>
          </div>
        ) : (
          <p className="rounded-(--radius-soft) bg-(--color-surface-alt) p-10 text-(--color-muted)">
            De kaart verschijnt zodra de coördinaten van de winkel in de gegevens staan.
          </p>
        )}
      </div>
    </section>
  );
}
