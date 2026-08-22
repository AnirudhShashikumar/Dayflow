import { describe, expect, it } from "vitest";
import { resolveSupabasePublicConfig } from "./env";

describe("Supabase environment resolution", () => {
  it("accepts the current Supabase publishable-key variables used by Vercel", () => {
    const status = resolveSupabasePublicConfig({
      url: "https://project.supabase.co",
      publishableKey: "sb_publishable_test",
    });

    expect(status.configured).toBe(true);
    if (status.configured) {
      expect(status.env.publishableKey).toBe("sb_publishable_test");
      expect(status.env.keyVariable).toBe("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    }
  });

  it("retains compatibility with legacy anon-key environments", () => {
    const status = resolveSupabasePublicConfig({
      url: "http://127.0.0.1:54321",
      legacyAnonKey: "legacy-anon-key",
    });

    expect(status.configured).toBe(true);
    if (status.configured) expect(status.env.keyVariable).toBe("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });

  it("prefers the current publishable key when both names exist", () => {
    const status = resolveSupabasePublicConfig({
      url: "https://project.supabase.co",
      publishableKey: "current-key",
      legacyAnonKey: "legacy-key",
    });

    expect(status.configured).toBe(true);
    if (status.configured) expect(status.env.publishableKey).toBe("current-key");
  });

  it("reports every missing variable without exposing values", () => {
    const status = resolveSupabasePublicConfig({});

    expect(status).toEqual({
      configured: false,
      env: null,
      issues: [
        "NEXT_PUBLIC_SUPABASE_URL is missing.",
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing (legacy NEXT_PUBLIC_SUPABASE_ANON_KEY is also accepted).",
      ],
    });
  });

  it("reports an invalid project URL", () => {
    const status = resolveSupabasePublicConfig({ url: "not-a-url", publishableKey: "test-key" });

    expect(status.configured).toBe(false);
    if (!status.configured) expect(status.issues).toContain("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
  });
});
