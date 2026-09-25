"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addCatatan,
  addTransaksi,
  formatRupiah,
  getTransaksi,
  kategoriOf,
  muatSemuaCatatan,
  segarkanCacheProduk,
  tanggalHariIni,
  type Catatan,
  type Jenis,
  type Transaksi,
} from "@/lib/db-lokal";

function judul(t: Transaksi, notes: Catatan[]): string {
  const n = notes.find((c) => c.transaksiId === t.id);
  if (n?.isi) return n.isi;
  return `${t.jenis === "masuk" ? "Masuk" : "Keluar"} - ${kategoriOf(t)}`;
}

const CHIPS = [10000, 50000, 100000, 500000];

export default function TransaksiPage() {
  const [daftar, setDaftar] = useState<Transaksi[]>([]);
  const [notes, setNotes] = useState<Catatan[]>([]);
  const [saran, setSaran] = useState<string[]>([]);
  const [tab, setTab] = useState("semua");
  const [cari, setCari] = useState("");
  // Form state (pola vanilla: 1 state per field)
  const [jenis, setJenis] = useState<Jenis>("masuk");
  const [nominal, setNominal] = useState("");
  const [kategori, setKategori] = useState("");
  const [tanggal, setTanggal] = useState(tanggalHariIni());
  const [catatan, setCatatan] = useState("");
  const [pesan, setPesan] = useState("");
  const [pesanOk, setPesanOk] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);

  async function muat() {
    const [d, n, prods] = await Promise.all([
      getTransaksi(),
      muatSemuaCatatan(),
      segarkanCacheProduk(),
    ]);
    setDaftar(d);
    setNotes(n);
    const kat = new Set<string>();
    prods.forEach((p) => kat.add(p.kategori));
    d.forEach((t) => kat.add(kategoriOf(t)));
    setSaran(Array.from(kat).sort());
  }

  useEffect(() => {
    muat();
  }, []);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    const jumlah = Number(String(nominal).replace(/[^0-9]/g, "")) || 0;
    if (!(jumlah > 0)) {
      setPesan("Jumlah harus angka lebih dari 0 (Rp).");
      setPesanOk(false);
      return;
    }
    setMenyimpan(true);
    try {
      const res = await addTransaksi({
        jenis,
        jumlah,
        produkId: null,
        kategori: jenis === "keluar" ? kategori.trim() || null : null,
        tanggal: tanggal || tanggalHariIni(),
      });
      if ("error" in res) {
        setPesan(`Gagal (${res.code}): ${res.error}`);
        setPesanOk(false);
        return;
      }
      let info = `${res.data.jenis} Rp${formatRupiah(res.data.jumlah)} tercatat!`;
      if (catatan.trim()) {
        const rc = await addCatatan(res.data.id, catatan);
        info += rc && "code" in rc && rc.code === 201 ? " Catatan tersimpan." : ` (Catatan gagal)`;
      }
      setPesan(info);
      setPesanOk(true);
      setNominal("");
      setKategori("");
      setCatatan("");
      setTanggal(tanggalHariIni());
      await muat();
    } finally {
      setMenyimpan(false);
    }
  }

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
        <Badge variant="secondary">Offline - Perangkat ini</Badge>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Catat Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={simpan} className="space-y-4">
              <Tabs value={jenis} onValueChange={(v) => setJenis(v as Jenis)}>
                <TabsList id="tab-form" className="grid w-full grid-cols-2">
                  <TabsTrigger value="masuk">Masuk</TabsTrigger>
                  <TabsTrigger value="keluar">Keluar</TabsTrigger>
                </TabsList>
              </Tabs>
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="jml">Jumlah</label>
                <Input
                  id="jml"
                  inputMode="numeric"
                  className="text-3xl font-bold"
                  placeholder="contoh: 20000"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {CHIPS.map((c) => (
                    <Button
                      key={c}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setNominal(String((Number(nominal.replace(/[^0-9]/g, "")) || 0) + c))}
                    >
                      +{c / 1000}rb
                    </Button>
                  ))}
                </div>
              </div>
              {jenis === "keluar" && (
                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="kat">Untuk apa?</label>
                  <Input
                    id="kat"
                    list="saran-kat"
                    placeholder="contoh: Makan / Beras / Parkir"
                    autoComplete="off"
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                  />
                  <datalist id="saran-kat">
                    {saran.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="tgl">Tanggal</label>
                <Input id="tgl" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="ctt">Catatan (opsional)</label>
                <Input id="ctt" placeholder="contoh: Gajian minggu ini" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={menyimpan}>
                {menyimpan ? "Menyimpan..." : "Simpan Transaksi"}
              </Button>
              {pesan && (
                <p className={`text-sm font-semibold ${pesanOk ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {pesan}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList id="tab-daftar">
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
                          {kategoriOf(t)} - {t.tanggal}
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
              ? `Selisih (masuk - keluar): Rp${formatRupiah(mMasuk * 2 - subtotal)}`
              : `Subtotal: Rp${formatRupiah(subtotal)}`}{" "}
            - Menampilkan {data.length} dari {daftar.length} catatan
          </p>
          <p className="text-xs text-muted-foreground">Ubah/hapus via Dialog menyusul di B2.2.</p>
        </section>
      </div>
      <Link href="/pengaturan" className="text-sm font-semibold text-muted-foreground underline">
        Backup / Restore di Pengaturan
      </Link>
    </main>
  );
}
