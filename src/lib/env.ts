const requiredPublic = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;

export const isSupabaseConfigured = requiredPublic.every((key) => Boolean(process.env[key]));

export function getPublicEnv() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Copy .env.example to .env.local and add your project credentials.");
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  };
}
