import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/auth-form";
export const metadata: Metadata = { title: "Sign in" };
export default function LoginPage() { return <><p className="mb-2 text-sm font-semibold text-[var(--primary)]">Welcome back</p><h2 className="text-3xl font-bold tracking-tight">Sign in to your workspace</h2><p className="text-muted mb-8 mt-2">Continue to your perfectly aligned workday.</p><LoginForm /></>; }
