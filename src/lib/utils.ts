import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency: string = "PEN"): string {
  const numeric = typeof amount === "string" ? parseFloat(amount) : amount;
  const val = typeof numeric === "number" && !isNaN(numeric) ? numeric : 0;
  const formatted = Math.abs(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return val < 0 ? `- S/ ${formatted}` : `S/ ${formatted}`;
}

export function formatDate(date: Date | string): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return typeof date === "string" ? date : "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
