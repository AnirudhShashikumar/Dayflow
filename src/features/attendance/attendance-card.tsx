"use client";

import { useEffect, useState, useTransition } from "react";
import { Clock3, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { checkIn, checkOut } from "./actions";

export function AttendanceCard({ record, serverNow }: { record: { check_in: string | null; check_out: string | null; total_minutes: number } | null; serverNow: number }) {
  const [now, setNow] = useState(serverNow); const [pending, startTransition] = useTransition();
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);
  const active = Boolean(record?.check_in && !record.check_out); const complete = Boolean(record?.check_out);
  const elapsed = active && record?.check_in ? Math.max(0, Math.floor((now - new Date(record.check_in).getTime()) / 1000)) : (record?.total_minutes ?? 0) * 60;
  const display = `${String(Math.floor(elapsed / 3600)).padStart(2,"0")}:${String(Math.floor(elapsed % 3600 / 60)).padStart(2,"0")}:${String(elapsed % 60).padStart(2,"0")}`;
  const run = (action: () => Promise<{ error?: string; success?: string }>) => startTransition(async () => { const result = await action(); if (result.error) toast.error(result.error); else toast.success(result.success); });
  return <Card className="overflow-hidden border-0 bg-[#32142e] text-white"><CardHeader><div><CardTitle>Today’s attendance</CardTitle><p className="mt-1 text-sm text-white/55">{format(new Date(), "EEEE, d MMMM")}</p></div><Badge tone={active ? "success" : complete ? "info" : "neutral"}>{active ? "Working" : complete ? "Completed" : "Not checked in"}</Badge></CardHeader><CardContent>
    <div className="my-5 flex items-end gap-3"><Clock3 className="mb-1 size-6 text-amber-300"/><span className="font-mono text-4xl font-semibold tracking-tight">{display}</span></div>
    <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/[.07] p-3"><p className="text-xs text-white/50">Check in</p><p className="mt-1 text-sm font-medium">{record?.check_in ? format(new Date(record.check_in), "hh:mm a") : "—"}</p></div><div className="rounded-xl bg-white/[.07] p-3"><p className="text-xs text-white/50">Check out</p><p className="mt-1 text-sm font-medium">{record?.check_out ? format(new Date(record.check_out), "hh:mm a") : "—"}</p></div></div>
    {!record && <Button onClick={() => run(checkIn)} disabled={pending} className="mt-4 w-full bg-white text-[#32142e] hover:bg-white/90"><LogIn className="size-4"/>Check in now</Button>}{active && <Button onClick={() => run(checkOut)} disabled={pending} className="mt-4 w-full bg-amber-400 text-[#32142e] hover:bg-amber-300"><LogOut className="size-4"/>Check out</Button>}{complete && <p className="mt-4 text-center text-xs text-white/50">Your workday has been recorded.</p>}
  </CardContent></Card>;
}
