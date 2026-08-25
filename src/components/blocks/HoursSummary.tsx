import { describeNextOpen, isOpenNow, weekSchedule } from "../../hours";
import type { BlockProps } from "../../types";
import { externalProps } from "../../links";

/** Reads facts.hours. "Is it open" is the question most visitors to a small
 *  business site are actually asking, so this belongs high on the page. */
export type HoursSummaryProps = {
  heading?: string;
  style?: "bar" | "block";
  linkLabel?: string;
  linkHref?: string;
};

function Dot({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${open ? "bg-emerald-400" : "bg-white/40"}`}
    />
  );
}

export function HoursSummary({ heading, style = "block", linkLabel, linkHref, facts }: BlockProps<HoursSummaryProps>) {
  const line = describeNextOpen(facts.hours, facts.meta.language === "nl" ? "nl-NL" : undefined);

  if (style === "bar") {
    // A sentence stretched across 1400px is the failure this block used to
    // have: a full-bleed band carrying eight words and a lot of empty colour.
    // The week fills the width honestly, and it is the thing a visitor
    // planning a trip actually wants — including "which day is late-night".
    const week = weekSchedule(facts.hours);
    const open = isOpenNow(facts.hours);

    return (
      <section aria-label="Openingstijden" className="bg-(--color-brand-dark) text-white">
        <div className="page grid gap-6 py-6 lg:grid-cols-[minmax(0,20rem)_1fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase">
              <Dot open={open} />
              Openingstijden
            </p>
            <p className="mt-1 text-lg font-semibold">{line}</p>
            {linkHref && (
              <a href={linkHref} className="mt-1 inline-block text-sm text-white/80 underline" {...externalProps(linkHref)}>
                {linkLabel ?? "Hele kalender"}
              </a>
            )}
          </div>
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-(--radius-soft) bg-white/15 sm:grid-cols-4 lg:grid-cols-7">
            {week.map((day) => (
              <li
                key={day.date}
                aria-current={day.isToday ? "date" : undefined}
                className={`px-3 py-2 text-sm ${day.isToday ? "bg-white text-(--color-brand-dark)" : "bg-(--color-brand-dark)"}`}
              >
                <span className="block text-xs tracking-wide uppercase opacity-75">
                  {day.label.slice(0, 2)}
                </span>
                <span className="mt-0.5 block font-medium tabular-nums">
                  {day.open ? `${day.from}–${day.to}` : "gesloten"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  // Page width rather than a centred narrow column: on a wide page a narrow
  // block sitting between full-width neighbours gives the whole page a ragged
  // left edge, and it reads as a mistake rather than as emphasis.
  const week = weekSchedule(facts.hours);
  return (
    <section className="page grid gap-8 py-14 lg:grid-cols-[minmax(0,22rem)_minmax(0,32rem)]">
      <div>
        {heading && <h2 className="text-3xl font-semibold">{heading}</h2>}
        <p className="mt-4 text-lg">{line}</p>
        {facts.hours.notes && (
          <p className="mt-3 text-sm text-(--color-muted)">{facts.hours.notes}</p>
        )}
        {linkHref && (
          <a href={linkHref} className="mt-4 inline-block font-medium text-(--color-brand) underline" {...externalProps(linkHref)}>
            {linkLabel ?? "Bekijk de kalender"}
          </a>
        )}
      </div>
      <table className="w-full self-start text-left">
        <caption className="sr-only">Openingstijden deze week</caption>
        <tbody>
          {week.map((day) => (
            <tr key={day.date} className="border-b border-black/10 last:border-0">
              <th
                scope="row"
                className={`py-2 font-normal capitalize ${day.isToday ? "font-semibold text-(--color-brand-dark)" : ""}`}
              >
                {day.label}
                {day.isToday && <span className="ml-2 text-xs text-(--color-muted)">vandaag</span>}
              </th>
              <td className="py-2 text-right tabular-nums">
                {day.open ? `${day.from} – ${day.to}` : (day.reason ?? "Gesloten")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
