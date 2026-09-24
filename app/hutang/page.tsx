"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRupiah, getHutang, type Hutang } from "@/lib/db-lokal";
import { tanggalHariIni } from "@/lib/periode";

export default function HutangPage() {
  const [daftar, setDaftar] = useState<Hutang[]>([]);
  const [tab, setTab] = useState("semua");

  useEffect(() => {
    (async () => setDaftar(await getHutang()))();
  }, []);

  const data = daftar.filter((h) => tab === "semua" || h.arah === tab);
  const sisa = (h: Hutang) => h.jumlah - h.dibayar;
  const subtotal = data.reduce((s, h) => s + sisa(h), 0);
  const hariIni = tanggalHariIni();

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-16 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">Hutang</h1>
        <Badge variant="secondary">Offline • Perangkat ini</Badge>
      </div>
      <Card>
        <CardHeader><CardTitle>Daftar</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="semua">Semua ({daftar.length})</TabsTrigger>
              <TabsTrigger value="hutang">Hutang</TabsTrigger>
              <TabsTrigger value="piutang">Piutang</TabsTrigger>
            </TabsList>
          </Tabs>
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada hutang/piutang.</p>
          ) : (
            <ul className="space-y-2">
              {data.map((h) => (
                <li key={h.id} className="rounded-xl border p-3">
                  <div className="flex items-center gap-2">
                    <strong className="min-w-0 flex-1 truncate">{h.pihak}</strong>
                    <Badge variant={h.status === "lunas" ? "default" : "secondary"}>
                      {h.status === "lunas" ? "Lunas" : "Belum"}
                    </Badge>
                    {h.status === "belum" && h.jatuhTempo && h.jatuhTempo < hariIni && (
                      <Badge variant="destructive">LEWAT TEMPO</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {h.tanggal}
                    {h.jatuhTempo ? ` • tempo ${h.jatuhTempo}` : ""} • Sisa Rp{formatRupiah(sisa(h))} dari Rp{formatRupiah(h.jumlah)}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${h.jumlah > 0 ? Math.round((h.dibayar / h.jumlah) * 100) : 0}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-muted-foreground">Sisa total: Rp{formatRupiah(subtotal)} • Bayar/lunaskan menyusul di fase B2.</p>
        </CardContent>
      </Card>
    </main>
  );
}
