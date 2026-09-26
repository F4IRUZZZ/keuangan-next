"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  HandCoins,
  History,
  LayoutDashboard,
  Package,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", ikon: LayoutDashboard },
  { href: "/transaksi", label: "Transaksi", ikon: ArrowLeftRight },
  { href: "/riwayat", label: "Riwayat", ikon: History },
  { href: "/produk", label: "Produk", ikon: Package },
  { href: "/hutang", label: "Hutang", ikon: HandCoins },
  { href: "/pengaturan", label: "Pengaturan", ikon: Settings },
];

export function Nav() {
  const path = usePathname();
  return (
    <>
      {/* Laptop: bar atas (tak berubah) */}
      <nav aria-label="Navigasi utama" className="sticky top-0 z-40 hidden border-b bg-background/90 backdrop-blur lg:block">
        <div className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto p-2">
          {NAV.map((n) => {
            const aktif = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={aktif ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap ${
                  aktif ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
      {/* HP + tablet: bottom-nav ala vanilla (ikon + label + titik aktif) */}
      <nav aria-label="Navigasi utama" className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-6 px-2 py-1">
          {NAV.map((n) => {
            const aktif = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={aktif ? "page" : undefined}
                className={`relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-xl text-[0.7rem] font-semibold ${
                  aktif ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <n.ikon className="size-5" aria-hidden="true" />
                {n.label}
                <span
                  aria-hidden="true"
                  className={`absolute bottom-1 size-1 rounded-full bg-primary shadow-[0_0_6px_var(--primary)] transition-transform ${
                    aktif ? "scale-100" : "scale-0"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
