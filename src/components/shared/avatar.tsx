import Image from "next/image";
import { initials } from "@/lib/utils";

export function Avatar({ name, src, size = "md" }: { name: string; src?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "size-8 text-[10px]", md: "size-10 text-xs", lg: "size-16 text-lg" };
  if (src) return <Image width={64} height={64} className={`${sizes[size]} rounded-full object-cover ring-2 ring-[var(--surface)]`} src={src} alt={`${name} avatar`} />;
  return <span className={`${sizes[size]} inline-grid shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,var(--surface))] font-bold text-[var(--primary)] ring-1 ring-[color-mix(in_srgb,var(--primary)_18%,transparent)]`}>{initials(name)}</span>;
}
