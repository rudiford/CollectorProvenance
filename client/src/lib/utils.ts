import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  const d = typeof dateStr === "string" ? new Date(dateStr + "T00:00:00") : dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function formatYear(year: number): string {
  return year.toString();
}

export function carTitle(car: { year: number; make: string; model: string; variant?: string | null }): string {
  const parts = [car.year, car.make, car.model];
  if (car.variant) parts.push(car.variant);
  return parts.join(" ");
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    original: "Original",
    restored: "Restored",
    modified: "Modified",
    barn_find: "Barn Find",
    project: "Project",
  };
  return labels[status] || status;
}

export function logTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    maintenance: "Maintenance",
    restoration: "Restoration",
    observation: "Observation",
    event: "Event",
    acquisition: "Acquisition",
  };
  return labels[type] || type;
}

export function logTypeColor(type: string): string {
  const colors: Record<string, string> = {
    maintenance: "text-blue-400 bg-blue-400/10",
    restoration: "text-amber-400 bg-amber-400/10",
    observation: "text-zinc-400 bg-zinc-400/10",
    event: "text-purple-400 bg-purple-400/10",
    acquisition: "text-green-400 bg-green-400/10",
  };
  return colors[type] || "text-zinc-400 bg-zinc-400/10";
}

export function acquisitionLabel(type: string): string {
  const labels: Record<string, string> = {
    private_sale: "Private Sale",
    auction: "Auction",
    dealer: "Dealer",
    inherited: "Inherited",
    gift: "Gift",
    unknown: "Unknown",
  };
  return labels[type] || type;
}
