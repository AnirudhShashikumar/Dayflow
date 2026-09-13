import { describe, expect, it } from "vitest";
import { businessDate, formatBusinessLocal, monthBounds, parseBusinessLocal } from "./organization-date";

describe("organization calendar", () => {
  it("uses the organization day across UTC boundaries", () => {
    const instant = new Date("2026-09-13T20:30:00Z");
    expect(businessDate(instant, "Asia/Kolkata")).toBe("2026-09-14");
    expect(businessDate(instant, "America/Los_Angeles")).toBe("2026-09-13");
  });
  it("calculates February month bounds including leap years", () => {
    expect(monthBounds("2028-02-15")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(monthBounds("2027-02-15").to).toBe("2027-02-28");
  });
  it("converts a local attendance time to UTC and back", () => {
    const utc = parseBusinessLocal("2026-09-14T09:30", "Asia/Kolkata");
    expect(utc).toBe("2026-09-14T04:00:00.000Z");
    expect(formatBusinessLocal(utc, "Asia/Kolkata")).toBe("2026-09-14T09:30");
  });
  it("rejects a skipped daylight-saving time", () => {
    expect(() => parseBusinessLocal("2026-03-08T02:30", "America/New_York")).toThrow();
  });
});
