import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/auth-form";
export const metadata: Metadata = { title: "Employee registration" };
export default function RegisterPage() { return <><p className="mb-2 text-sm font-semibold text-[var(--primary)]">Employee access</p><h2 className="text-3xl font-bold tracking-tight">Create your Dayflow account</h2><p className="text-muted mb-8 mt-2">Join your organization workspace in a few steps.</p><RegisterForm /></>; }
