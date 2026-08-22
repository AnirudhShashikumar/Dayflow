import type { UserRole } from "@/types/domain";

export type Permission =
  | "profile:read:self" | "profile:update:self" | "employees:manage"
  | "attendance:self" | "attendance:manage" | "leave:self" | "leave:approve"
  | "payroll:self" | "payroll:manage" | "documents:self" | "documents:manage"
  | "reports:read" | "announcements:manage" | "audit:read" | "settings:manage" | "roles:manage";

const permissions: Record<UserRole, ReadonlySet<Permission>> = {
  employee: new Set(["profile:read:self", "profile:update:self", "attendance:self", "leave:self", "payroll:self", "documents:self"]),
  hr: new Set(["profile:read:self", "profile:update:self", "employees:manage", "attendance:self", "attendance:manage", "leave:self", "leave:approve", "payroll:self", "payroll:manage", "documents:self", "documents:manage", "reports:read", "announcements:manage", "audit:read"]),
  admin: new Set(["profile:read:self", "profile:update:self", "employees:manage", "attendance:self", "attendance:manage", "leave:self", "leave:approve", "payroll:self", "payroll:manage", "documents:self", "documents:manage", "reports:read", "announcements:manage", "audit:read", "settings:manage", "roles:manage"]),
};

export const can = (role: UserRole, permission: Permission) => permissions[role].has(permission);
export const isManagement = (role: UserRole) => role === "hr" || role === "admin";
export const dashboardPath = (_role: UserRole) => "/home";
