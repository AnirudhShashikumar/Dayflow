import { BarChart3, CheckCircle2, Clock3, Users2 } from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { SetupNotice } from "@/components/shared/setup-notice";
import { FadeIn } from "@/components/shared/fade-in";
import { isSupabaseConfigured } from "@/lib/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) { return <main className="min-h-screen bg-[var(--surface)]">{!isSupabaseConfigured && <SetupNotice />}<div className="grid min-h-[calc(100vh-41px)] lg:grid-cols-[1.05fr_.95fr]">
  <section className="relative hidden overflow-hidden bg-[#32142e] p-12 text-white lg:flex lg:flex-col lg:justify-between">
    <div className="grid-dots absolute inset-0 opacity-20"/><div className="absolute -right-32 -top-32 size-96 rounded-full bg-fuchsia-500/10 blur-3xl"/><Brand className="relative [&_span]:text-white" />
    <div className="relative max-w-xl"><span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/75"><span className="size-1.5 rounded-full bg-amber-400"/>Human operations, in rhythm</span><h1 className="text-5xl font-semibold leading-[1.08] tracking-[-.04em]">Your people.<br/><span className="text-[#e7b5d8]">One clear flow.</span></h1><p className="mt-6 max-w-lg text-lg leading-8 text-white/65">Attendance, leave, payroll and people operations—perfectly aligned in one workspace.</p>
      <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">{[[Clock3,"Daily clarity"],[Users2,"People-first"],[BarChart3,"Useful insights"]].map(([Icon,label]) => { const C = Icon as typeof Clock3; return <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[.06] p-4"><C className="mb-5 size-5 text-amber-300"/><p className="text-sm font-medium">{String(label)}</p></div>})}</div>
    </div>
    <p className="relative flex items-center gap-2 text-xs text-white/45"><CheckCircle2 className="size-4 text-emerald-400"/> Secure by design with role-based access and audit history</p>
  </section><section className="flex items-center justify-center p-6 sm:p-10"><div className="w-full max-w-md"><Brand className="mb-10 lg:hidden" /><FadeIn>{children}</FadeIn></div></section>
  </div></main>; }
