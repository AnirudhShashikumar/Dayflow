import Link from "next/link";
import { format } from "date-fns";
import { ArrowUpDown, Search, UserPlus } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/shared/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { setEmploymentStatus } from "@/features/employees/actions";

const statusTone = { active: "success", inactive: "danger", probation: "warning", resigned: "neutral" } as const;
type SearchParams = { q?: string; department?: string; status?: string; sort?: string; page?: string };

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireProfile(["hr", "admin"]);
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const size = 10;
  const supabase = await createClient();
  let query = supabase.from("employee_profiles").select("id,profile_id,employee_code,designation,joining_date,employment_status,employment_type,department:departments(id,name),profile:profiles(full_name,email,avatar_url)", { count: "exact" });
  if (params.department) query = query.eq("department_id", params.department);
  if (params.status) query = query.eq("employment_status", params.status);
  if (params.q) query = query.or(`employee_code.ilike.%${params.q}%,designation.ilike.%${params.q}%`);
  query = query.order(params.sort === "joining" ? "joining_date" : "employee_code", { ascending: params.sort !== "joining" }).range((page - 1) * size, page * size - 1);
  const [{ data: employees, count }, { data: departments }] = await Promise.all([query, supabase.from("departments").select("id,name").eq("active", true).order("name")]);
  const pages = Math.ceil((count ?? 0) / size);

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-2xl font-bold">Employee directory</h2><p className="text-muted mt-1">{count ?? 0} people across your organization.</p></div><Button asChild><Link href="/employees/new"><UserPlus className="size-4"/>Add employee</Link></Button></div>
    <Card><CardContent className="pt-5"><form className="grid gap-3 md:grid-cols-[1fr_180px_160px_140px_auto]"><label className="relative"><span className="sr-only">Search employees</span><Search className="absolute left-3 top-3 size-4 text-muted"/><input name="q" defaultValue={params.q} placeholder="Name, ID, email or designation" className="h-10 w-full rounded-xl border bg-[var(--surface)] pl-9 pr-3 text-sm"/></label><select name="department" defaultValue={params.department ?? ""} className="h-10 rounded-xl border bg-[var(--surface)] px-3 text-sm"><option value="">All departments</option>{(departments ?? []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select><select name="status" defaultValue={params.status ?? ""} className="h-10 rounded-xl border bg-[var(--surface)] px-3 text-sm"><option value="">All statuses</option>{["active", "inactive", "probation", "resigned"].map(s => <option key={s}>{s}</option>)}</select><select name="sort" defaultValue={params.sort ?? "name"} className="h-10 rounded-xl border bg-[var(--surface)] px-3 text-sm"><option value="name">Sort by ID</option><option value="joining">Newest joining</option></select><Button type="submit" variant="secondary"><ArrowUpDown className="size-4"/>Apply</Button></form></CardContent></Card>
    <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[var(--surface-muted)] text-muted"><tr>{["Employee", "Department", "Designation", "Joined", "Status", "Actions"].map(h => <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">{h}</th>)}</tr></thead><tbody className="divide-y">{(employees ?? []).map(employee => { const person = Array.isArray(employee.profile) ? employee.profile[0] : employee.profile; const department = Array.isArray(employee.department) ? employee.department[0] : employee.department; return <tr key={employee.id} className="hover:bg-[var(--surface-muted)]"><td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar name={person?.full_name ?? "Employee"} src={person?.avatar_url} size="sm"/><div><p className="font-semibold">{person?.full_name}</p><p className="text-muted text-xs">{employee.employee_code} · {person?.email}</p></div></div></td><td className="px-5 py-4">{department?.name ?? "—"}</td><td className="px-5 py-4">{employee.designation}</td><td className="px-5 py-4">{format(new Date(`${employee.joining_date}T00:00:00`), "d MMM yyyy")}</td><td className="px-5 py-4"><Badge tone={statusTone[employee.employment_status as keyof typeof statusTone]}>{employee.employment_status}</Badge></td><td className="px-5 py-4"><div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link href={`/employees/${employee.id}`}>View</Link></Button><form action={setEmploymentStatus}><input type="hidden" name="employeeId" value={employee.id}/><input type="hidden" name="status" value={employee.employment_status === "inactive" ? "active" : "inactive"}/><Button size="sm" variant="ghost">{employee.employment_status === "inactive" ? "Activate" : "Deactivate"}</Button></form></div></td></tr>; })}</tbody></table></div>
      {!employees?.length && <div className="p-5"><EmptyState title="No employees found" description="Try broadening the search or filters."/></div>}
      <div className="flex items-center justify-between border-t px-5 py-3 text-sm"><p className="text-muted">Page {page} of {Math.max(pages, 1)}</p><div className="flex gap-2"><Button asChild variant="outline" size="sm" className={page <= 1 ? "pointer-events-none opacity-50" : ""}><Link href={{ query: { ...params, page: page - 1 } }}>Previous</Link></Button><Button asChild variant="outline" size="sm" className={page >= pages ? "pointer-events-none opacity-50" : ""}><Link href={{ query: { ...params, page: page + 1 } }}>Next</Link></Button></div></div>
    </Card>
  </div>;
}
