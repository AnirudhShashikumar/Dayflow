import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { dashboardPath } from "@/lib/permissions";
import EmployeeHome from "./employee-home";

export default async function HomePage() {
  const profile = await requireProfile();
  if (profile.role !== "employee") redirect(dashboardPath(profile.role));
  return <EmployeeHome />;
}
