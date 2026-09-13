"use client";

import { useEffect, useState, useTransition } from "react";
import { Clock3, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { checkIn, checkOut } from "./actions";
import { businessDate, formatBusinessTime } from "@/lib/organization-date";

export function AttendanceCard({ record, serverNow, timezone }: { record: { check_in: string | null; check_out: string | null; total_minutes: number; status?: string; work_date?: string } | null; serverNow: number; timezone: string }) {
  const router = useRouter();
  const [now, setNow] = useState(serverNow); const [pending, startTransition] = useTransition();
  useEffect(() => { const offset = serverNow - Date.now(); const id = window.setInterval(() => setNow(Date.now() + offset), 1000); return () => window.clearInterval(id); }, [serverNow]);
  const active = Boolean(record?.check_in && !record.check_out); const complete = Boolean(record?.check_out);
  const elapsed = active && record?.check_in ? Math.max(0, Math.floor((now - new Date(record.check_in).getTime()) / 1000)) : (record?.total_minutes ?? 0) * 60;
  const display = `${String(Math.floor(elapsed / 3600)).padStart(2,"0")}:${String(Math.floor(elapsed % 3600 / 60)).padStart(2,"0")}:${String(elapsed % 60).padStart(2,"0")}`;
  const run = (action: () => Promise<{ error?: string; success?: string }>) => startTransition(async () => { try { const result = await action(); if (result.error) toast.error(result.error); else { toast.success(result.success); router.refresh(); } } catch { toast.error("Attendance could not be updated. Please try again."); } });
  const status = record?.status === "leave" ? "On leave" : active ? "Working" : complete ? "Completed" : record ? "Recorded" : "Not checked in";
  const priorShift = active && record?.work_date && record.work_date !== businessDate(new Date(serverNow), timezone);
  return <Card className="overflow-hidden border-0 bg-[#32142e] text-white"><CardHeader><div><CardTitle>{priorShift ? "Current shift" : "Today’s attendance"}</CardTitle><p className="mt-1 text-sm text-white/55">{priorShift ? `Started ${record.work_date}` : new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "long", month: "long", day: "numeric" }).format(new Date(serverNow))}</p></div><Badge tone={active ? "success" : complete ? "info" : "neutral"}>{status}</Badge></CardHeader><CardContent>
    <div className="my-5 flex items-end gap-3"><Clock3 className="mb-1 size-6 text-amber-300"/><span className="font-mono text-4xl font-semibold tracking-tight">{display}</span></div>
    <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/[.07] p-3"><p className="text-xs text-white/50">Check in</p><p className="mt-1 text-sm font-medium">{record?.check_in ? formatBusinessTime(record.check_in, timezone) : "—"}</p></div><div className="rounded-xl bg-white/[.07] p-3"><p className="text-xs text-white/50">Check out</p><p className="mt-1 text-sm font-medium">{record?.check_out ? formatBusinessTime(record.check_out, timezone) : "—"}</p></div></div>
    {!record && <Button onClick={() => run(checkIn)} disabled={pending} className="mt-4 w-full bg-white text-[#32142e] hover:bg-white/90"><LogIn className="size-4"/>Check in now</Button>}{active && <Button onClick={() => run(checkOut)} disabled={pending} className="mt-4 w-full bg-amber-400 text-[#32142e] hover:bg-amber-300"><LogOut className="size-4"/>Check out</Button>}{complete && <p className="mt-4 text-center text-xs text-white/50">Your workday has been recorded.</p>}
  </CardContent></Card>;
}
