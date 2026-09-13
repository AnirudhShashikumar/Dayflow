import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (value: number, currency = "INR") =>
  new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", { style: "currency", currency }).format(value);

export const formatMinutes = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

export const initials = (name: string) => name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
