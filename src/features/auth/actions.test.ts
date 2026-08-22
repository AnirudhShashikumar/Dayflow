import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/env", () => ({
  getPublicEnv: () => ({ url: "https://example.supabase.co", publishableKey: "test-key" }),
  isSupabaseConfigured: true,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { register, requestPasswordReset, signIn, updatePassword } from "./actions";
import type { UserRole } from "@/types/domain";

function loginForm(portal?: "employee" | "hr") {
  const form = new FormData();
  form.set("email", "person@dayflow.test");
  form.set("password", "Password1");
  if (portal) form.set("portal", portal);
  return form;
}

function setupClient({
  role = "employee",
  accountStatus = "active",
  profile = true,
  profileError = null,
  authError = null,
}: {
  role?: UserRole | "unknown";
  accountStatus?: "active" | "inactive";
  profile?: boolean;
  profileError?: { message: string } | null;
  authError?: { message: string } | null;
} = {}) {
  const signOut = vi.fn().mockResolvedValue({ error: null });
  const signUp = vi.fn().mockResolvedValue({ error: null });
  const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
  const updateUser = vi.fn().mockResolvedValue({ error: null });
  const maybeSingle = vi.fn().mockResolvedValue({
    data: profile ? { role, account_status: accountStatus } : null,
    error: profileError,
  });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const signInWithPassword = vi.fn().mockResolvedValue({
    data: { user: authError ? null : { id: "user-1" } },
    error: authError,
  });
  const client = {
    auth: { signInWithPassword, signOut, signUp, resetPasswordForEmail, updateUser },
    from: vi.fn(() => ({ select })),
  };
  mocks.createClient.mockResolvedValue(client);
  return { client, maybeSingle, signInWithPassword, signOut, signUp, resetPasswordForEmail, updateUser };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("dual-portal sign in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation(() => undefined as never);
  });

  it.each([
    ["employee", "employee", "/overview"],
    ["hr", "hr", "/hr"],
    ["admin", "hr", "/admin"],
    ["hr", "employee", "/hr"],
    ["admin", "employee", "/admin"],
  ] as const)("redirects an authenticated %s using the %s portal to %s", async (role, portal, destination) => {
    const { signOut } = setupClient({ role });

    await signIn({}, loginForm(portal));

    expect(mocks.redirect).toHaveBeenCalledWith(destination);
    expect(signOut).not.toHaveBeenCalled();
  });

  it("defaults to the Employee Portal when no preference is supplied", async () => {
    setupClient({ role: "employee" });

    await signIn({}, loginForm());

    expect(mocks.redirect).toHaveBeenCalledWith("/overview");
  });

  it("rejects an employee from the HR portal and cleans up the session", async () => {
    const { signOut } = setupClient({ role: "employee" });

    const state = await signIn({}, loginForm("hr"));

    expect(state).toEqual({
      error: "This account does not have access to the HR portal.",
      portal: "hr",
    });
    expect(signOut).toHaveBeenCalledOnce();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("returns a safe credentials error without attempting role resolution", async () => {
    const { client, signOut } = setupClient({ authError: { message: "Invalid login credentials" } });

    const state = await signIn({}, loginForm("employee"));

    expect(state).toEqual({ error: "Invalid email or password.", portal: "employee" });
    expect(client.from).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("returns a safe access error and signs out when the profile is missing", async () => {
    const { signOut } = setupClient({ profile: false });

    const state = await signIn({}, loginForm("employee"));

    expect(state).toEqual({
      error: "We could not determine your account access. Please contact your administrator.",
      portal: "employee",
    });
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("returns a safe access error and signs out when the profile role is invalid", async () => {
    const { signOut } = setupClient({ role: "unknown" });

    const state = await signIn({}, loginForm("employee"));

    expect(state.error).toBe("We could not determine your account access. Please contact your administrator.");
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("uses the existing inactive-account response and cleans up the session", async () => {
    const { signOut } = setupClient({ accountStatus: "inactive" });

    const state = await signIn({}, loginForm("employee"));

    expect(state).toEqual({ error: "This account is not active. Contact HR.", portal: "employee" });
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("does not expose profile lookup errors", async () => {
    const { signOut } = setupClient({ profileError: { message: "permission denied for profiles" } });

    const state = await signIn({}, loginForm("employee"));

    expect(state).toEqual({ error: "Unable to sign in right now. Please try again.", portal: "employee" });
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("does not expose network or Supabase exceptions", async () => {
    mocks.createClient.mockRejectedValue(new Error("network details"));

    const state = await signIn({}, loginForm("employee"));

    expect(state).toEqual({ error: "Unable to sign in right now. Please try again.", portal: "employee" });
  });
});

describe("public registration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("always provisions an Employee account regardless of portal-like form data", async () => {
    const { signUp } = setupClient();
    const form = new FormData();
    form.set("employeeCode", "DF-011");
    form.set("fullName", "Demo Employee");
    form.set("email", "employee@dayflow.test");
    form.set("password", "Password1");
    form.set("confirmPassword", "Password1");
    form.set("portal", "hr");

    await register({}, form);

    expect(signUp).toHaveBeenCalledWith(expect.objectContaining({
      options: { data: expect.objectContaining({ role: "employee" }) },
    }));
  });
});

describe("password recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation(() => undefined as never);
  });

  it("requests a reset through Supabase using the configured callback", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://dayflow.test");
    const { resetPasswordForEmail } = setupClient();
    const form = new FormData();
    form.set("email", "employee@dayflow.test");

    const result = await requestPasswordReset({}, form);

    expect(result).toEqual({ success: "If an account exists, a reset link has been sent." });
    expect(resetPasswordForEmail).toHaveBeenCalledWith("employee@dayflow.test", {
      redirectTo: "https://dayflow.test/auth/callback?next=/reset-password",
    });
  });

  it("updates the authenticated user's password through Supabase", async () => {
    const { updateUser } = setupClient();
    const form = new FormData();
    form.set("password", "NewPassword1");

    await updatePassword({}, form);

    expect(updateUser).toHaveBeenCalledWith({ password: "NewPassword1" });
    expect(mocks.redirect).toHaveBeenCalledWith("/overview?password=updated");
  });
});
