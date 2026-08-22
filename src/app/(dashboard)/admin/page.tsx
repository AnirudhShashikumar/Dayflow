import { ManagementDashboard } from "@/components/dashboard/management-dashboard";
import { requireProfile } from "@/lib/auth/session";
export default async function AdminPage(){const profile=await requireProfile(["admin"]);return <ManagementDashboard profile={profile}/>}
