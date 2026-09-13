import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type OrganizationContext = { timezone: string; currency: string; name: string };

export const getOrganizationContext = cache(async (): Promise<OrganizationContext> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("organization_settings")
    .select("organization_name,timezone,currency").order("created_at").limit(1).maybeSingle();
  if (error) throw new Error("Unable to load organization settings");
  return {
    name: data?.organization_name ?? "Dayflow",
    timezone: data?.timezone ?? "UTC",
    currency: data?.currency ?? "INR",
  };
});

export { businessDate, monthBounds, formatBusinessTime } from "./organization-date";
