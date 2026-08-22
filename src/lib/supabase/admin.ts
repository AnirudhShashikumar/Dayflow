import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";

export function createAdminClient() {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRole) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for this server-only operation.");
  const { url } = getPublicEnv();
  return createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
}
