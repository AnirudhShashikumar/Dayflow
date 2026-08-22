"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Bell, Building2, CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, Command, FileBarChart, FileText, LayoutDashboard, LogOut, Megaphone, Menu, Search, Settings, UserRound, Users, X } from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { Avatar } from "@/components/shared/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./theme-toggle";
import { signOut } from "@/features/auth/actions";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/domain";

const employeeNav = [
  ["Overview", "/overview", LayoutDashboard], ["My Profile", "/profile", UserRound], ["Attendance", "/attendance", CalendarDays], ["Leave", "/leave", FileText], ["Payroll", "/payroll", CircleDollarSign], ["Documents", "/documents", FileText], ["Notifications", "/notifications", Bell], ["Settings", "/settings", Settings],
] as const;
const managementNav = [
  ["Overview", "/hr", LayoutDashboard], ["Employees", "/employees", Users], ["Attendance", "/attendance", CalendarDays], ["Leave Requests", "/leave", FileText], ["Payroll", "/payroll", CircleDollarSign], ["Reports", "/reports", FileBarChart], ["Announcements", "/announcements", Megaphone], ["Activity Log", "/activity", Activity], ["Departments", "/departments", Building2], ["Settings", "/settings", Settings],
] as const;

const pageNames: Record<string, string> = { overview: "Overview", hr: "HR Overview", admin: "Admin Overview", profile: "My Profile", attendance: "Attendance", leave: "Leave & Time Off", payroll: "Payroll", documents: "Documents", notifications: "Notifications", settings: "Settings", employees: "Employees", reports: "Reports & Analytics", announcements: "Announcements", activity: "Activity Log", departments: "Departments" };

export function AppShell({ profile, unreadCount, children }: { profile: Profile; unreadCount: number; children: React.ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const [mobile, setMobile] = useState(false); const [collapsed, setCollapsed] = useState(false); const [commandOpen, setCommandOpen] = useState(false); const [search, setSearch] = useState("");
  const nav = profile.role === "employee" ? employeeNav : managementNav; const segment = pathname.split("/")[1] || "overview"; const title = pageNames[segment] ?? "Dayflow";
  useEffect(() => { const handler = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key === "k") { event.preventDefault(); setCommandOpen((v) => !v); } }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, []);
  const navigateSearch = (event: React.FormEvent) => { event.preventDefault(); if (!search.trim()) return; setCommandOpen(false); router.push(profile.role === "employee" ? `/notifications?q=${encodeURIComponent(search)}` : `/employees?q=${encodeURIComponent(search)}`); };
  return <div className="min-h-screen bg-[var(--background)]">
    {mobile && <button className="fixed inset-0 z-40 bg-black/35 lg:hidden" onClick={() => setMobile(false)} aria-label="Close navigation" />}
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-[var(--surface)] transition-[width,transform] duration-200 lg:translate-x-0", collapsed ? "lg:w-[76px]" : "lg:w-64", mobile ? "w-72 translate-x-0" : "w-72 -translate-x-full")}>
      <div className="flex h-18 items-center justify-between px-5"><Brand compact={collapsed && !mobile}/><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobile(false)}><X className="size-5"/></Button></div>
      <div className="mx-3 mt-2 flex items-center gap-3 rounded-xl border bg-[var(--surface-muted)] p-2.5"><Avatar name={profile.full_name} src={profile.avatar_url} size="sm"/>{(!collapsed || mobile) && <div className="min-w-0"><p className="truncate text-sm font-semibold">{profile.full_name}</p><Badge tone={profile.role === "employee" ? "neutral" : "plum"} className="mt-0.5 px-1.5 py-0 text-[9px]">{profile.role}</Badge></div>}</div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Main navigation">{nav.map(([label, href, Icon]) => { const active = pathname === href || (href !== "/hr" && pathname.startsWith(`${href}/`)); return <Link key={href} href={href} onClick={() => setMobile(false)} title={collapsed ? label : undefined} className={cn("flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition", active ? "bg-[color-mix(in_srgb,var(--primary)_11%,transparent)] text-[var(--primary)]" : "text-muted hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]")}><Icon className="size-[18px] shrink-0"/>{(!collapsed || mobile) && <span>{label}</span>}{label === "Notifications" && unreadCount > 0 && (!collapsed || mobile) && <span className="ml-auto grid size-5 place-items-center rounded-full bg-rose-500 text-[10px] text-white">{Math.min(unreadCount, 9)}</span>}</Link>})}</nav>
      <form action={signOut} className="border-t p-3"><Button variant="ghost" className={cn("w-full", collapsed && !mobile ? "px-0" : "justify-start")} title="Sign out"><LogOut className="size-[18px]"/>{(!collapsed || mobile) && "Sign out"}</Button></form>
      <Button variant="outline" size="icon" onClick={() => setCollapsed(!collapsed)} className="absolute -right-4 top-24 hidden size-8 rounded-full bg-[var(--surface)] lg:inline-flex" aria-label="Collapse sidebar">{collapsed ? <ChevronRight className="size-4"/> : <ChevronLeft className="size-4"/>}</Button>
    </aside>
    <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
      <header className="sticky top-0 z-30 flex h-18 items-center gap-3 border-b bg-[color-mix(in_srgb,var(--background)_92%,transparent)] px-4 backdrop-blur-xl sm:px-6"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobile(true)}><Menu className="size-5"/></Button><div className="min-w-0 flex-1"><p className="text-muted hidden text-xs sm:block">Dayflow / {title}</p><h1 className="truncate text-lg font-bold tracking-tight">{title}</h1></div>
        <button onClick={() => setCommandOpen(true)} className="text-muted hidden h-10 w-56 items-center gap-2 rounded-xl border bg-[var(--surface)] px-3 text-sm md:flex"><Search className="size-4"/><span>Search Dayflow</span><kbd className="ml-auto rounded border px-1.5 py-0.5 text-[10px]">⌘K</kbd></button><ThemeToggle/><Button asChild variant="ghost" size="icon" className="relative"><Link href="/notifications" aria-label={`${unreadCount} unread notifications`}><Bell className="size-5"/>{unreadCount > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500 ring-2 ring-[var(--surface)]"/>}</Link></Button><Avatar name={profile.full_name} src={profile.avatar_url} size="sm"/>
      </header><main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
    {commandOpen && <div className="fixed inset-0 z-[70] grid place-items-start bg-black/35 px-4 pt-[15vh]" onMouseDown={(event) => { if (event.currentTarget === event.target) setCommandOpen(false); }}><div role="dialog" aria-modal="true" aria-label="Global search" className="surface w-full max-w-xl rounded-2xl border p-3 shadow-2xl"><form onSubmit={navigateSearch} className="flex items-center gap-2"><Command className="ml-2 size-5 text-muted"/><Input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder={profile.role === "employee" ? "Search your notifications…" : "Search people by name, ID or email…"} className="border-0 shadow-none"/><Button type="submit" size="sm">Search</Button></form><p className="text-muted px-3 pb-1 pt-2 text-xs">Press Esc or click outside to close</p></div></div>}
  </div>;
}
