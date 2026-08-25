// Structured data, derived from facts. Local search depends on NAP and hours
// being consistent and machine-readable, so this is generated rather than
// hand-written — one edit to the facts updates what Google sees.

import type { Facts } from "./facts";

const DAY_SCHEMA: Record<string, string> = {
  ma: "Monday", di: "Tuesday", wo: "Wednesday", do: "Thursday",
  vr: "Friday", za: "Saturday", zo: "Sunday",
};

export function localBusinessJsonLd(facts: Facts, siteUrl: string, type = "LocalBusiness") {
  const { nap, hours } = facts;

  const specs = hours.seasons.flatMap((season) =>
    season.rules.map((rule) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: (Array.isArray(rule.days) ? rule.days : [rule.days])
        .flatMap((d) => (typeof d === "string" && d.includes("-") ? [] : [d]))
        .map((d) => DAY_SCHEMA[d])
        .filter(Boolean),
      opens: rule.open,
      closes: rule.close,
      validFrom: season.from,
      validThrough: season.to,
    }))
  );

  const special = (hours.exceptions ?? []).map((e) => ({
    "@type": "OpeningHoursSpecification",
    validFrom: e.date,
    validThrough: e.date,
    ...(e.status === "closed" || !e.open
      ? { opens: "00:00", closes: "00:00" }
      : { opens: e.open, closes: e.close }),
  }));

  return {
    "@context": "https://schema.org",
    "@type": type,
    name: nap.tradingName ?? nap.legalName,
    legalName: nap.legalName,
    url: siteUrl,
    telephone: nap.phone,
    email: nap.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: nap.address.street,
      postalCode: nap.address.postalCode,
      addressLocality: nap.address.city,
      addressCountry: nap.address.country,
    },
    ...(nap.geo
      ? { geo: { "@type": "GeoCoordinates", latitude: nap.geo.lat, longitude: nap.geo.lng } }
      : {}),
    openingHoursSpecification: specs,
    ...(special.length ? { specialOpeningHoursSpecification: special } : {}),
    sameAs: facts.socials.map((s) => s.url),
  };
}
