import { format } from "date-fns";
import Link from "next/link";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { requireProfile, getViewerContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { SubmitButton } from "@/components/shared/submit-button";
import { ActionForm } from "@/components/shared/action-form";
import { deleteDocument, uploadDocument } from "./actions";

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const profile = await requireProfile();
  const { page: pageParam } = await searchParams;
  const requestedPage = Number(pageParam);
  const page = Number.isSafeInteger(requestedPage) ? Math.min(100_000, Math.max(1, requestedPage)) : 1;
  const supabase = await createClient();
  const management = profile.role !== "employee";
  let query = supabase.from("employee_documents")
    .select("id,employee_id,category,display_name,file_size,mime_type,visibility,description,created_at,employee:employee_profiles(employee_code,profile:profiles(full_name))", { count: "exact" })
    .order("created_at", { ascending: false }).range((page - 1) * 30, page * 30 - 1);
  if (!management) {
    const employee = (await getViewerContext())?.employee;
    if (!employee) throw new Error("Unable to load employee identity");
    query = query.eq("employee_id", employee.id).eq("visibility", "employee");
  }
  const [documentsResult, employeesResult] = await Promise.all([
    query,
    management ? supabase.from("employee_profiles").select("id,employee_code,profile:profiles(full_name)").order("employee_code") : Promise.resolve({ data: [], error: null }),
  ]);
  if (documentsResult.error || employeesResult.error) throw new Error("Unable to load documents");
  const documents = documentsResult.data ?? [];
  const employees = employeesResult.data ?? [];
  const totalPages = Math.ceil((documentsResult.count ?? 0) / 30);
  return <div className="space-y-6">
    <div><h2 className="text-2xl font-bold">Employee documents</h2><p className="text-muted mt-1">Private files are available through short-lived download links.</p></div>
    {management && <Card><CardHeader><CardTitle>Upload document</CardTitle></CardHeader><CardContent><ActionForm action={uploadDocument} successMessage="Document shared securely." className="grid gap-3 md:grid-cols-3">
      <div><Label htmlFor="document-employee">Employee</Label><select id="document-employee" name="employeeId" required className="h-11 w-full rounded-xl border bg-[var(--surface)] px-3"><option value="">Choose employee</option>{employees.map((employee) => { const person = Array.isArray(employee.profile) ? employee.profile[0] : employee.profile; return <option key={employee.id} value={employee.id}>{employee.employee_code} · {person?.full_name}</option>; })}</select></div>
      <div><Label htmlFor="document-name">Display name</Label><Input id="document-name" name="displayName" maxLength={150} required /></div>
      <div><Label htmlFor="document-category">Category</Label><select id="document-category" name="category" className="h-11 w-full rounded-xl border bg-[var(--surface)] px-3">{["identity", "offer_letter", "contract", "certificate", "payslip", "other"].map((category) => <option key={category} value={category}>{category.replace("_", " ")}</option>)}</select></div>
      <div><Label htmlFor="document-visibility">Visibility</Label><select id="document-visibility" name="visibility" className="h-11 w-full rounded-xl border bg-[var(--surface)] px-3"><option value="employee">Employee can view</option><option value="hr_only">HR only</option></select></div>
      <div><Label htmlFor="document-file">File</Label><Input id="document-file" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,.docx" required /></div>
      <div><Label htmlFor="document-description">Description</Label><Input id="document-description" name="description" maxLength={500} /></div>
      <SubmitButton className="md:col-span-3" pendingLabel="Uploading…"><Upload className="size-4"/>Upload securely</SubmitButton>
    </ActionForm></CardContent></Card>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{documents.map((document) => { const employee = Array.isArray(document.employee) ? document.employee[0] : document.employee; const person = employee ? (Array.isArray(employee.profile) ? employee.profile[0] : employee.profile) : null; return <Card key={document.id}><CardContent className="pt-5"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-muted)]"><FileText className="size-5 text-[var(--primary)]"/></span><div className="min-w-0 flex-1"><p className="truncate font-semibold">{document.display_name}</p><p className="text-muted mt-1 text-xs">{person?.full_name ?? "Your document"} · {(document.file_size / 1024).toFixed(0)} KB</p></div><Badge>{document.category.replace("_", " ")}</Badge></div><p className="text-muted mt-4 text-xs">Uploaded {format(new Date(document.created_at), "d MMM yyyy")}</p><div className="mt-4 flex gap-2"><Button asChild variant="outline" size="sm" className="flex-1"><a href={`/api/documents/${document.id}/download`}><Download className="size-3"/>Download</a></Button>{management && <ActionForm action={deleteDocument} successMessage="Document revoked."><input type="hidden" name="id" value={document.id}/><SubmitButton variant="destructive" size="icon" className="size-8" aria-label={`Delete ${document.display_name}`}><Trash2 className="size-3"/></SubmitButton></ActionForm>}</div></CardContent></Card>; })}</div>
    {!documents.length && <EmptyState title="No documents shared" description={management ? "Upload an employee document to begin." : "Documents assigned by HR will appear here securely."} />}
    {totalPages > 1 && <nav aria-label="Document pages" className="flex items-center justify-between text-sm"><span className="text-muted">Page {page} of {totalPages}</span><div className="flex gap-2">{page > 1 && <Button asChild variant="outline" size="sm"><Link href={`/documents?page=${page - 1}`}>Previous</Link></Button>}{page < totalPages && <Button asChild variant="outline" size="sm"><Link href={`/documents?page=${page + 1}`}>Next</Link></Button>}</div></nav>}
  </div>;
}
