"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
const categories = new Set(["identity", "offer_letter", "contract", "certificate", "payslip", "other"]);

export async function uploadDocument(formData: FormData) {
  const actor = await requireProfile(["hr", "admin"]);
  const file = formData.get("file");
  const employeeId = String(formData.get("employeeId") ?? "");
  const category = String(formData.get("category") ?? "");
  const visibility = String(formData.get("visibility") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!(file instanceof File) || file.size === 0 || file.size > 10 * 1024 * 1024 || !allowedMimeTypes.has(file.type)) throw new Error("Choose a PDF, image, or DOCX file of 10 MB or less.");
  if (!/^[0-9a-f-]{36}$/i.test(employeeId) || !categories.has(category) || !["employee", "hr_only"].includes(visibility) || !displayName || displayName.length > 150 || description.length > 500) throw new Error("Check the document details and try again.");
  const supabase = await createClient();
  const path = `${employeeId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120)}`;
  const { error: uploadError } = await supabase.storage.from("employee-documents").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error("Document upload failed", { code: uploadError.name });
    throw new Error("The file could not be uploaded. Please try again.");
  }
  const { error } = await supabase.from("employee_documents").insert({
    employee_id: employeeId, category, display_name: displayName, file_path: path,
    file_size: file.size, mime_type: file.type, uploaded_by: actor.id, visibility,
    description: description || null,
  });
  if (error) {
    await supabase.storage.from("employee-documents").remove([path]);
    console.error("Document assignment failed", { code: error.code });
    throw new Error("The document could not be assigned. Please try again.");
  }
  revalidatePath("/documents");
  revalidatePath("/notifications");
}

export async function deleteDocument(formData: FormData) {
  await requireProfile(["hr", "admin"]);
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Document not found.");
  const supabase = await createClient();
  const { data: document, error: lookupError } = await supabase.from("employee_documents").select("file_path").eq("id", id).single();
  if (lookupError || !document) throw new Error("Document not found.");
  const { error } = await supabase.from("employee_documents").delete().eq("id", id);
  if (error) {
    console.error("Document revocation failed", { code: error.code });
    throw new Error("The document could not be revoked. Please try again.");
  }
  const { error: storageError } = await supabase.storage.from("employee-documents").remove([document.file_path]);
  if (storageError) console.error("Revoked document file cleanup failed", { code: storageError.name, documentId: id });
  revalidatePath("/documents");
}
