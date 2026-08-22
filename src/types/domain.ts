export type UserRole = "employee" | "hr" | "admin";
export type AccountStatus = "active" | "inactive";
export type EmploymentStatus = "active" | "inactive" | "probation" | "resigned";
export type AttendanceStatus = "present" | "absent" | "half_day" | "leave";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type PayrollStatus = "draft" | "processed" | "paid";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  account_status: AccountStatus;
}

export interface EmployeeProfile {
  id: string;
  profile_id: string;
  employee_code: string;
  phone: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  department_id: string | null;
  designation: string;
  manager_id: string | null;
  employment_type: "full_time" | "part_time" | "contract" | "intern";
  joining_date: string;
  employment_status: EmploymentStatus;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  work_date: string;
  check_in: string | null;
  check_out: string | null;
  total_minutes: number;
  status: AttendanceStatus;
  notes: string | null;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  is_half_day: boolean;
  remarks: string;
  status: LeaveStatus;
  reviewer_comment: string | null;
  created_at: string;
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  payroll_month: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  gross_salary: number;
  net_salary: number;
  status: PayrollStatus;
  payment_date: string | null;
}
