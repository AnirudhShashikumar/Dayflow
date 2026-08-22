import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";

export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secretKey) {
    console.error("[Supabase] Admin client initialization failed: SUPABASE_SECRET_KEY is missing (legacy SUPABASE_SERVICE_ROLE_KEY is also accepted).");
    throw new Error("A Supabase server secret key is required for this server-only operation.");
  }
  const { url } = getPublicEnv("admin client");
  return createClient(url, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
