import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { dashboardPath } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function Home() { const profile = await getSessionProfile(); redirect(profile ? dashboardPath(profile.role) : "/login"); }
