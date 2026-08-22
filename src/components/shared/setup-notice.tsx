import { Database, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SetupNotice() { return <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
  <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-xs"><Database className="size-4" /><span>Supabase setup is required to sign in and load persistent HR data.</span><Button asChild variant="ghost" size="sm" className="h-7 text-amber-950 dark:text-amber-100"><a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Configure <ArrowRight className="size-3" /></a></Button></div>
  </div>; }
