"use client";

import { useActionState } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/shared/submit-button";
import { updateOwnProfile, type ProfileActionState } from "./actions";

export function ProfileForm({ initial }: { initial: { phone: string | null; address: string | null; emergency_contact_name: string | null; emergency_contact_phone: string | null } }) {
  const [state, action] = useActionState(updateOwnProfile, {} as ProfileActionState);
  return <form action={action} className="grid gap-4 sm:grid-cols-2">
    <div><Label htmlFor="profile-phone">Phone</Label><Input id="profile-phone" name="phone" type="tel" maxLength={30} defaultValue={initial.phone ?? ""} autoComplete="tel" /></div>
    <div><Label htmlFor="profile-emergency-name">Emergency contact</Label><Input id="profile-emergency-name" name="emergencyName" maxLength={100} defaultValue={initial.emergency_contact_name ?? ""} /></div>
    <div><Label htmlFor="profile-emergency-phone">Emergency phone</Label><Input id="profile-emergency-phone" name="emergencyPhone" type="tel" maxLength={30} defaultValue={initial.emergency_contact_phone ?? ""} /></div>
    <div className="sm:col-span-2"><Label htmlFor="profile-address">Address</Label><Textarea id="profile-address" name="address" maxLength={500} defaultValue={initial.address ?? ""} autoComplete="street-address" /></div>
    {(state.error || state.success) && <p role="status" aria-live="polite" className={`sm:col-span-2 rounded-lg p-3 text-sm ${state.error ? "bg-rose-50 text-rose-900" : "bg-emerald-50 text-emerald-900"}`}>{state.error ?? state.success}</p>}
    <SubmitButton className="sm:col-span-2" pendingLabel="Saving…">Save personal details</SubmitButton>
  </form>;
}
