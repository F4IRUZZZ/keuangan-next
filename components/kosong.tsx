import type { ReactNode } from "react";
import { cn } from "cn";

// Paragraf empty-state baku agar pesan "Belum ada..." konsisten di semua halaman.
export function Kosong({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
}

// Bilah persen ter-clamp 0..100 agar data korup tak membuat overflow.
export function BilahPersen({ persen, className }: { persen: number; className?: string }) {
  const aman = Number.isFinite(persen) ? Math.min(100, Math.max(0, Math.round(persen))) : 0;
  return (
    <span className={cn("h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted", className)} aria-hidden="true">
      <span className="block h-full rounded-full bg-emerald-600" style={{ width: `${aman}%` }} />
    </span>
  );
}
