"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addCatatan,
  addTransaksi,
  deleteTransaksi,
  formatRupiah,
  getTransaksi,
  kategoriOf,
  muatSemuaCatatan,
  segarkanCacheProduk,
  tanggalHariIni,
  updateTransaksi,
  type Catatan,
  type Jenis,
  type Transaksi,
} from "@/lib/db-lokal";

function judul(t: Transaksi, notes: Catatan[]): string {
  const n = notes.find((c) => c.transaksiId === t.id);
  if (n?.isi) return n.isi;
  return `${t.jenis === "masuk" ? "Masuk" : "Keluar"} - ${kategoriOf(t)}`;
}

const CHIPS_TAMBAH = [10000, 50000, 100000, 500000];
const CHIPS_TEMPEL = ["00", "000"];

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
  // Bulk hapus (port Set vanilla): id terpilih + bar aksi.
  const [terpilih, setTerpilih] = useState<Set<number>>(new Set());
  // Dialog ubah (shadcn) + dialog hapus (konfirmasi).
  const [ubahId, setUbahId] = useState<number | null>(null);
  const [ubahTgl, setUbahTgl] = useState("");
  const [ubahJml, setUbahJml] = useState("");
  const [ubahKat, setUbahKat] = useState("");
  const [ubahPesan, setUbahPesan] = useState("");
  const [hapusId, setHapusId] = useState<number | null>(null);

  // Tulis nominal 1 pintu (DRY B2.2b): semua jalur (ketik, tambah, tempel)
  // lewat sini -> selalu tampil format ribuan. Maks 15 digit.
  function tulisNominalDariDigit(digit: string) {
    const potong = digit.replace(/[^0-9]/g, "").slice(0, 15);
    setNominal(potong ? formatRupiah(Number(potong)) : "");
  }

  // Format live nominal (port pasangFormatRupiahLive): digit -> titik ribuan.
  // Keterbatasan sama: kursor lompat ke akhir (terdokumentasi).
  function ketikNominal(v: string) {
    tulisNominalDariDigit(v);
  }

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

  async function hapusMassal() {
    if (terpilih.size === 0) return;
    if (!window.confirm(`Hapus ${terpilih.size} transaksi terpilih?`)) return;
    let ok = 0;
    const gagal: number[] = [];
    for (const id of Array.from(terpilih)) {
      if ((await deleteTransaksi(id)) === true) ok++;
      else gagal.push(id);
    }
    setTerpilih(new Set());
    await muat();
    if (gagal.length === 0) {
      setPesan(`${ok} transaksi dihapus.`);
      setPesanOk(true);
    } else {
      setPesan(`${ok} dihapus, ${gagal.length} gagal (hilang).`);
      setPesanOk(false);
    }
  }

  function bukaUbah(t: Transaksi) {
    setUbahId(t.id);
    setUbahTgl(t.tanggal);
    setUbahJml(formatRupiah(t.jumlah));
    setUbahKat(kategoriOf(t));
    setUbahPesan("");
  }

  async function simpanUbah() {
    if (ubahId === null) return;
    const jumlah = Number(String(ubahJml).replace(/[^0-9]/g, "")) || 0;
    const alvo = daftar.find((t) => t.id === ubahId);
    const patch: { jumlah: number; tanggal: string; kategori?: string } = {
      jumlah,
      tanggal: ubahTgl,
    };
    if (alvo?.jenis === "keluar") patch.kategori = ubahKat;
    const out = await updateTransaksi(ubahId, patch);
    if (!out) {
      setUbahPesan("Gagal: transaksi tidak ditemukan.");
      return;
    }
    if (typeof out === "object" && "error" in out) {
      setUbahPesan(`Gagal (${out.code}): ${out.error}`);
      return;
    }
    setUbahId(null);
    setPesan(`Transaksi diubah jadi Rp${formatRupiah(jumlah)}.`);
    setPesanOk(true);
    await muat();
  }

  async function jalankanHapus() {
    if (hapusId === null) return;
    const t = daftar.find((x) => x.id === hapusId);
    const out = await deleteTransaksi(hapusId);
    setHapusId(null);
    if (!out) {
      setPesan("Gagal: transaksi tidak ditemukan.");
      setPesanOk(false);
      await muat();
      return;
    }
    setPesan(`Transaksi Rp${formatRupiah(t?.jumlah ?? 0)} dihapus.`);
    setPesanOk(true);
    await muat();
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
                  onChange={(e) => ketikNominal(e.target.value)}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {CHIPS_TEMPEL.map((nol) => (
                    <Button
                      key={"t" + nol}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => tulisNominalDariDigit(String(nominal.replace(/[^0-9]/g, "")) + nol)}
                    >
                      +{nol}
                    </Button>
                  ))}
                  {CHIPS_TAMBAH.map((c) => (
                    <Button
                      key={c}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => tulisNominalDariDigit(String((Number(nominal.replace(/[^0-9]/g, "")) || 0) + c))}
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
          {!terpilih.size ? null : (
            <div className="flex items-center gap-2 rounded-xl border p-2 text-sm">
              <span>{terpilih.size} terpilih.</span>
              <Button variant="destructive" size="sm" onClick={hapusMassal}>Hapus terpilih</Button>
            </div>
          )}
          {urut.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada transaksi yang cocok.</p>
          ) : (
            <ul className="space-y-2">
              {urut.map((t) => (
                <li key={t.id}>
                  <Card>
                    <CardContent className="flex items-center gap-3 py-3">
                      <input
                        type="checkbox"
                        className="size-5 shrink-0 accent-emerald-600"
                        checked={terpilih.has(t.id)}
                        aria-label={`Pilih transaksi Rp${formatRupiah(t.jumlah)}`}
                        onChange={(e) => {
                          setTerpilih((s) => {
                            const n = new Set(s);
                            if (e.target.checked) n.add(t.id);
                            else n.delete(t.id);
                            return n;
                          });
                        }}
                      />
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
                      <Button variant="ghost" size="icon" aria-label="Ubah" onClick={() => bukaUbah(t)}>Ubah</Button>
                      <Button variant="ghost" size="icon" aria-label="Hapus" onClick={() => setHapusId(t.id)}>Hapus</Button>
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
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="size-5 accent-emerald-600"
              aria-label="Pilih semua yang tampil"
              checked={data.length > 0 && data.every((t) => terpilih.has(t.id))}
              onChange={(e) => {
                setTerpilih((s) => {
                  const n = new Set(s);
                  for (const t of data) {
                    if (e.target.checked) n.add(t.id);
                    else n.delete(t.id);
                  }
                  return n;
                });
              }}
            />
            Pilih semua yang tampil
          </label>
          <p className="text-xs text-muted-foreground">Ubah/hapus via Dialog menyusul di B2.2.</p>
        </section>
      </div>
      <Link href="/pengaturan" className="text-sm font-semibold text-muted-foreground underline">
        Backup / Restore di Pengaturan
      </Link>

      <Dialog open={ubahId !== null} onOpenChange={(b) => { if (!b) setUbahId(null); }}>
        <DialogContent aria-label="Ubah transaksi">
          <DialogHeader>
            <DialogTitle>Ubah transaksi</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="u-tgl">Tanggal baru</label>
              <Input id="u-tgl" type="date" value={ubahTgl} onChange={(e) => setUbahTgl(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="u-jml">Jumlah baru</label>
              <Input id="u-jml" inputMode="numeric" value={ubahJml} onChange={(e) => {
                const digit = e.target.value.replace(/[^0-9]/g, "").slice(0, 15);
                setUbahJml(digit ? formatRupiah(Number(digit)) : "");
              }} />
            </div>
            {daftar.find((t) => t.id === ubahId)?.jenis === "keluar" && (
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="u-kat">Kategori baru</label>
                <Input id="u-kat" value={ubahKat} onChange={(e) => setUbahKat(e.target.value)} />
              </div>
            )}
            {ubahPesan && <p className="text-sm font-semibold text-red-600 dark:text-red-400">{ubahPesan}</p>}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setUbahId(null)}>Batal</Button>
            <Button onClick={simpanUbah}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={hapusId !== null} onOpenChange={(b) => { if (!b) setHapusId(null); }}>
        <DialogContent aria-label="Hapus transaksi">
          <DialogHeader>
            <DialogTitle>Hapus transaksi ini?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Catatan yang menempel ikut terhapus. Tindakan ini tidak bisa dibatalkan.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setHapusId(null)}>Batal</Button>
            <Button variant="destructive" onClick={jalankanHapus}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
