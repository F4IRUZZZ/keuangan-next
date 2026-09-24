"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  HandCoins,
  LayoutDashboard,
  Package,
  Settings,
} from "lucide-react";
import { Dock, DockIcon } from "@/components/ui/dock";
import { NumberTicker } from "@/components/ui/number-ticker";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const NAV = [
  { href: "#", icon: LayoutDashboard, label: "Dashboard" },
  { href: "#", icon: ArrowLeftRight, label: "Transaksi" },
  { href: "#", icon: Package, label: "Produk" },
  { href: "#", icon: HandCoins, label: "Hutang" },
  { href: "#", icon: Settings, label: "Pengaturan" },
];

export default function CobaKomponen() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center gap-10 p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Saldo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold tabular-nums">
            Rp
            <NumberTicker value={300000} />
          </p>
        </CardContent>
      </Card>
      <Dock>
        {NAV.map((item) => (
          <DockIcon key={item.label} aria-label={item.label}>
            <Link href={item.href} aria-label={item.label}>
              <item.icon className="size-5" />
            </Link>
          </DockIcon>
        ))}
      </Dock>
    </main>
  );
}
