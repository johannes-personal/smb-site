// Opening-hours rule engine.
//
// Small business hours are almost never a flat list of seven days. They are a
// season window, weekday rules, school-holiday behaviour and exceptions. One
// edit here drives the calendar page, the "open now" bar and the JSON-LD that
// Google reads — which is the whole reason hours are modelled rather than typed.
//
// Precedence, most specific first:
//   exception -> closed-days -> season schoolvakantie rule -> season default rule -> closed

import type { HoursFact, Season } from "./facts";

const DAY_KEYS = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const DAY_LABELS = [
  "zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag",
];

export type DayStatus = {
  date: string;
  open: boolean;
  from?: string;
  to?: string;
  reason?: string;
};

/** Today's date *in the business's timezone*. `toISOString()` is UTC, so a shop
 *  in Europe/Amsterdam checking at 00:30 CEST would otherwise be told about
 *  yesterday — and would show "gesloten" on an evening it is open. */
function iso(d: Date, timezone = "Europe/Amsterdam") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Wall-clock HH:MM in the business's timezone, for comparing against opening
 *  times. Vercel runs its servers in UTC; without this, "nu open" is wrong by
 *  one or two hours all year. */
function localTime(d: Date, timezone = "Europe/Amsterdam") {
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function expandDays(days: string[] | string): string[] {
  if (Array.isArray(days)) return days;
  // "ma-za" style range
  const [a, b] = days.split("-").map((s) => s.trim());
  const i = DAY_KEYS.indexOf(a);
  const j = DAY_KEYS.indexOf(b);
  if (i < 0 || j < 0) return [];
  const out: string[] = [];
  for (let k = i; ; k = (k + 1) % 7) {
    out.push(DAY_KEYS[k]);
    if (k === j) break;
  }
  return out;
}

/** A season with no `from`/`to` applies all year. Most businesses are not
 *  seasonal, and forcing them to invent a window means either a date that lies
 *  or one that silently expires — the shop goes dark on New Year's Day because
 *  a season ended. Dated seasons still win over the year-round one, so a
 *  summer exception can sit on top of normal hours. */
function seasonFor(hours: HoursFact, date: string): Season | undefined {
  const dated = hours.seasons.filter((s) => s.from && s.to);
  const match = dated.find((s) => date >= s.from! && date <= s.to!);
  if (match) return match;
  return hours.seasons.find((s) => !s.from && !s.to);
}

function inSchoolHoliday(hours: HoursFact, date: string, region?: string): boolean {
  return (hours.schoolHolidays ?? []).some(
    (h) => (!region || h.region === region) && date >= h.from && date <= h.to
  );
}

export function statusForDate(hours: HoursFact, date: string): DayStatus {
  const exception = (hours.exceptions ?? []).find((e) => e.date === date);
  if (exception) {
    if (exception.status === "closed" || (!exception.open && !exception.status)) {
      return { date, open: false, reason: exception.reason };
    }
    return { date, open: true, from: exception.open, to: exception.close, reason: exception.reason };
  }

  const dayKey = DAY_KEYS[new Date(date + "T12:00:00Z").getUTCDay()];

  const closed = (hours.closed ?? []).find((c) => c.days.includes(dayKey));
  if (closed) return { date, open: false, reason: closed.reason };

  const season = seasonFor(hours, date);
  if (!season) return { date, open: false, reason: "Buiten het seizoen" };

  const holidayRule = season.rules.find(
    (r) => r.when === "schoolvakantie" && inSchoolHoliday(hours, date, r.region)
  );
  const rule =
    (holidayRule && expandDays(holidayRule.days).includes(dayKey) ? holidayRule : undefined) ??
    season.rules.find(
      (r) => (r.when ?? "default") === "default" && expandDays(r.days).includes(dayKey)
    );

  if (!rule) return { date, open: false };
  return { date, open: true, from: rule.open, to: rule.close };
}

export function isOpenNow(hours: HoursFact, now = new Date()): boolean {
  const s = statusForDate(hours, iso(now, hours.timezone));
  if (!s.open || !s.from || !s.to) return false;
  const hhmm = localTime(now, hours.timezone);
  return hhmm >= s.from && hhmm <= s.to;
}

/** The next moment the business is open, skipping today once today's closing
 *  time has passed. Without that check an enquiry at 18:00 on a Tuesday is
 *  answered with "eerstvolgend open: dinsdag, 09:30–17:30" — today, in the
 *  past. */
export function nextOpen(hours: HoursFact, from = new Date(), horizonDays = 400): DayStatus | null {
  const nowHhmm = localTime(from, hours.timezone);
  for (let i = 0; i < horizonDays; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const s = statusForDate(hours, iso(d, hours.timezone));
    if (!s.open) continue;
    if (i === 0 && s.to && nowHhmm > s.to) continue;
    return s;
  }
  return null;
}

export function describeNextOpen(hours: HoursFact, locale = "nl-NL"): string {
  if (hours.mode === "appointment") return "Alleen op afspraak";
  const now = new Date();
  if (isOpenNow(hours, now)) {
    const today = statusForDate(hours, iso(now, hours.timezone));
    return `Nu open tot ${today.to} uur`;
  }
  const next = nextOpen(hours, now);
  if (!next) return "Momenteel gesloten";
  const d = new Date(next.date + "T12:00:00Z");
  const day = DAY_LABELS[d.getUTCDay()];
  const dateLabel = d.toLocaleDateString(locale, { day: "numeric", month: "long" });
  const today = iso(now, hours.timezone);
  if (next.date === today) return `Vandaag open van ${next.from} tot ${next.to} uur`;
  return `Eerstvolgend open: ${day} ${dateLabel}, ${next.from}–${next.to} uur`;
}

export type WeekDay = DayStatus & { label: string; isToday: boolean };

/** Monday to Sunday of the week containing `from`, each day resolved through
 *  the same precedence as everything else. A summary line ("nu open tot 17:30")
 *  answers one question; a visitor planning a trip on Thursday needs the week,
 *  and reading it out of a paragraph of prose is work. */
export function weekSchedule(hours: HoursFact, from = new Date()): WeekDay[] {
  const today = iso(from, hours.timezone);
  // Anchor on the ISO date rather than the Date object, so the week is the
  // business's week and not the server's.
  const anchor = new Date(today + "T12:00:00Z");
  const offsetToMonday = (anchor.getUTCDay() + 6) % 7;
  const out: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(anchor);
    d.setUTCDate(d.getUTCDate() - offsetToMonday + i);
    const date = d.toISOString().slice(0, 10);
    const status = statusForDate(hours, date);
    out.push({
      ...status,
      label: DAY_LABELS[d.getUTCDay()],
      isToday: date === today,
    });
  }
  return out;
}

export function monthStatuses(hours: HoursFact, year: number, month: number): DayStatus[] {
  const out: DayStatus[] = [];
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let day = 1; day <= last; day++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    out.push(statusForDate(hours, date));
  }
  return out;
}
