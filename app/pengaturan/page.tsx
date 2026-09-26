"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { BadgeKoneksi } from "@/components/badge-koneksi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PemilihTema } from "@/components/pemilih-tema";
import {
  formatRupiah,
  getBatasHarian,
  hapusSemuaData,
  imporBackup,
  setBatasHarian,
  tanggalHariIni,
} from "@/lib/db-lokal";

async function bacaSemua() {
  const { getTransaksi, getHutang, muatSemuaCatatan, segarkanCacheProduk } = await import(
    "@/lib/db-lokal"
  );
  const [produk, transaksi, catatan, hutang] = await Promise.all([
    segarkanCacheProduk(),
    getTransaksi(),
    muatSemuaCatatan(),
    getHutang(),
  ]);
  return { produk, transaksi, catatan, hutang };
}

function unduh(nama: string, teks: string, tipe: string) {
  const blob = new Blob([teks], { type: tipe });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nama;
  a.click();
  URL.revokeObjectURL(a.href);
}

function selCSV(teks: unknown): string {
  return `"${String(teks).replace(/"/g, '""')}"`;
}

export default function PengaturanPage() {
  const [hasil, setHasil] = useState("");
  const [batasTeks, setBatasTeks] = useState("");
  const [konfirmHapus, setKonfirmHapus] = useState(false);

  useEffect(() => {
    const kini = getBatasHarian();
    if (kini > 0) setBatasTeks(formatRupiah(kini));
  }, []);

  function simpanBatas() {
    const v = Number(batasTeks.replace(/[^0-9]/g, "")) || 0;
    setBatasHarian(v);
    setHasil(v > 0 ? `Batas disimpan: Rp${formatRupiah(v)} per hari.` : "Kartu limit disembunyikan (batas 0).");
  }

  async function eksporCSV() {
    const { produk, transaksi, catatan } = await bacaSemua();
    const katOf = (t: { kategori: string | null; produkId: number | null }) => {
      if (t.kategori) return t.kategori;
      const p = produk.find((x) => x.id === t.produkId);
      return p ? p.kategori : "Lainnya";
    };
    const baris = ["tanggal,jenis,jumlah,kategori,catatan"];
    for (const t of transaksi) {
      const notes = catatan
        .filter((c) => c.transaksiId === t.id)
        .map((c) => c.isi)
        .join("; ");
      baris.push([selCSV(t.tanggal), selCSV(t.jenis), t.jumlah, selCSV(katOf(t)), selCSV(notes)].join(","));
    }
    unduh(`keuangan-${tanggalHariIni()}.csv`, baris.join("\r\n"), "text/csv");
    setHasil("CSV diekspor.");
  }

  async function backup() {
    const semua = await bacaSemua();
    unduh(
      `keuangan-backup-${tanggalHariIni()}.json`,
      JSON.stringify({ dibackup: new Date().toISOString(), format: "keuangan-offline-v1", ...semua }, null, 2),
      "application/json"
    );
    setHasil(`Backup diunduh (${semua.transaksi.length} transaksi).`);
  }

  async function restore(file: File | undefined) {
    if (!file) {
      setHasil("Pilih dulu file backup (.json).");
      return;
    }
    try {
      const data = JSON.parse(await file.text());
      const r = await imporBackup(data);
      setHasil(`Restore sukses: ${r.transaksi} transaksi, ${r.hutang} hutang, ${r.produk} produk.`);
    } catch {
      setHasil("File bukan backup valid.");
    }
  }

  async function hapus() {
    try {
      await hapusSemuaData();
    } catch {
      setHasil("Gagal hapus: penyimpanan perangkat bermasalah.");
      return;
    }
    setKonfirmHapus(false);
    setHasil("Semua data dihapus.");
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-16 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">Pengaturan</h1>
        <BadgeKoneksi />
      </div>
      <Card>
        <CardHeader><CardTitle>Tampilan</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <PemilihTema />
          <p className="text-sm text-muted-foreground">Sistem = ikut terang/gelap HP &amp; laptop ini.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Ekspor Data</CardTitle></CardHeader>
        <CardContent><Button onClick={eksporCSV}>Ekspor CSV</Button></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Backup &amp; Restore</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={backup}>Unduh Backup (JSON)</Button>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="file-restore">File backup untuk restore:</label>
            <input
              id="file-restore"
              type="file"
              accept="application/json"
              onChange={(e) => restore(e.target.files?.[0])}
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Batas Pengeluaran Harian</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="batas">Batas per hari (Rp, 0 = sembunyikan kartu)</label>
            <Input id="batas" inputMode="numeric" value={batasTeks} onChange={(e) => {
              const digit = e.target.value.replace(/[^0-9]/g, "").slice(0, 15);
              setBatasTeks(digit ? formatRupiah(Number(digit)) : "");
            }} />
          </div>
          <Button onClick={simpanBatas}>Simpan Batas</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Zona Bahaya</CardTitle></CardHeader>
        <CardContent><Button variant="destructive" onClick={() => setKonfirmHapus(true)}>Hapus Semua Data di Perangkat Ini</Button></CardContent>
      </Card>
      {hasil && <p className="text-sm text-muted-foreground">{hasil}</p>}

      <Dialog open={konfirmHapus} onOpenChange={setKonfirmHapus}>
        <DialogContent aria-label="Hapus semua data">
          <DialogHeader>
            <DialogTitle>Hapus SEMUA data di perangkat ini?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Produk, transaksi, catatan, hutang, batas harian, dan tema ikut terhapus.
            Backup dulu bila perlu — tindakan ini tidak bisa dibatalkan.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setKonfirmHapus(false)}>Batal</Button>
            <Button variant="destructive" onClick={hapus}>Ya, hapus semua</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
