"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/transaksi", label: "Transaksi" },
  { href: "/produk", label: "Produk" },
  { href: "/hutang", label: "Hutang" },
  { href: "/pengaturan", label: "Pengaturan" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
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
  );
}
