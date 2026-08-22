import { ManagementDashboard } from "@/components/dashboard/management-dashboard";
import { requireProfile } from "@/lib/auth/session";
export default async function HrPage(){const profile=await requireProfile(["hr","admin"]);return <ManagementDashboard profile={profile}/>}
