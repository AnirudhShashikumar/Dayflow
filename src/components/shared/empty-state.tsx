import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: { label: string; href: string } }) {
  return <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center">
    <span className="mb-4 grid size-11 place-items-center rounded-xl bg-[var(--surface-muted)]"><Inbox className="size-5 text-muted" /></span>
    <h3 className="font-semibold">{title}</h3><p className="text-muted mt-1 max-w-sm text-sm">{description}</p>
    {action && <Button asChild className="mt-4" size="sm"><a href={action.href}>{action.label}</a></Button>}
  </div>;
}
