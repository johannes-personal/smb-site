import type { Config } from "@puckeditor/core";
import type { Facts } from "./facts";
import type { ResolvedItem } from "./types";
import { COLLECTIONS } from "./collections";
import { ProductGrid, type ProductGridProps } from "./components/blocks/ProductGrid";

import { Hero, type HeroProps } from "./components/blocks/Hero";
import { PageIntro, type PageIntroProps } from "./components/blocks/PageIntro";
import { QuickLinks, type QuickLinksProps } from "./components/blocks/QuickLinks";
import { FeatureRow, type FeatureRowProps } from "./components/blocks/FeatureRow";
import { CardGrid, type CardGridProps } from "./components/blocks/CardGrid";
import { PriceTable, type PriceTableProps } from "./components/blocks/PriceTable";
import { HoursSummary, type HoursSummaryProps } from "./components/blocks/HoursSummary";
import { HoursCalendar, type HoursCalendarProps } from "./components/blocks/HoursCalendar";
import { Gallery, type GalleryProps } from "./components/blocks/Gallery";
import { TextSection, type TextSectionProps } from "./components/blocks/TextSection";
import { FAQ, type FAQProps } from "./components/blocks/FAQ";
import { CTABand, type CTABandProps } from "./components/blocks/CTABand";
import { MapContact, type MapContactProps } from "./components/blocks/MapContact";
import { Embed, type EmbedProps } from "./components/blocks/Embed";
import { Testimonials, type TestimonialsProps } from "./components/blocks/Testimonials";

export type Components = {
  Hero: HeroProps;
  PageIntro: PageIntroProps;
  QuickLinks: QuickLinksProps;
  FeatureRow: FeatureRowProps;
  CardGrid: CardGridProps;
  PriceTable: PriceTableProps;
  HoursSummary: HoursSummaryProps;
  HoursCalendar: HoursCalendarProps;
  Gallery: GalleryProps;
  TextSection: TextSectionProps;
  FAQ: FAQProps;
  CTABand: CTABandProps;
  MapContact: MapContactProps;
  Embed: EmbedProps;
  Testimonials: TestimonialsProps;
  ProductGrid: ProductGridProps;
};

/**
 * The registry. This is shared by the generator and the owner's editor, and
 * that shared-ness is the point: anything this skill can produce, the owner can
 * subsequently edit, because they are the same components.
 *
 * Note what is deliberately absent: free HTML, custom CSS, arbitrary
 * positioning. The owner should be able to rearrange the site without being
 * able to make it ugly.
 *
 * Fields that would let someone type over a fact (a price, a phone number) are
 * not offered. Those are edited once, in "Mijn gegevens".
 */
export function buildConfig(facts: Facts, catalogue: ResolvedItem[] = []): Config<Components> {
  // Returns ReactNode, not JSX.Element: a block may legitimately render nothing
  // — PriceTable does when the business has no prices fact.
  const withFacts =
    <P,>(Component: (p: P & { facts: Facts; catalogue?: ResolvedItem[] }) => React.ReactNode) =>
    (props: P) =>
      <>{Component({ ...props, facts, catalogue })}</>;

  const serviceOptions = facts.services.items.map((s) => ({ label: s.label, value: s.id }));
  const tierOptions = (facts.prices?.tiers ?? []).map((t) => ({ label: t.label, value: t.id }));
  const collectionOptions = Object.values(COLLECTIONS).map((c) => ({
    label: c.label,
    value: c.id,
  }));
  const filterFieldOptions = Object.values(COLLECTIONS).flatMap((c) =>
    c.fields.filter((f) => f.filterable).map((f) => ({ label: f.label, value: f.name }))
  );

  // Blocks whose content comes from facts. Duplicating one is always a
  // mistake: two copies of the opening hours on a page cannot disagree, but
  // they can certainly confuse, and the owner would have no way to tell which
  // one is "the" one.
  const factDriven = { duplicate: false } as const;

  return {
    root: {
      // Nothing is editable at page level. Puck offers a root title field by
      // default; the page title lives in the pages table, and a second copy
      // here would be the kind of duplicate this architecture exists to
      // prevent.
      fields: {},
      permissions: { edit: false, drag: false, delete: false, duplicate: false },
    },
    components: {
      Hero: {
        label: "Openingsblok",
        fields: {
          eyebrow: { type: "text", label: "Bovenschrift" },
          heading: { type: "text", label: "Kop" },
          body: { type: "textarea", label: "Tekst" },
          image: { type: "text", label: "Afbeelding (URL)" },
          imageAlt: { type: "text", label: "Beschrijving van de afbeelding" },
          layout: {
            type: "radio",
            label: "Weergave",
            options: [
              { label: "Foto ernaast", value: "beside" },
              { label: "Tekst over de foto", value: "overlay" },
            ],
          },
          usePhone: {
            type: "radio",
            label: "Knop 1 belt",
            options: [
              { label: "Ja, gebruik ons telefoonnummer", value: true },
              { label: "Nee, eigen link", value: false },
            ],
          },
          primaryLabel: { type: "text", label: "Knop 1 — tekst" },
          primaryHref: { type: "text", label: "Knop 1 — link" },
          secondaryLabel: { type: "text", label: "Knop 2 — tekst" },
          secondaryHref: { type: "text", label: "Knop 2 — link" },
        },
        defaultProps: { heading: "Welkom", layout: "beside", usePhone: true },
        render: withFacts(Hero),
      },
      PageIntro: {
        label: "Paginakop",
        fields: {
          eyebrow: { type: "text", label: "Bovenschrift" },
          heading: { type: "text", label: "Kop" },
          lead: { type: "textarea", label: "Inleiding" },
          background: {
            type: "radio",
            label: "Achtergrond",
            options: [
              { label: "Licht", value: "tint" },
              { label: "Donker", value: "brand" },
            ],
          },
        },
        // One per page: the h1 is what tells a search engine and a screen
        // reader what the page is, and a page cannot be two things.
        permissions: { duplicate: false },
        defaultProps: { heading: "Titel van de pagina", background: "tint" },
        render: withFacts(PageIntro),
      },
      QuickLinks: {
        label: "Snelkoppelingen",
        fields: {
          heading: { type: "text", label: "Kop" },
          items: {
            type: "array",
            label: "Koppelingen",
            arrayFields: {
              icon: { type: "text", label: "Icoon" },
              label: { type: "text", label: "Titel" },
              description: { type: "text", label: "Toelichting" },
              href: { type: "text", label: "Link" },
            },
          },
        },
        defaultProps: { items: [] },
        render: withFacts(QuickLinks),
      },
      FeatureRow: {
        label: "Uitgelicht",
        fields: {
          eyebrow: { type: "text", label: "Bovenschrift" },
          heading: { type: "text", label: "Kop" },
          body: { type: "textarea", label: "Tekst" },
          points: {
            type: "array",
            label: "Punten",
            arrayFields: {
              icon: { type: "text", label: "Icoon" },
              title: { type: "text", label: "Titel" },
              text: { type: "textarea", label: "Tekst" },
            },
          },
          image: { type: "text", label: "Afbeelding (URL)" },
          imageAlt: { type: "text", label: "Beschrijving van de afbeelding" },
          imageSide: {
            type: "select",
            label: "Afbeelding aan",
            options: [{ label: "Rechts", value: "right" }, { label: "Links", value: "left" }],
          },
          linkLabel: { type: "text", label: "Link — tekst" },
          linkHref: { type: "text", label: "Link — adres" },
        },
        defaultProps: { heading: "Uitgelicht" },
        render: withFacts(FeatureRow),
      },
      CardGrid: {
        label: "Kaarten",
        fields: {
          heading: { type: "text", label: "Kop" },
          intro: { type: "textarea", label: "Inleiding" },
          fromServices: {
            type: "radio",
            label: "Inhoud",
            options: [
              { label: "Uit 'Mijn gegevens'", value: true },
              { label: "Zelf invullen", value: false },
            ],
          },
          serviceIds: { type: "select", label: "Welke", options: serviceOptions },
          cards: {
            type: "array",
            label: "Kaarten",
            arrayFields: {
              title: { type: "text", label: "Titel" },
              text: { type: "textarea", label: "Tekst" },
              image: { type: "text", label: "Afbeelding (URL)" },
              imageAlt: { type: "text", label: "Beschrijving van de afbeelding" },
              href: { type: "text", label: "Link" },
            },
          },
          columns: {
            type: "select",
            label: "Kolommen",
            options: [{ label: "2", value: 2 }, { label: "3", value: 3 }, { label: "4", value: 4 }],
          },
        },
        defaultProps: { columns: 3, fromServices: true },
        render: withFacts(CardGrid),
      },
      PriceTable: {
        label: "Prijzen",
        // No amount fields here on purpose. Prices live in "Mijn gegevens" so
        // one edit is correct on every page.
        fields: {
          heading: { type: "text", label: "Kop" },
          tierIds: { type: "select", label: "Welke tarieven", options: tierOptions },
          showPackages: {
            type: "radio",
            label: "Arrangementen tonen",
            options: [{ label: "Ja", value: true }, { label: "Nee", value: false }],
          },
          note: { type: "textarea", label: "Opmerking" },
          ctaLabel: { type: "text", label: "Knop — tekst" },
          ctaHref: { type: "text", label: "Knop — link" },
        },
        defaultProps: { heading: "Wat kost het?" },
        permissions: factDriven,
        render: withFacts(PriceTable),
      },
      HoursSummary: {
        label: "Openingstijden (kort)",
        fields: {
          heading: { type: "text", label: "Kop" },
          style: {
            type: "radio",
            label: "Weergave",
            options: [{ label: "Balk", value: "bar" }, { label: "Blok", value: "block" }],
          },
          linkLabel: { type: "text", label: "Link — tekst" },
          linkHref: { type: "text", label: "Link — adres" },
        },
        defaultProps: { style: "block" },
        permissions: factDriven,
        render: withFacts(HoursSummary),
      },
      HoursCalendar: {
        label: "Openingstijden (kalender)",
        fields: {
          heading: { type: "text", label: "Kop" },
          months: { type: "number", label: "Aantal maanden" },
        },
        defaultProps: { months: 3 },
        permissions: factDriven,
        render: withFacts(HoursCalendar),
      },
      Gallery: {
        label: "Fotogalerij",
        fields: {
          heading: { type: "text", label: "Kop" },
          intro: { type: "textarea", label: "Inleiding" },
          images: {
            type: "array",
            label: "Foto's",
            arrayFields: {
              src: { type: "text", label: "Afbeelding (URL)" },
              alt: { type: "text", label: "Wat is er te zien?" },
              caption: { type: "text", label: "Bijschrift" },
            },
          },
          linkLabel: { type: "text", label: "Link — tekst" },
          linkHref: { type: "text", label: "Link — adres" },
        },
        defaultProps: { images: [] },
        render: withFacts(Gallery),
      },
      TextSection: {
        label: "Tekst",
        fields: {
          heading: { type: "text", label: "Kop" },
          body: { type: "textarea", label: "Tekst" },
          width: {
            type: "select",
            label: "Breedte",
            options: [{ label: "Smal", value: "narrow" }, { label: "Breed", value: "wide" }],
          },
          background: {
            type: "select",
            label: "Achtergrond",
            options: [{ label: "Wit", value: "default" }, { label: "Gekleurd", value: "alt" }],
          },
        },
        defaultProps: { body: "" },
        render: withFacts(TextSection),
      },
      FAQ: {
        label: "Veelgestelde vragen",
        fields: {
          heading: { type: "text", label: "Kop" },
          items: {
            type: "array",
            label: "Vragen",
            arrayFields: {
              question: { type: "text", label: "Vraag" },
              answer: { type: "textarea", label: "Antwoord" },
            },
          },
        },
        defaultProps: { items: [] },
        render: withFacts(FAQ),
      },
      CTABand: {
        label: "Oproepbalk",
        fields: {
          heading: { type: "text", label: "Kop" },
          body: { type: "textarea", label: "Tekst" },
          label: { type: "text", label: "Knop — tekst" },
          usePhone: {
            type: "radio",
            label: "Knop belt",
            options: [
              { label: "Ja, gebruik ons telefoonnummer", value: true },
              { label: "Nee, eigen link", value: false },
            ],
          },
          href: { type: "text", label: "Knop — link" },
        },
        defaultProps: { heading: "Kom langs", label: "Bel ons", usePhone: true },
        render: withFacts(CTABand),
      },
      MapContact: {
        label: "Adres en route",
        fields: {
          heading: { type: "text", label: "Kop" },
          showRouteLink: {
            type: "radio",
            label: "Routeknop tonen",
            options: [{ label: "Ja", value: true }, { label: "Nee", value: false }],
          },
          extraNote: { type: "textarea", label: "Extra opmerking" },
        },
        defaultProps: { showRouteLink: true },
        permissions: factDriven,
        render: withFacts(MapContact),
      },
      Embed: {
        label: "Extern blok (tickets, reserveren, video)",
        fields: {
          heading: { type: "text", label: "Kop" },
          intro: { type: "textarea", label: "Inleiding" },
          title: { type: "text", label: "Omschrijving (voor voorleessoftware)" },
          src: { type: "text", label: "Adres van het blok" },
          ratio: {
            type: "select",
            label: "Verhouding",
            options: [
              { label: "Breed (16:9)", value: "16:9" },
              { label: "4:3", value: "4:3" },
              { label: "Vierkant", value: "1:1" },
              { label: "Hoog", value: "tall" },
            ],
          },
          fallbackLabel: { type: "text", label: "Terugvaloptie — tekst" },
          fallbackHref: { type: "text", label: "Terugvaloptie — link" },
        },
        defaultProps: { title: "", src: "", ratio: "16:9" },
        render: withFacts(Embed),
      },
      Testimonials: {
        label: "Reacties van klanten",
        fields: {
          heading: { type: "text", label: "Kop" },
          items: {
            type: "array",
            label: "Reacties",
            arrayFields: {
              quote: { type: "textarea", label: "Reactie" },
              author: { type: "text", label: "Naam" },
              source: { type: "text", label: "Bron" },
              sourceUrl: { type: "text", label: "Link naar bron" },
            },
          },
        },
        defaultProps: { items: [] },
        render: withFacts(Testimonials),
      },
      ProductGrid: {
        label: "Uit de collectie",
        // Filters, never item data. The owner picks which items appear; the
        // items themselves are edited once, on their own screen.
        fields: {
          heading: { type: "text", label: "Kop" },
          intro: { type: "textarea", label: "Inleiding" },
          collection: { type: "select", label: "Welke collectie", options: collectionOptions },
          filters: {
            type: "array",
            label: "Filters",
            arrayFields: {
              field: { type: "select", label: "Veld", options: filterFieldOptions },
              value: { type: "text", label: "Waarde" },
            },
          },
          limit: { type: "number", label: "Hoeveel tonen" },
          columns: {
            type: "select",
            label: "Kolommen",
            options: [
              { label: "2", value: 2 },
              { label: "3", value: 3 },
              { label: "4", value: 4 },
              { label: "5", value: 5 },
            ],
          },
          showPrices: {
            type: "radio",
            label: "Prijzen tonen",
            options: [{ label: "Ja", value: true }, { label: "Nee", value: false }],
          },
          background: {
            type: "radio",
            label: "Achtergrond",
            options: [
              { label: "Wit", value: "default" },
              { label: "Gekleurd", value: "tint" },
            ],
          },
          variety: {
            type: "radio",
            label: "Merken afwisselen",
            options: [
              { label: "Ja, eerst één per merk", value: true },
              { label: "Nee, op volgorde", value: false },
            ],
          },
          offset: { type: "number", label: "Eerste artikelen overslaan" },
          emptyText: { type: "textarea", label: "Tekst als er niets is" },
          linkLabel: { type: "text", label: "Link — tekst" },
          linkHref: { type: "text", label: "Link — adres" },
        },
        defaultProps: { columns: 5, limit: 10, showPrices: true, background: "default", variety: true, offset: 0, filters: [] },
        render: withFacts(ProductGrid),
      },
    },
  };
}
