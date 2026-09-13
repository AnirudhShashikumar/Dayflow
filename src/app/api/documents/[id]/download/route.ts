import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireProfile();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Document not found", { status: 404 });
  const supabase = await createClient();
  const { data: document, error } = await supabase.from("employee_documents")
    .select("file_path").eq("id", id).maybeSingle();
  if (error) {
    console.error("Document lookup failed", { code: error.code });
    return new Response("Unable to open document", { status: 500 });
  }
  if (!document) return new Response("Document not found", { status: 404 });
  const { data, error: signError } = await supabase.storage.from("employee-documents")
    .createSignedUrl(document.file_path, 60, { download: true });
  if (signError || !data?.signedUrl) {
    console.error("Document signing failed", { code: signError?.name });
    return new Response("Unable to open document", { status: 500 });
  }
  return NextResponse.redirect(data.signedUrl, { headers: { "Cache-Control": "no-store" } });
}
