type SupabaseEnvironmentInput = {
  url?: string;
  publishableKey?: string;
  legacyAnonKey?: string;
};

type SupabaseEnvironmentStatus =
  | {
      configured: true;
      env: {
        url: string;
        publishableKey: string;
        keyVariable: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" | "NEXT_PUBLIC_SUPABASE_ANON_KEY";
      };
      issues: [];
    }
  | {
      configured: false;
      env: null;
      issues: string[];
    };

export function resolveSupabasePublicConfig(input: SupabaseEnvironmentInput): SupabaseEnvironmentStatus {
  const url = input.url?.trim();
  const currentKey = input.publishableKey?.trim();
  const legacyKey = input.legacyAnonKey?.trim();
  const issues: string[] = [];

  if (!url) {
    issues.push("NEXT_PUBLIC_SUPABASE_URL is missing.");
  } else {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
        issues.push("NEXT_PUBLIC_SUPABASE_URL must use http or https.");
      }
    } catch {
      issues.push("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
    }
  }

  if (!currentKey && !legacyKey) {
    issues.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing (legacy NEXT_PUBLIC_SUPABASE_ANON_KEY is also accepted).");
  }

  if (issues.length > 0 || !url || (!currentKey && !legacyKey)) {
    return { configured: false, env: null, issues };
  }

  return {
    configured: true,
    env: {
      url,
      publishableKey: currentKey ?? legacyKey!,
      keyVariable: currentKey ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" : "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    },
    issues: [],
  };
}

// These must remain direct property accesses. Next.js only inlines NEXT_PUBLIC_ variables
// into browser bundles when their names are statically referenced.
const supabaseEnvironment = resolveSupabasePublicConfig({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  legacyAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export const isSupabaseConfigured = supabaseEnvironment.configured;

export function getSupabaseEnvStatus() {
  return supabaseEnvironment;
}

export function logSupabaseConfigurationError(context: string) {
  if (supabaseEnvironment.configured) return;
  console.error(`[Supabase] ${context} initialization failed: ${supabaseEnvironment.issues.join(" ")}`);
}

export function getPublicEnv(context = "client") {
  if (!supabaseEnvironment.configured) {
    logSupabaseConfigurationError(context);
    throw new Error(`Supabase ${context} initialization failed: ${supabaseEnvironment.issues.join(" ")}`);
  }
  return supabaseEnvironment.env;
}
