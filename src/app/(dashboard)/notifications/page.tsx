import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/shared/submit-button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { markAllNotifications, markNotification } from "./actions";
import { safeCallbackPath } from "@/lib/auth/callback-path";

const pageSize = 30;

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const profile = await requireProfile();
  const params = await searchParams;
  const requestedPage = Number(params.page);
  const page = Number.isSafeInteger(requestedPage) ? Math.min(100_000, Math.max(1, requestedPage)) : 1;
  const supabase = await createClient();
  const { data, count, error } = await supabase.from("notifications")
    .select("id,title,message,category,is_read,link,created_at", { count: "exact" })
    .eq("recipient_id", profile.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error("Unable to load notifications");
  const pages = Math.max(1, Math.ceil((count ?? 0) / pageSize));

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-2xl font-bold">Notification centre</h2><p className="text-muted mt-1">Updates that need your attention.</p></div>
      <form action={markAllNotifications}><SubmitButton variant="outline" pendingLabel="Updating…"><CheckCheck className="size-4"/>Mark all read</SubmitButton></form>
    </div>
    <Card><CardHeader><CardTitle>All notifications</CardTitle></CardHeader><CardContent className="space-y-2">
      {(data ?? []).map((notification) => <div key={notification.id} className={`flex flex-wrap gap-3 rounded-xl border p-4 ${notification.is_read ? "opacity-70" : "bg-[color-mix(in_srgb,var(--primary)_4%,var(--surface))]"}`}>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--surface-muted)]"><Bell className="size-4 text-[var(--primary)]"/></span>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{notification.title}</p><Badge tone="neutral">{notification.category}</Badge>{!notification.is_read && <span className="size-2 rounded-full bg-[var(--primary)]" aria-label="Unread"/>}</div><p className="text-muted mt-1 text-sm">{notification.message}</p><p className="text-muted mt-2 text-xs">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</p></div>
        <div className="flex gap-2 sm:flex-col">{notification.link && <Button asChild size="sm" variant="outline"><Link href={safeCallbackPath(notification.link)}>Open</Link></Button>}{!notification.is_read && <form action={markNotification}><input type="hidden" name="id" value={notification.id}/><SubmitButton size="sm" variant="ghost" pendingLabel="Updating…">Mark read</SubmitButton></form>}</div>
      </div>)}
      {!data?.length && <EmptyState title="You’re all caught up" description="New approvals, payroll updates and announcements will appear here."/>}
    </CardContent></Card>
    {pages > 1 && <nav aria-label="Notification pages" className="flex items-center justify-between text-sm"><span className="text-muted">Page {page} of {pages}</span><div className="flex gap-2">{page > 1 && <Button asChild variant="outline" size="sm"><Link href={`/notifications?page=${page - 1}`}>Previous</Link></Button>}{page < pages && <Button asChild variant="outline" size="sm"><Link href={`/notifications?page=${page + 1}`}>Next</Link></Button>}</div></nav>}
  </div>;
}
