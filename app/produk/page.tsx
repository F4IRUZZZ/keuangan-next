"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTransaksi, segarkanCacheProduk, type Produk } from "@/lib/db-lokal";

export default function ProdukPage() {
  const [daftar, setDaftar] = useState<Produk[]>([]);
  const [pakai, setPakai] = useState<Record<number, number>>({});

  useEffect(() => {
    (async () => {
      const p = await segarkanCacheProduk();
      setDaftar(p);
      const tx = await getTransaksi();
      const hitung: Record<number, number> = {};
      for (const t of tx) if (t.produkId != null) hitung[t.produkId] = (hitung[t.produkId] ?? 0) + 1;
      setPakai(hitung);
    })();
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-16 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">Produk</h1>
        <Badge variant="secondary">Offline • Perangkat ini</Badge>
      </div>
      <Card>
        <CardHeader><CardTitle>Daftar kebutuhan</CardTitle></CardHeader>
        <CardContent>
          {daftar.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada produk. Tambah/hapus menyusul di fase B2.</p>
          ) : (
            <ul className="space-y-2">
              {daftar.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-xl border p-3">
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate">{p.nama}</strong>
                    <span className="block text-xs text-muted-foreground">
                      {p.kategori} • dipakai {pakai[p.id] ?? 0} transaksi
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
