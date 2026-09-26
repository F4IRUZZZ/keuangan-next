"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import {
  addProduk,
  deleteProduk,
  getTransaksi,
  segarkanCacheProduk,
  updateProduk,
  type Produk,
} from "@/lib/db-lokal";

export default function ProdukPage() {
  const [daftar, setDaftar] = useState<Produk[]>([]);
  const [pakai, setPakai] = useState<Record<number, number>>({});
  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState("");
  const [pesan, setPesan] = useState("");
  const [pesanOk, setPesanOk] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [ubahId, setUbahId] = useState<number | null>(null);
  const [ubahNama, setUbahNama] = useState("");
  const [ubahKat, setUbahKat] = useState("");
  const [ubahPesan, setUbahPesan] = useState("");
  const [hapusId, setHapusId] = useState<number | null>(null);

  async function muat() {
    const p = await segarkanCacheProduk();
    setDaftar(p);
    const tx = await getTransaksi();
    const hitung: Record<number, number> = {};
    for (const t of tx) if (t.produkId != null) hitung[t.produkId] = (hitung[t.produkId] ?? 0) + 1;
    setPakai(hitung);
  }

  useEffect(() => {
    muat();
  }, []);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setMenyimpan(true);
    try {
      const res = await addProduk(nama, kategori);
      if ("error" in res) {
        setPesan(`Gagal (${res.code}): ${res.error}`);
        setPesanOk(false);
        return;
      }
      setPesan(`Produk "${res.data.nama}" ditambah!`);
      setPesanOk(true);
      setNama("");
      setKategori("");
      await muat();
    } finally {
      setMenyimpan(false);
    }
  }

  function bukaUbah(p: Produk) {
    setUbahId(p.id);
    setUbahNama(p.nama);
    setUbahKat(p.kategori);
    setUbahPesan("");
  }

  async function simpanUbah() {
    if (ubahId === null) return;
    const out = await updateProduk(ubahId, { nama: ubahNama, kategori: ubahKat });
    if (!out) {
      setUbahPesan("Gagal: produk tidak ditemukan.");
      return;
    }
    if (typeof out === "object" && "error" in out) {
      setUbahPesan(`Gagal (${out.code}): ${out.error}`);
      return;
    }
    setUbahId(null);
    setPesan(`Produk diubah jadi "${ubahNama}".`);
    setPesanOk(true);
    await muat();
  }

  async function jalankanHapus() {
    if (hapusId === null) return;
    const p = daftar.find((x) => x.id === hapusId);
    const out = await deleteProduk(hapusId);
    setHapusId(null);
    if (!out) {
      setPesan("Gagal: produk tidak ditemukan.");
      setPesanOk(false);
      await muat();
      return;
    }
    setPesan(`Produk "${p?.nama ?? ""}" dihapus.`);
    setPesanOk(true);
    await muat();
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-16 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">Produk</h1>
        <Badge variant="secondary">Offline - Perangkat ini</Badge>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Tambah Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={simpan} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="nama-produk">Nama produk</label>
                <Input id="nama-produk" placeholder="contoh: Beras" value={nama} onChange={(e) => setNama(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="kat-produk">Kategori</label>
                <Input id="kat-produk" placeholder="contoh: Pangan" value={kategori} onChange={(e) => setKategori(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={menyimpan}>
                {menyimpan ? "Menyimpan..." : "Tambah"}
              </Button>
              {pesan && (
                <p className={`text-sm font-semibold ${pesanOk ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {pesan}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Daftar kebutuhan</CardTitle></CardHeader>
          <CardContent>
            {daftar.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada produk. Yuk tambah kebutuhan pertama di form.</p>
            ) : (
              <ul className="space-y-2">
                {daftar.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl border p-3">
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate">{p.nama}</strong>
                      <span className="block text-xs text-muted-foreground">
                        {p.kategori} - dipakai {pakai[p.id] ?? 0} transaksi
                      </span>
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => bukaUbah(p)}>Ubah</Button>
                    <Button variant="ghost" size="sm" onClick={() => setHapusId(p.id)}>Hapus</Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={ubahId !== null} onOpenChange={(b) => { if (!b) setUbahId(null); }}>
        <DialogContent aria-label="Ubah produk">
          <DialogHeader>
            <DialogTitle>Ubah produk</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="u-nama">Nama baru</label>
              <Input id="u-nama" value={ubahNama} onChange={(e) => setUbahNama(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="u-kat">Kategori baru</label>
              <Input id="u-kat" value={ubahKat} onChange={(e) => setUbahKat(e.target.value)} />
            </div>
            {ubahPesan && <p className="text-sm font-semibold text-red-600 dark:text-red-400">{ubahPesan}</p>}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setUbahId(null)}>Batal</Button>
            <Button onClick={simpanUbah}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={hapusId !== null} onOpenChange={(b) => { if (!b) setHapusId(null); }}>
        <DialogContent aria-label="Hapus produk">
          <DialogHeader>
            <DialogTitle>Hapus produk ini?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Transaksi yang sudah memakai produk ini tidak berubah (kategori tersalin).</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setHapusId(null)}>Batal</Button>
            <Button variant="destructive" onClick={jalankanHapus}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
