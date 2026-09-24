"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatRupiah,
  getTransaksi,
  kategoriOf,
  muatSemuaCatatan,
  type Catatan,
  type Transaksi,
} from "@/lib/db-lokal";

function judul(t: Transaksi, notes: Catatan[]): string {
  const n = notes.find((c) => c.transaksiId === t.id);
  if (n?.isi) return n.isi;
  return `${t.jenis === "masuk" ? "Masuk" : "Keluar"} • ${kategoriOf(t)}`;
}

export default function TransaksiPage() {
  const [daftar, setDaftar] = useState<Transaksi[]>([]);
  const [notes, setNotes] = useState<Catatan[]>([]);
  const [tab, setTab] = useState("semua");
  const [cari, setCari] = useState("");

  useEffect(() => {
    (async () => {
      const [d, n] = await Promise.all([getTransaksi(), muatSemuaCatatan()]);
      setDaftar(d);
      setNotes(n);
    })();
  }, []);

  const kata = cari.trim().toLowerCase();
  const data = daftar.filter((t) => {
    if (tab !== "semua" && t.jenis !== tab) return false;
    if (!kata) return true;
    const notesT = notes
      .filter((c) => c.transaksiId === t.id)
      .map((c) => c.isi.toLowerCase())
      .join(" ");
    return (
      kategoriOf(t).toLowerCase().includes(kata) ||
      notesT.includes(kata) ||
      String(t.jumlah).includes(kata) ||
      t.tanggal.includes(kata)
    );
  });
  const urut = data.slice().sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : b.id - a.id));
  const nMasuk = data.filter((t) => t.jenis === "masuk").length;
  const subtotal = data.reduce((s, t) => s + Number(t.jumlah), 0);
  const mMasuk = data.filter((t) => t.jenis === "masuk").reduce((s, t) => s + Number(t.jumlah), 0);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-16 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">Catat &amp; Kelola Transaksi</h1>
        <Badge variant="secondary">Offline • Perangkat ini</Badge>
      </div>
      <Card>
        <CardHeader><CardTitle>Daftar</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="semua">Semua ({data.length})</TabsTrigger>
              <TabsTrigger value="masuk">Masuk ({nMasuk})</TabsTrigger>
              <TabsTrigger value="keluar">Keluar ({data.length - nMasuk})</TabsTrigger>
            </TabsList>
          </Tabs>
          <Input placeholder="Cari kategori / catatan / tanggal / nominal" value={cari} onChange={(e) => setCari(e.target.value)} />
          {urut.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada transaksi yang cocok.</p>
          ) : (
            <ul className="space-y-2">
              {urut.map((t) => (
                <li key={t.id}>
                  <Card>
                    <CardContent className="flex items-center gap-3 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <Badge variant={t.jenis === "masuk" ? "default" : "destructive"}>
                            {t.jenis === "masuk" ? "MASUK" : "KELUAR"}
                          </Badge>
                          <strong className="truncate">{judul(t, notes)}</strong>
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {kategoriOf(t)} • {t.tanggal}
                        </span>
                      </span>
                      <strong className={`whitespace-nowrap text-xl tabular-nums ${t.jenis === "masuk" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {t.jenis === "masuk" ? "+" : "-"}Rp{formatRupiah(t.jumlah)}
                      </strong>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-muted-foreground">
            {tab === "semua"
              ? `Selisih (masuk − keluar): Rp${formatRupiah(mMasuk * 2 - subtotal)}`
              : `Subtotal: Rp${formatRupiah(subtotal)}`}{" "}
            • Menampilkan {data.length} dari {daftar.length} catatan
          </p>
          <p className="text-xs text-muted-foreground">Form tambah/ubah/hapus menyusul di fase B2.</p>
        </CardContent>
      </Card>
      <Link href="/pengaturan" className="text-sm font-semibold text-muted-foreground underline">
        Backup / Restore di Pengaturan
      </Link>
    </main>
  );
}
