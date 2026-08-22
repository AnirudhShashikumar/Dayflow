import type { UserRole } from "@/types/domain";

export type LoginPortal = "employee" | "hr";

export const DEFAULT_LOGIN_PORTAL: LoginPortal = "employee";

export function parseLoginPortal(value: unknown): LoginPortal {
  return value === "hr" ? "hr" : DEFAULT_LOGIN_PORTAL;
}

export function canEnterPortal(portal: LoginPortal, role: UserRole) {
  return portal === "employee" || role === "hr" || role === "admin";
}
