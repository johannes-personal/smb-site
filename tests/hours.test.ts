import { describe, expect, it } from "vitest";
import { describeNextOpen, isOpenNow, nextOpen, statusForDate, weekSchedule } from "../src/hours";
import type { HoursFact } from "../src/facts";

// The opening hours are the most consequential thing on a shop's website —
// more visits are lost to "is it open now" than to anything else. Every test
// below corresponds to a bug that was actually shipped and fixed, so these are
// regression tests rather than decoration.

const HOURS: HoursFact = {
  mode: "regular",
  timezone: "Europe/Amsterdam",
  seasons: [
    {
      id: "regulier",
      label: "Reguliere openingstijden",
      rules: [
        { when: "default", days: ["ma"], open: "13:30", close: "17:00" },
        { when: "default", days: ["di", "wo", "do"], open: "09:30", close: "17:30" },
        { when: "default", days: ["vr"], open: "09:30", close: "21:00" },
        { when: "default", days: ["za"], open: "09:30", close: "17:00" },
      ],
    },
  ],
  closed: [{ days: ["zo"], reason: "Op zondag zijn wij gesloten" }],
  exceptions: [],
};

/** A moment in UTC — which is what the server clock actually is on Vercel. */
const utc = (iso: string) => new Date(iso);

describe("weekly pattern", () => {
  it("is closed on Sunday", () => {
    // 2026-08-16 is a Sunday.
    const s = statusForDate(HOURS, "2026-08-16");
    expect(s.open).toBe(false);
    expect(s.reason).toMatch(/zondag/i);
  });

  it("is shut on Monday morning and open in the afternoon", () => {
    const monday = statusForDate(HOURS, "2026-08-17");
    expect(monday.open).toBe(true);
    expect(monday.from).toBe("13:30");
    // 09:00 Amsterdam = 07:00 UTC — before opening.
    expect(isOpenNow(HOURS, utc("2026-08-17T07:00:00Z"))).toBe(false);
    // 14:00 Amsterdam = 12:00 UTC — open.
    expect(isOpenNow(HOURS, utc("2026-08-17T12:00:00Z"))).toBe(true);
  });

  it("keeps the Friday koopavond open until 21:00", () => {
    // 2026-08-21 is a Friday. 20:30 Amsterdam = 18:30 UTC.
    expect(isOpenNow(HOURS, utc("2026-08-21T18:30:00Z"))).toBe(true);
    // The same clock time on Thursday is after close.
    expect(isOpenNow(HOURS, utc("2026-08-20T18:30:00Z"))).toBe(false);
  });
});

describe("timezone", () => {
  // The bug: isOpenNow compared a UTC wall clock against local opening times.
  // The facts carried a timezone field that was never read, so "nu open" was
  // wrong by one or two hours all year on a UTC host.
  it("reads the clock in the shop's timezone, not the server's", () => {
    // 08:00 UTC is 10:00 in Amsterdam (CEST) — the shop is open.
    expect(isOpenNow(HOURS, utc("2026-08-18T08:00:00Z"))).toBe(true);
    // 16:00 UTC is 18:00 in Amsterdam — shut, though 16:00 would look open.
    expect(isOpenNow(HOURS, utc("2026-08-18T16:00:00Z"))).toBe(false);
  });

  it("handles winter time as well as summer time", () => {
    // January: Amsterdam is CET (+1). 16:45 UTC = 17:45 local, after close.
    expect(isOpenNow(HOURS, utc("2027-01-13T16:45:00Z"))).toBe(false);
    // 16:15 UTC = 17:15 local, still open.
    expect(isOpenNow(HOURS, utc("2027-01-13T16:15:00Z"))).toBe(true);
  });

  it("uses the local date, not the UTC one, after midnight", () => {
    // 22:30 UTC on Sunday is already 00:30 Monday in Amsterdam. Answering for
    // Sunday here would report the shop closed on a day it opens.
    const next = nextOpen(HOURS, utc("2026-08-16T22:30:00Z"));
    expect(next?.date).toBe("2026-08-17");
    expect(next?.from).toBe("13:30");
  });
});

describe("nextOpen", () => {
  // The bug: after closing time it still returned today, so at 18:00 on a
  // Tuesday the site said "eerstvolgend open: dinsdag 09:30–17:30" — a time
  // four hours in the past.
  it("skips today once today's closing time has passed", () => {
    // 18:00 UTC on Tuesday = 20:00 Amsterdam, well after 17:30.
    const next = nextOpen(HOURS, utc("2026-08-18T18:00:00Z"));
    expect(next?.date).toBe("2026-08-19");
  });

  it("still offers today when the shop has not opened yet", () => {
    // 06:00 UTC = 08:00 Amsterdam on a Tuesday, before the 09:30 opening.
    const next = nextOpen(HOURS, utc("2026-08-18T06:00:00Z"));
    expect(next?.date).toBe("2026-08-18");
    expect(describeNextOpen(HOURS, "nl-NL")).toBeTypeOf("string");
  });

  it("jumps over Sunday to Monday afternoon", () => {
    // Saturday 16:00 UTC = 18:00 Amsterdam, after the 17:00 close.
    const next = nextOpen(HOURS, utc("2026-08-15T16:00:00Z"));
    expect(next?.date).toBe("2026-08-17");
    expect(next?.from).toBe("13:30");
  });
});

describe("seasons", () => {
  // The bug: seasons required from/to, so a year-round business had to invent
  // a window that either lies or expires — and outside every season the engine
  // returns closed, so the site went dark on 1 January.
  it("applies a season with no dates all year", () => {
    expect(statusForDate(HOURS, "2027-06-01").open).toBe(true);
    expect(statusForDate(HOURS, "2031-06-03").open).toBe(true);
  });

  it("lets a dated season take precedence over the year-round one", () => {
    const withSummer: HoursFact = {
      ...HOURS,
      seasons: [
        ...HOURS.seasons,
        {
          id: "zomer-2026",
          label: "Zomer 2026",
          from: "2026-07-01",
          to: "2026-08-31",
          rules: [{ when: "default", days: ["di"], open: "10:00", close: "16:00" }],
        },
      ],
    };
    // Inside the window the summer rule wins.
    expect(statusForDate(withSummer, "2026-08-18")).toMatchObject({
      open: true,
      from: "10:00",
      to: "16:00",
    });
    // Outside it, back to the year-round rule.
    expect(statusForDate(withSummer, "2026-09-15")).toMatchObject({
      open: true,
      from: "09:30",
      to: "17:30",
    });
  });
});

describe("exceptions", () => {
  it("closes on a holiday that would otherwise be a normal open day", () => {
    const withHoliday: HoursFact = {
      ...HOURS,
      exceptions: [{ date: "2026-12-25", status: "closed", reason: "Eerste Kerstdag" }],
    };
    const s = statusForDate(withHoliday, "2026-12-25");
    expect(s.open).toBe(false);
    expect(s.reason).toBe("Eerste Kerstdag");
  });

  it("opens on a Sunday when an exception says so", () => {
    // Precedence matters: exceptions must beat the blanket Sunday closure, or
    // a koopzondag can never be entered.
    const koopzondag: HoursFact = {
      ...HOURS,
      exceptions: [
        { date: "2026-12-20", open: "12:00", close: "17:00", reason: "Koopzondag" },
      ],
    };
    expect(statusForDate(koopzondag, "2026-12-20")).toMatchObject({
      open: true,
      from: "12:00",
      to: "17:00",
    });
  });
});

describe("weekSchedule", () => {
  // 2026-08-19 is a Wednesday; 12:00 UTC is 14:00 in Amsterdam.
  const wednesday = utc("2026-08-19T12:00:00Z");

  it("runs Monday to Sunday whatever day it is called on", () => {
    for (const day of ["2026-08-17", "2026-08-19", "2026-08-23"]) {
      const week = weekSchedule(HOURS, utc(`${day}T12:00:00Z`));
      expect(week).toHaveLength(7);
      expect(week[0].label).toBe("maandag");
      expect(week[6].label).toBe("zondag");
      expect(week[0].date).toBe("2026-08-17");
      expect(week[6].date).toBe("2026-08-23");
    }
  });

  it("marks exactly one day as today", () => {
    const week = weekSchedule(HOURS, wednesday);
    expect(week.filter((d) => d.isToday)).toHaveLength(1);
    expect(week.find((d) => d.isToday)?.date).toBe("2026-08-19");
  });

  it("carries the same statuses the rest of the engine gives", () => {
    const week = weekSchedule(HOURS, wednesday);
    expect(week[0]).toMatchObject({ open: true, from: "13:30", to: "17:00" });
    expect(week[4]).toMatchObject({ open: true, to: "21:00" }); // koopavond
    expect(week[6].open).toBe(false);
  });

  it("uses the business's week, not the server's, late in the evening", () => {
    // 22:30 UTC on Sunday is already Monday 00:30 in Amsterdam, so the week
    // shown must be the new one. Getting this wrong shows a shop the week it
    // has just finished.
    const week = weekSchedule(HOURS, utc("2026-08-23T22:30:00Z"));
    expect(week[0].date).toBe("2026-08-24");
    expect(week.find((d) => d.isToday)?.date).toBe("2026-08-24");
  });
});
