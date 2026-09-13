"use client";

import { useActionState } from "react";
import { Check, X } from "lucide-react";
import { SubmitButton } from "@/components/shared/submit-button";
import { cancelLeave, reviewLeave, type LeaveActionState } from "./actions";

export function LeaveReviewForm({ requestId }: { requestId: string }) {
  const [state, action] = useActionState(reviewLeave, {} as LeaveActionState);
  return <form action={action} className="mt-4 space-y-3">
    <input type="hidden" name="requestId" value={requestId} />
    <label className="sr-only" htmlFor={`comment-${requestId}`}>Approval comment</label>
    <textarea id={`comment-${requestId}`} name="comment" required minLength={2} maxLength={500}
      className="min-h-16 w-full rounded-xl border bg-[var(--surface)] p-3 text-sm"
      placeholder="Add a review comment…" />
    {state.error && <p role="alert" className="text-sm text-rose-700">{state.error}</p>}
    {state.success && <p role="status" className="text-sm text-emerald-700">{state.success}</p>}
    <div className="grid grid-cols-2 gap-2">
      <SubmitButton name="decision" value="rejected" variant="destructive" pendingLabel="Saving…"><X className="size-4"/>Reject</SubmitButton>
      <SubmitButton name="decision" value="approved" pendingLabel="Saving…"><Check className="size-4"/>Approve</SubmitButton>
    </div>
  </form>;
}

export function LeaveCancelForm({ requestId }: { requestId: string }) {
  const [state, action] = useActionState(cancelLeave, {} as LeaveActionState);
  return <form action={action} className="text-right">
    <input type="hidden" name="requestId" value={requestId} />
    <SubmitButton variant="outline" size="sm" pendingLabel="Cancelling…">Cancel request</SubmitButton>
    {state.error && <p role="alert" className="mt-1 text-xs text-rose-700">{state.error}</p>}
    {state.success && <p role="status" className="mt-1 text-xs text-emerald-700">{state.success}</p>}
  </form>;
}
