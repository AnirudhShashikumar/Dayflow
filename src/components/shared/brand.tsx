import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return <Link href="/" className={cn("inline-flex items-center gap-3", className)} aria-label="Dayflow home">
    <span className="relative grid size-9 rotate-[-8deg] place-items-center rounded-xl bg-[var(--primary)] shadow-lg shadow-fuchsia-950/15">
      <span className="h-4 w-2 rounded-full border-2 border-[var(--primary-foreground)]" />
      <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[var(--accent)]" />
    </span>
    {!compact && <span><span className="block text-lg font-bold leading-none tracking-tight">Dayflow</span><span className="text-muted mt-1 block text-[10px] leading-none">Every workday, perfectly aligned.</span></span>}
  </Link>;
}
