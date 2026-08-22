import { differenceInCalendarDays, parseISO } from "date-fns";
import { z } from "zod";

export const loginSchema = z.object({ email: z.email("Enter a valid email"), password: z.string().min(8, "Use at least 8 characters") });
export const registerSchema = z.object({
  employeeCode: z.string().min(3).max(30),
  fullName: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(8).regex(/[A-Z]/, "Add an uppercase letter").regex(/[0-9]/, "Add a number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const leaveSchema = z.object({
  leaveTypeId: z.uuid(), startDate: z.iso.date(), endDate: z.iso.date(), isHalfDay: z.boolean().default(false), remarks: z.string().min(3).max(500),
}).refine((data) => parseISO(data.endDate) >= parseISO(data.startDate), { path: ["endDate"], message: "End date must be on or after start date" });

export const calculateLeaveDays = (start: string, end: string, halfDay = false) => halfDay ? 0.5 : differenceInCalendarDays(parseISO(end), parseISO(start)) + 1;
export const intervalsOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) => aStart <= bEnd && bStart <= aEnd;

export function payrollTotals(basic: number, allowances: number, deductions: number) {
  if ([basic, allowances, deductions].some((value) => value < 0)) throw new Error("Payroll amounts cannot be negative");
  const gross = basic + allowances;
  return { gross, net: gross - deductions };
}

export function attendanceDuration(checkIn: string, checkOut: string) {
  const minutes = Math.floor((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60_000);
  if (minutes < 0) throw new Error("Check-out must be after check-in");
  return minutes;
}
