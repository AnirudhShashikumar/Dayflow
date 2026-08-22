import { describe, expect, it } from "vitest";
import { attendanceDuration, calculateLeaveDays, intervalsOverlap, payrollTotals } from "./business";

describe("attendance business rules", () => {
  it("calculates server timestamp duration in whole minutes", () => expect(attendanceDuration("2026-08-22T09:00:00Z","2026-08-22T17:32:30Z")).toBe(512));
  it("rejects check-out before check-in", () => expect(() => attendanceDuration("2026-08-22T10:00:00Z","2026-08-22T09:00:00Z")).toThrow());
});
describe("leave business rules", () => {
  it("calculates inclusive and half-day durations", () => { expect(calculateLeaveDays("2026-08-24","2026-08-26")).toBe(3); expect(calculateLeaveDays("2026-08-24","2026-08-24",true)).toBe(.5); });
  it("detects overlapping date ranges", () => { expect(intervalsOverlap("2026-08-24","2026-08-26","2026-08-26","2026-08-28")).toBe(true); expect(intervalsOverlap("2026-08-24","2026-08-25","2026-08-26","2026-08-28")).toBe(false); });
});
describe("payroll calculations", () => {
  it("derives gross and net salary", () => expect(payrollTotals(80000,12000,4500)).toEqual({gross:92000,net:87500}));
  it("rejects negative amounts", () => expect(()=>payrollTotals(-1,0,0)).toThrow());
});
