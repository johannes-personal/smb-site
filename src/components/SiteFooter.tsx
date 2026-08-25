import type { Facts } from "../facts";
import { weekSchedule } from "../hours";
import { externalProps } from "../links";

export function SiteFooter({ facts }: { facts: Facts }) {
  const { nap } = facts;
  // The week in the footer, because on a wide page three columns of contact
  // details leave a quarter of the row empty — and because "when are you open"
  // is the question worth answering on every page, not only on /contact.
  const week = weekSchedule(facts.hours);
  return (
    <footer className="mt-16 border-t border-black/10 bg-(--color-surface-alt)">
      <div className="page grid gap-8 py-12 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-semibold">{nap.tradingName ?? nap.legalName}</p>
          <address className="mt-2 not-italic text-(--color-muted)">
            {nap.address.street}<br />{nap.address.postalCode} {nap.address.city}
          </address>
        </div>
        <div>
          <p className="font-semibold">Contact</p>
          <p className="mt-2">
            <a href={`tel:${nap.phone}`} className="underline">{nap.phoneDisplay}</a>
            {nap.email && <><br /><a href={`mailto:${nap.email}`} className="underline">{nap.email}</a></>}
          </p>
        </div>
        <div>
          <p className="font-semibold">Gegevens</p>
          {/* KvK and BTW are required for a business trading in the Netherlands. */}
          <p className="mt-2 text-(--color-muted)">
            {nap.kvk && <>KvK {nap.kvk}<br /></>}
            {nap.btw && <>Btw {nap.btw}</>}
          </p>
          <ul className="mt-3 flex gap-3">
            {facts.socials.map((s) => (<li key={s.url}><a href={s.url} className="underline" {...externalProps(s.url)}>{s.label}</a></li>))}
          </ul>
        </div>
        <div>
          <p className="font-semibold">Openingstijden</p>
          <ul className="mt-2 text-(--color-muted)">
            {week.map((day) => (
              <li
                key={day.date}
                className={`flex justify-between gap-4 ${day.isToday ? "font-semibold text-(--color-ink)" : ""}`}
              >
                <span className="capitalize">{day.label}</span>
                <span className="tabular-nums">
                  {day.open ? `${day.from}–${day.to}` : "gesloten"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="pb-8 text-center text-xs text-(--color-muted)">
        © {new Date().getFullYear()} {nap.legalName}
      </p>
    </footer>
  );
}
