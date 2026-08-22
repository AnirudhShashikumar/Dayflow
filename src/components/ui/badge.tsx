import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const tones = { neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200", success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", warning: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300", danger: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300", info: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300", plum: "bg-fuchsia-50 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300" };
export function Badge({ className, tone = "neutral", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) { return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize", tones[tone], className)} {...props} />; }
