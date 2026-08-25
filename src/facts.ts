// The facts model: the singleton documents that appear in more than one place
// on a site and must never disagree with themselves.
//
// Types and pure helpers only. Loading them from a database is the host
// application's job — that is the seam this package is built on, and it is why
// the package has no dependency on Supabase, on Next, or on any particular way
// of storing anything.

export type HoursRule = {
  when?: "default" | "schoolvakantie";
  region?: "noord" | "midden" | "zuid";
  days: string[] | string;
  open: string;
  close: string;
};

export type Season = {
  id: string;
  label: string;
  /** Omit both `from` and `to` for a business that keeps the same hours all
   *  year. Dated seasons take precedence over the year-round one. */
  from?: string; // ISO date
  to?: string;
  rules: HoursRule[];
};

export type HoursFact = {
  mode?: "regular" | "appointment";
  timezone: string;
  seasons: Season[];
  closed?: { days: string[]; reason?: string }[];
  exceptions?: {
    date: string;
    status?: "closed" | "open";
    open?: string;
    close?: string;
    reason?: string;
  }[];
  schoolHolidays?: { region: string; from: string; to: string; label: string }[];
  notes?: string;
};

export type PriceTier = { id: string; label: string; amount: number; note?: string };

export type PricesFact = {
  currency: string;
  vatIncluded: boolean;
  tiers: PriceTier[];
  packages?: (PriceTier & { includes?: string[] })[];
  groupDiscounts?: { from: number; discountPercent: number; note?: string }[];
  // Set when a third party (ticketing, ordering platform) holds its own copy of
  // these prices. Surfaced in the owner guide so the two do not silently drift.
  externalSource?: { name: string; url?: string; warning: string };
};

export type NapFact = {
  legalName: string;
  tradingName?: string;
  proprietor?: string;
  address: { street: string; postalCode: string; city: string; country: string };
  geo?: { lat: number; lng: number };
  phone: string;
  phoneDisplay: string;
  email?: string;
  contactNote?: string;
  kvk?: string;
  btw?: string;
  parking?: string;
};

export type ServiceItem = {
  id: string;
  label: string;
  description?: string;
  image?: string;
  priceFrom?: number;
  /** Where the business outsources the service to a named third party. Worth
   *  modelling: it is a real dependency and it belongs in the handover. */
  externalPartner?: { name: string; url?: string; place?: string };
};

/** One entry in the catalogue's taxonomy: a department, a kind of thing, or a
 *  maker.
 *
 *  `id` appears in every item's URL, so it is generated once from the first
 *  label and then frozen — renaming it breaks links already in Google and in
 *  people's bookmarks. `label` is what people read, never appears in a URL,
 *  and the owner may change it whenever they like. That split is what makes
 *  the taxonomy safe to hand over. */
export type TaxonomyItem = {
  id: string;
  label: string;
  /** Limits where the entry is offered — a kind of shoe only the women's
   *  department stocks, a maker who only does men's. Empty means everywhere. */
  departments?: string[];
  logo?: string;
  note?: string;
};

/** Kept as a name for what a retailer stocks: the highest-intent search terms
 *  an independent shop owns ("gabor barneveld"), and cheap to keep current. */
export type BrandItem = TaxonomyItem;

/** A credential the business holds — a royal warrant, a guild membership, a
 *  certification. Kept as a fact rather than left inside a photograph of the
 *  shopfront, so it reaches search engines and screen readers too. */
export type Predicate = {
  id: string;
  label: string;
  note?: string;
  since?: string;
};

/** The site's main navigation. A fact rather than a hard-coded array: the
 *  header is locked against the page editor, so without this the owner would
 *  have to phone somebody to add a menu item. `children` renders as a dropdown
 *  and as the catalogue sidebar. */
export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export type Facts = {
  hours: HoursFact;
  /** Absent for businesses whose prices live on individual items rather than on
   *  a tariff — a retailer prices the shoe, not the shop. */
  prices?: PricesFact;
  nap: NapFact;
  services: { items: ServiceItem[] };
  /** The catalogue's taxonomy. All three are facts rather than constants in
   *  the code, because a shop that starts stocking a new kind of thing should
   *  not need a developer and a deploy. See lib/taxonomy.ts. */
  brands?: { note?: string; items: BrandItem[]; unconfirmed?: BrandItem[] };
  categories?: { note?: string; items: TaxonomyItem[] };
  departments?: { note?: string; items: TaxonomyItem[] };
  socials: { label: string; url: string }[];
  meta: {
    siteName: string;
    tagline?: string;
    language: string;
    founded?: string;
    predicates?: Predicate[];
    nav?: NavItem[];
  };
  /** Where each fact came from: which page, "transcribed from JPEG", or
   *  "owner confirmed". Phase 2 mandates provenance; without somewhere to put
   *  it, it gets written in a scratch file and lost at handover. */
  _provenance?: Record<string, string>;
};

/** Pick a subset of price tiers by id, preserving the order given. */
export function pickTiers(prices: PricesFact, ids?: string[]): PriceTier[] {
  if (!ids || ids.length === 0) return prices.tiers;
  return ids
    .map((id) => prices.tiers.find((t) => t.id === id))
    .filter((t): t is PriceTier => Boolean(t));
}

export function formatPrice(amount: number, currency = "EUR", locale = "nl-NL") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}
