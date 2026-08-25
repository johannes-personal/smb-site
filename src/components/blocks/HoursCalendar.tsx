import { monthStatuses } from "../../hours";
import type { BlockProps } from "../../types";

export type HoursCalendarProps = { heading?: string; months?: number };

export function HoursCalendar({ heading, months = 3, facts }: BlockProps<HoursCalendarProps>) {
  const now = new Date();
  const blocks = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return {
      label: d.toLocaleDateString("nl-NL", { month: "long", year: "numeric" }),
      days: monthStatuses(facts.hours, d.getFullYear(), d.getMonth() + 1),
    };
  });

  return (
    <section className="page py-16">
      {heading && <h2 className="text-3xl font-semibold">{heading}</h2>}
      <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {blocks.map((m) => (
          <div key={m.label}>
            <h3 className="mb-3 font-semibold capitalize">{m.label}</h3>
            <ul className="space-y-1 text-sm">
              {m.days.map((d) => (
                <li key={d.date} className="flex justify-between gap-3">
                  <span>{new Date(d.date + "T12:00:00Z").toLocaleDateString("nl-NL", { weekday: "short", day: "numeric" })}</span>
                  <span className={d.open ? "" : "text-(--color-muted)"}>
                    {d.open ? `${d.from}–${d.to}` : d.reason ?? "gesloten"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
