"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatRupiah,
  formatTanggal,
  getHutang,
  getTransaksi,
  kategoriOf,
  muatSemuaCatatan,
  tanggalHariIni,
  type Catatan,
  type Hutang,
  type Transaksi,
} from "@/lib/db-lokal";

function judul(t: Transaksi, notes: Catatan[]): string {
  const n = notes.find((c) => c.transaksiId === t.id);
  if (n?.isi) return n.isi;
  return `${t.jenis === "masuk" ? "Masuk" : "Keluar"} - ${kategoriOf(t)}`;
}

const sisa = (h: Hutang) => h.jumlah - h.dibayar;

export default function Riwayat() {
  const [tab, setTab] = useState("transaksi");
  const [daftar, setDaftar] = useState<Transaksi[]>([]);
  const [notes, setNotes] = useState<Catatan[]>([]);
  const [hutang, setHutang] = useState<Hutang[]>([]);
  const hariIni = tanggalHariIni();

  useEffect(() => {
    (async () => {
      const [d, n, h] = await Promise.all([getTransaksi(), muatSemuaCatatan(), getHutang()]);
      setDaftar(
        d
          .slice()
          .sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : b.id - a.id))
      );
      setNotes(n);
      setHutang(h);
    })();
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-16 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">Riwayat</h1>
        <Badge variant="secondary">Baca-saja • ubah di menu asal</Badge>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList id="tab-riwayat" aria-label="Pilih riwayat">
          <TabsTrigger value="transaksi">Transaksi ({daftar.length})</TabsTrigger>
          <TabsTrigger value="hutang">Hutang ({hutang.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="transaksi">
          <Card>
            <CardHeader><CardTitle>Semua transaksi</CardTitle></CardHeader>
            <CardContent>
              {daftar.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
              ) : (
                <>
                  <ul className="space-y-2">
                    {daftar.map((t) => (
                      <li key={t.id} className="flex items-center gap-2 text-sm">
                        <Badge variant={t.jenis === "masuk" ? "default" : "destructive"}>
                          {t.jenis === "masuk" ? "MASUK" : "KELUAR"}
                        </Badge>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{judul(t, notes)}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {kategoriOf(t)} • {formatTanggal(t.tanggal)}
                          </span>
                        </span>
                        <strong className="tabular-nums">Rp{formatRupiah(t.jumlah)}</strong>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Menampilkan {daftar.length} dari {daftar.length} catatan.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="hutang">
          <Card>
            <CardHeader><CardTitle>Semua hutang & piutang</CardTitle></CardHeader>
            <CardContent>
              {hutang.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada hutang/piutang.</p>
              ) : (
                <>
                  <ul className="space-y-2">
                    {hutang.map((h) => (
                      <li key={h.id} className="rounded-xl border p-3">
                        <div className="flex items-center gap-2">
                          <strong className="min-w-0 flex-1 truncate">{h.pihak}</strong>
                          <Badge variant={h.arah === "hutang" ? "destructive" : "default"}>
                            {h.arah === "hutang" ? "HUTANG" : "PIUTANG"}
                          </Badge>
                          <Badge variant={h.status === "lunas" ? "default" : "secondary"}>
                            {h.status === "lunas" ? "Lunas" : "Belum"}
                          </Badge>
                          {h.status === "belum" && h.jatuhTempo && h.jatuhTempo < hariIni && (
                            <Badge variant="warning">LEWAT TEMPO</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatTanggal(h.tanggal)}
                          {h.jatuhTempo ? ` - tempo ${formatTanggal(h.jatuhTempo)}` : ""} - Sisa Rp{formatRupiah(sisa(h))} dari Rp{formatRupiah(h.jumlah)}
                        </p>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${h.jumlah > 0 ? Math.round((h.dibayar / h.jumlah) * 100) : 0}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Menampilkan {hutang.length} dari {hutang.length} catatan.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
