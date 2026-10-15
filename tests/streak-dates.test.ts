import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  displayedStreak,
  localDayKey,
  updateStreak,
} from "@/lib/learning/progress";

const originalTimeZone = process.env.TZ;

beforeAll(() => {
  process.env.TZ = "America/New_York";
  expect(new Date(2026, 2, 8, 12).getTimezoneOffset()).not.toBe(
    new Date(2026, 2, 7, 12).getTimezoneOffset()
  );
});

afterAll(() => {
  if (originalTimeZone === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = originalTimeZone;
  }
});

describe("local streak dates", () => {
  it("formats a local calendar date", () => {
    expect(localDayKey(new Date(2026, 0, 1, 23, 59))).toBe("2026-01-01");
  });

  it("starts at one on a first visit", () => {
    expect(updateStreak(null, 0, new Date(2026, 0, 1, 12))).toEqual({
      streak: 1,
      lastActiveDate: "2026-01-01",
    });
  });

  it("keeps the streak on the same day", () => {
    expect(
      updateStreak("2026-01-01", 4, new Date(2026, 0, 1, 18))
    ).toEqual({ streak: 4, lastActiveDate: "2026-01-01" });
  });

  it("increments the streak on the next day", () => {
    expect(
      updateStreak("2026-01-01", 4, new Date(2026, 0, 2, 12))
    ).toEqual({ streak: 5, lastActiveDate: "2026-01-02" });
  });

  it("restarts after a gap of two days", () => {
    expect(
      updateStreak("2026-01-01", 4, new Date(2026, 0, 3, 12))
    ).toEqual({ streak: 1, lastActiveDate: "2026-01-03" });
  });

  it("increments across a late-night local-day rollover", () => {
    const lastActiveDate = localDayKey(new Date(2026, 0, 1, 23, 59));
    expect(
      updateStreak(lastActiveDate, 4, new Date(2026, 0, 2, 0, 1))
    ).toEqual({ streak: 5, lastActiveDate: "2026-01-02" });
  });

  it("increments across a month and year boundary", () => {
    expect(
      updateStreak("2026-12-31", 4, new Date(2027, 0, 1, 12))
    ).toEqual({ streak: 5, lastActiveDate: "2027-01-01" });
  });

  it("increments across spring-forward and fall-back local days", () => {
    for (const now of [
      new Date(2026, 2, 8, 0, 30),
      new Date(2026, 2, 8, 23, 30),
    ]) {
      expect(updateStreak("2026-03-07", 4, now)).toEqual({
        streak: 5,
        lastActiveDate: "2026-03-08",
      });
    }

    for (const now of [
      new Date(2026, 10, 1, 0, 30),
      new Date(2026, 10, 1, 23, 30),
    ]) {
      expect(updateStreak("2026-10-31", 4, now)).toEqual({
        streak: 5,
        lastActiveDate: "2026-11-01",
      });
    }
  });

  it("increments across a day in Pacific/Auckland", () => {
    const timeZone = process.env.TZ;
    const newYorkOffset = new Date(2026, 5, 30, 12).getTimezoneOffset();
    process.env.TZ = "Pacific/Auckland";
    try {
      expect(new Date(2026, 5, 30, 12).getTimezoneOffset()).not.toBe(
        newYorkOffset
      );
      expect(
        updateStreak("2026-06-30", 4, new Date(2026, 6, 1, 0, 30))
      ).toEqual({ streak: 5, lastActiveDate: "2026-07-01" });
    } finally {
      if (timeZone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = timeZone;
      }
    }
  });

  it("keeps a streak and stored date when the device clock moves backwards", () => {
    expect(
      updateStreak("2026-10-20", 4, new Date(2026, 9, 18, 12))
    ).toEqual({ streak: 4, lastActiveDate: "2026-10-20" });
  });
});

describe("displayed streak", () => {
  it("shows the streak for today and yesterday", () => {
    expect(
      displayedStreak("2026-01-02", 4, new Date(2026, 0, 2, 12))
    ).toBe(4);
    expect(
      displayedStreak("2026-01-01", 4, new Date(2026, 0, 2, 12))
    ).toBe(4);
  });

  it("hides a streak after two or more days and when no date exists", () => {
    expect(
      displayedStreak("2025-12-31", 4, new Date(2026, 0, 2, 12))
    ).toBe(0);
    expect(displayedStreak(null, 4, new Date(2026, 0, 2, 12))).toBe(0);
  });
});
