import { Mail, Phone, MapPin, ShieldCheck } from "lucide-react";
import { requireProfile, getViewerContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/shared/avatar";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/features/employees/profile-form";

export default async function ProfilePage() {
  const profile = await requireProfile();
  const [viewer, supabase] = await Promise.all([getViewerContext(), createClient()]);
  const { data: personal, error } = await supabase.from("employee_profiles")
    .select("phone,address,emergency_contact_name,emergency_contact_phone,employment_type")
    .eq("profile_id", profile.id).maybeSingle();
  if (error || !personal || !viewer?.employee) throw new Error("Unable to load your profile");
  const employee = viewer?.employee;
  const jobFields = [
    [ShieldCheck, "Employee ID", employee?.employeeCode],
    [MapPin, "Department", employee?.department],
    [Phone, "Designation", employee?.designation],
    [Mail, "Employment type", personal?.employment_type?.replace("_", " ")],
  ] as const;
  return <div className="space-y-6">
    <Card><CardContent className="flex flex-col gap-5 pt-5 sm:flex-row sm:items-center"><Avatar name={profile.full_name} src={profile.avatar_url} size="lg"/><div><div className="flex items-center gap-2"><h2 className="text-2xl font-bold">{profile.full_name}</h2><Badge tone="plum">{profile.role}</Badge></div><p className="text-muted mt-1">{employee?.designation ?? "Designation pending"} · {employee?.department ?? "Department unassigned"}</p><p className="text-muted mt-3 flex items-center gap-2 text-sm"><Mail className="size-4"/>{profile.email}</p></div></CardContent></Card>
    <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><Card><CardHeader><div><CardTitle>Personal information</CardTitle><p className="text-muted mt-1 text-sm">You can edit personal contact and emergency details.</p></div></CardHeader><CardContent><ProfileForm initial={{ phone: personal?.phone ?? null, address: personal?.address ?? null, emergency_contact_name: personal?.emergency_contact_name ?? null, emergency_contact_phone: personal?.emergency_contact_phone ?? null }} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Job information</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">{jobFields.map(([Icon, label, value]) => <div key={label} className="flex gap-3"><Icon className="mt-0.5 size-4 text-muted"/><div><p className="text-muted text-xs">{label}</p><p className="mt-0.5 font-medium capitalize">{value ?? "—"}</p></div></div>)}</CardContent></Card></div>
  </div>;
}
