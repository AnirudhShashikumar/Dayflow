import { ForgotForm } from "@/features/auth/auth-form";
export default function ForgotPage() { return <><p className="mb-2 text-sm font-semibold text-[var(--primary)]">Account recovery</p><h2 className="text-3xl font-bold tracking-tight">Reset your password</h2><p className="text-muted mb-8 mt-2">We’ll send a secure reset link to your work email.</p><ForgotForm /></>; }
