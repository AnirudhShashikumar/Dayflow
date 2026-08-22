"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { signIn, register, requestPasswordReset, updatePassword, type ActionState } from "./actions";
import { PortalSelector } from "./portal-selector";
import type { LoginPortal } from "./portal";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/shared/submit-button";

const initial: ActionState = {};
function Feedback({ state }: { state: ActionState }) { if (!state.error && !state.success) return null; const ok = Boolean(state.success); return <div role={ok ? "status" : "alert"} aria-live={ok ? "polite" : "assertive"} className={`flex gap-2 rounded-xl p-3 text-sm ${ok ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200"}`}>{ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" />}{state.success ?? state.error}</div>; }
function Password({ name = "password", label = "Password", autoComplete = "current-password", disabled = false }: { name?: string; label?: string; autoComplete?: string; disabled?: boolean }) { const [show, setShow] = useState(false); return <div><Label htmlFor={name}>{label}</Label><div className="relative"><Input id={name} name={name} type={show ? "text" : "password"} autoComplete={autoComplete} required minLength={8} disabled={disabled} className="pr-11" /><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => setShow(!show)} disabled={disabled} aria-label={`${show ? "Hide" : "Show"} password`}>{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button></div></div>; }

const portalCopy = {
  employee: {
    heading: "Employee sign in",
    subtitle: "Access your attendance, leave, payroll and profile.",
    button: "Sign in to Employee Portal",
    pending: "Signing in to Employee Portal...",
    support: "For employees accessing their personal workspace.",
  },
  hr: {
    heading: "HR & Admin sign in",
    subtitle: "Manage employees, approvals, attendance and payroll.",
    button: "Sign in to HR Portal",
    pending: "Signing in to HR Portal...",
    support: "For HR officers and administrators only.",
  },
} as const;

export function LoginForm({ initialPortal = "employee" }: { initialPortal?: LoginPortal }) {
  const [portal, setPortal] = useState<LoginPortal>(initialPortal);
  const [state, action, pending] = useActionState(signIn, initial);
  const copy = portalCopy[portal];
  const visibleState = !state.portal || state.portal === portal ? state : initial;

  function changePortal(nextPortal: LoginPortal) {
    setPortal(nextPortal);
    const url = new URL(window.location.href);
    url.searchParams.set("portal", nextPortal);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  return <div>
    <p className="mb-2 text-sm font-semibold text-[var(--primary)]">Welcome back</p>
    <h2 className="text-3xl font-bold tracking-tight">{copy.heading}</h2>
    <p className="text-muted mb-7 mt-2">{copy.subtitle}</p>
    <form action={action} className="space-y-4" aria-busy={pending}>
      <input type="hidden" name="portal" value={portal} />
      <PortalSelector value={portal} onChange={changePortal} disabled={pending} />
      <div id="login-panel" role="tabpanel" aria-labelledby={`portal-${portal}`} className="space-y-4" tabIndex={0}>
        <Feedback state={visibleState} />
        <div><Label htmlFor="email">Work email</Label><Input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required disabled={pending} /></div>
        <Password disabled={pending} />
        <div className="flex items-center justify-between gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-[var(--primary)]" disabled={pending} />Remember me</label><Link className="font-medium text-[var(--primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2" href="/forgot-password">Forgot password?</Link></div>
        <SubmitButton className="w-full" size="lg" pendingLabel={copy.pending}>{copy.button}</SubmitButton>
        <p className="text-muted text-center text-xs">{copy.support}</p>
        <p className="text-muted text-center text-sm">New employee? <Link href="/register" className="font-semibold text-[var(--primary)] hover:underline">Create an account</Link></p>
      </div>
    </form>
  </div>;
}

export function RegisterForm() { const [state, action] = useActionState(register, initial); return <form action={action} className="space-y-4"><Feedback state={state} />
  <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="employeeCode">Employee ID</Label><Input id="employeeCode" name="employeeCode" placeholder="DF-011" required /></div><div><Label htmlFor="fullName">Full name</Label><Input id="fullName" name="fullName" autoComplete="name" required /></div></div>
  <div><Label htmlFor="email">Work email</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div><Password autoComplete="new-password" /><Password name="confirmPassword" label="Confirm password" autoComplete="new-password" />
  <p className="text-muted text-xs">Use 8+ characters with an uppercase letter and a number. Public registrations always receive the Employee role.</p><SubmitButton className="w-full" size="lg">Create employee account</SubmitButton><p className="text-muted text-center text-sm">Already registered? <Link href="/login" className="font-semibold text-[var(--primary)]">Sign in</Link></p></form>; }

export function ForgotForm() { const [state, action] = useActionState(requestPasswordReset, initial); return <form action={action} className="space-y-4"><Feedback state={state} /><div><Label htmlFor="email">Work email</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div><SubmitButton className="w-full" size="lg">Send reset link</SubmitButton><Button asChild variant="ghost" className="w-full"><Link href="/login">Back to sign in</Link></Button></form>; }

export function ResetForm() { const [state, action] = useActionState(updatePassword, initial); return <form action={action} className="space-y-4"><Feedback state={state} /><Password autoComplete="new-password" /><SubmitButton className="w-full" size="lg">Update password</SubmitButton></form>; }
