"use client";

import { BriefcaseBusiness, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LoginPortal } from "./portal";

const portals = [
  { value: "employee", label: "Employee Portal", Icon: UserRound },
  { value: "hr", label: "HR / Admin Portal", Icon: BriefcaseBusiness },
] as const;

export function PortalSelector({
  value,
  onChange,
  disabled = false,
}: {
  value: LoginPortal;
  onChange: (portal: LoginPortal) => void;
  disabled?: boolean;
}) {
  function selectByKeyboard(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % portals.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + portals.length) % portals.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = portals.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const portal = portals[nextIndex];
    onChange(portal.value);
    document.getElementById(`portal-${portal.value}`)?.focus();
  }

  return (
    <fieldset disabled={disabled} className="space-y-2.5">
      <legend className="text-sm font-semibold">Choose your workspace</legend>
      <div
        role="tablist"
        aria-label="Choose your workspace"
        className="grid grid-cols-2 gap-1.5 rounded-2xl border bg-[var(--surface-muted)] p-1.5"
      >
        {portals.map(({ value: portal, label, Icon }, index) => {
          const selected = portal === value;
          return (
            <button
              key={portal}
              id={`portal-${portal}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="login-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(portal)}
              onKeyDown={(event) => selectByKeyboard(event, index)}
              className={cn(
                "flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-center text-xs font-semibold transition-all motion-reduce:transition-none sm:text-sm",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50",
                selected
                  ? "border-[color-mix(in_srgb,var(--primary)_45%,var(--border))] bg-[var(--surface)] text-[var(--primary)] shadow-sm"
                  : "border-transparent text-muted hover:border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span>{label}</span>
              {selected && <span className="sr-only">Selected</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
