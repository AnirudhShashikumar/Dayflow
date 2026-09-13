"use client";

import { useActionState } from "react";

type ActionState = { error?: string; success?: string };

export function ActionForm({ action, successMessage, children, className }: {
  action: (formData: FormData) => Promise<void>;
  successMessage: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(async (_: ActionState, formData: FormData): Promise<ActionState> => {
    try {
      await action(formData);
      return { success: successMessage };
    } catch {
      return { error: "This change could not be saved. Check the fields and try again." };
    }
  }, {});
  return <form action={formAction} className={className}>
    {children}
    {state.error && <p role="alert" className="col-span-full rounded-lg bg-rose-50 p-3 text-sm text-rose-900 dark:bg-rose-950 dark:text-rose-200">{state.error}</p>}
    {state.success && <p role="status" className="col-span-full rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">{state.success}</p>}
  </form>;
}
