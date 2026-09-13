import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { dashboardPath } from "@/lib/permissions";

export default async function OverviewPage() {
  const profile = await requireProfile();
  redirect(dashboardPath(profile.role));
}
