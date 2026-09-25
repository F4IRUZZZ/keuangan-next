"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogCatatan } from "@/components/dialog-catatan";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addCatatan,
  addTransaksi,
  deleteTransaksi,
  eksporCSV,
  formatRupiah,
  getBatasHarian,
  getSaldo,
  getTransaksi,
  kategoriOf,
  muatSemuaCatatan,
  segarkanCacheProduk,
  tanggalHariIni,
  unduhFile,
  updateTransaksi,
  type Catatan,
  type Jenis,
  type Saldo,
  type Transaksi,
} from "@/lib/db-lokal";
import { akhirBulanIni, awalBulanIni } from "@/lib/periode";

function judul(t: Transaksi, notes: Catatan[]): string {
  const n = notes.find((c) => c.transaksiId === t.id);
  if (n?.isi) return n.isi;
  return `${t.jenis === "masuk" ? "Masuk" : "Keluar"} - ${kategoriOf(t)}`;
}

const CHIPS_TAMBAH = [10000, 50000, 100000, 500000];
const CHIPS_TEMPEL = ["00", "000"];

function IsiTransaksi() {
  const params = useSearchParams();
  const [daftar, setDaftar] = useState<Transaksi[]>([]);
  const [notes, setNotes] = useState<Catatan[]>([]);
  const [saran, setSaran] = useState<string[]>([]);
  const [tab, setTab] = useState("semua");
  const [cari, setCari] = useState("");
  const [cariBuka, setCariBuka] = useState(false);
  const [cepat, setCepat] = useState<{ dari: string; sampai: string } | null>(null);
  const [saldoBulan, setSaldoBulan] = useState<Saldo>({ masuk: 0, keluar: 0, saldo: 0 });
  const [keluarHari, setKeluarHari] = useState(0);
  const [batas, setBatas] = useState(500000);
  // Form state (pola vanilla: 1 state per field)
  const [jenis, setJenis] = useState<Jenis>("masuk");
  const [nominal, setNominal] = useState("");
  const [kategori, setKategori] = useState("");
  const [tanggal, setTanggal] = useState(tanggalHariIni());
  const [catatan, setCatatan] = useState("");
  const [pesan, setPesan] = useState("");
  const [pesanOk, setPesanOk] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  // Bulk hapus (port Set vanilla)
  const [terpilih, setTerpilih] = useState<Set<number>>(new Set());
  // Dialog ubah + hapus
  const [ubahId, setUbahId] = useState<number | null>(null);
  const [ubahTgl, setUbahTgl] = useState("");
  const [ubahJml, setUbahJml] = useState("");
  const [ubahKat, setUbahKat] = useState("");
  const [ubahPesan, setUbahPesan] = useState("");
  const [hapusId, setHapusId] = useState<number | null>(null);
  const [konfirmBulk, setKonfirmBulk] = useState(false);
  const refCari = useRef<HTMLInputElement>(null);

  async function muat() {
    const [d, n, prods, sb, sh] = await Promise.all([
      getTransaksi(),
      muatSemuaCatatan(),
      segarkanCacheProduk(),
      getSaldo({ dari: awalBulanIni(), sampai: akhirBulanIni() }),
      getSaldo({ dari: tanggalHariIni(), sampai: tanggalHariIni() }),
    ]);
    setDaftar(d);
    setNotes(n);
    setSaldoBulan(sb);
    setKeluarHari(sh.keluar);
    setBatas(getBatasHarian());
    const kat = new Set<string>();
    prods.forEach((p) => kat.add(p.kategori));
    d.forEach((t) => kat.add(kategoriOf(t)));
    setSaran(Array.from(kat).sort());
  }

  useEffect(() => {
    muat();
  }, []);

  // Preset ?jenis= (butuh Suspense di Next static — lihat pembungkus bawah)
  useEffect(() => {
    const j = params.get("jenis");
    if (j === "masuk" || j === "keluar") setJenis(j);
  }, [params]);

  function tulisNominalDariDigit(digit: string) {
    const potong = digit.replace(/[^0-9]/g, "").slice(0, 15);
    setNominal(potong ? formatRupiah(Number(potong)) : "");
  }

  function ketikNominal(v: string) {
    tulisNominalDariDigit(v);
  }

  function resetForm() {
    setNominal("");
    setKategori("");
    setCatatan("");
    setTanggal(tanggalHariIni());
    setJenis("masuk");
    setPesan("Form dikosongkan.");
    setPesanOk(true);
  }

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
    setKonfirmBulk(false);
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

  async function unduhCSVToolbar() {
    unduhFile(`keuangan-${tanggalHariIni()}.csv`, await eksporCSV(), "text/csv");
    setPesan("CSV diekspor.");
    setPesanOk(true);
  }

  function toggleCepat(kunci: "hari" | "bulan") {
    const hari = tanggalHariIni();
    const rentang =
      kunci === "hari"
        ? { dari: hari, sampai: hari }
        : { dari: awalBulanIni(), sampai: akhirBulanIni() };
    setCepat((c) => (c && c.dari === rentang.dari && c.sampai === rentang.sampai ? null : rentang));
  }

  const kata = cari.trim().toLowerCase();
  function lolosCariTanggal(t: Transaksi): boolean {
    if (cepat && (t.tanggal < cepat.dari || t.tanggal > cepat.sampai)) return false;
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
  }
  // Hitungan tab dari pra-tab (cari+tanggal saja) agar stabil saat pindah tab.
  const dataPraTab = daftar.filter(lolosCariTanggal);
  const nPraMasuk = dataPraTab.filter((t) => t.jenis === "masuk").length;
  const data = dataPraTab.filter((t) => tab === "semua" || t.jenis === tab);
  const urut = data.slice().sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : b.id - a.id));
  const nMasuk = nPraMasuk;
  const subtotal = data.reduce((s, t) => s + Number(t.jumlah), 0);
  const mMasuk = data.filter((t) => t.jenis === "masuk").reduce((s, t) => s + Number(t.jumlah), 0);
  const persenLimit = batas > 0 ? Math.min(100, Math.round((keluarHari / batas) * 100)) : 0;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-16 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">Catat &amp; Kelola Transaksi</h1>
        <Badge variant="secondary">Offline - Perangkat ini</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Masuk (Bln Ini)</p>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
              Rp<NumberTicker value={saldoBulan.masuk} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Keluar (Bln Ini)</p>
            <p className="text-2xl font-bold text-red-600 tabular-nums dark:text-red-400">
              Rp<NumberTicker value={saldoBulan.keluar} />
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-4">
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
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" size="lg" disabled={menyimpan}>
                    {menyimpan ? "Menyimpan..." : "Simpan Transaksi"}
                  </Button>
                  <Button type="button" variant="secondary" size="lg" onClick={resetForm}>
                    Reset
                  </Button>
                </div>
                {pesan && (
                  <p className={`text-sm font-semibold ${pesanOk ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {pesan}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
          {batas > 0 && (
            <Card id="limit-card">
              <CardContent className="space-y-2 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm">Limit Pengeluaran Harian</strong>
                  <span className="text-xs text-muted-foreground">
                    Rp{formatRupiah(keluarHari)} / Rp{formatRupiah(batas)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-emerald-600" style={{ width: `${persenLimit}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {batas - keluarHari >= 0
                      ? `Tersisa Rp${formatRupiah(batas - keluarHari)} aman untuk hari ini`
                      : `Melebihi batas Rp${formatRupiah(keluarHari - batas)}`}
                  </span>
                  <span>{persenLimit}%</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <section className="space-y-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList id="tab-daftar">
              <TabsTrigger value="semua">Semua ({dataPraTab.length})</TabsTrigger>
              <TabsTrigger value="masuk">Masuk ({nMasuk})</TabsTrigger>
              <TabsTrigger value="keluar">Keluar ({dataPraTab.length - nMasuk})</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={cepat?.dari === tanggalHariIni() ? "default" : "secondary"}
              size="sm"
              onClick={() => toggleCepat("hari")}
            >
              Hari Ini
            </Button>
            <Button
              variant={cepat?.dari === awalBulanIni() && cepat?.sampai === akhirBulanIni() ? "default" : "secondary"}
              size="sm"
              onClick={() => toggleCepat("bulan")}
            >
              Bulan Ini
            </Button>
            <Button
              variant={cariBuka ? "default" : "ghost"}
              size="sm"
              aria-expanded={cariBuka}
              onClick={() => {
                setCariBuka((b) => {
                  if (!b) setTimeout(() => refCari.current?.focus(), 0);
                  return !b;
                });
              }}
            >
              Cari
            </Button>
            <Button variant="secondary" size="sm" onClick={unduhCSVToolbar}>
              CSV
            </Button>
            <label className="flex items-center gap-1 text-sm text-muted-foreground">
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
              Pilih semua
            </label>
          </div>
          {!cariBuka ? null : (
            <Input
              ref={refCari}
              placeholder="Cari kategori / catatan / tanggal / nominal"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setCariBuka(false);
              }}
            />
          )}
          {!terpilih.size ? null : (
            <div className="flex items-center gap-2 rounded-xl border p-2 text-sm">
              <span>{terpilih.size} terpilih.</span>
              <Button variant="destructive" size="sm" onClick={() => setKonfirmBulk(true)}>Hapus terpilih</Button>
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
                      <DialogCatatan transaksiId={t.id} judul={judul(t, notes)} onBerubah={muat} />
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

      <Dialog open={konfirmBulk} onOpenChange={setKonfirmBulk}>
        <DialogContent aria-label="Hapus transaksi terpilih">
          <DialogHeader>
            <DialogTitle>Hapus {terpilih.size} transaksi terpilih?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Catatan yang menempel ikut terhapus. Tindakan ini tidak bisa dibatalkan.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setKonfirmBulk(false)}>Batal</Button>
            <Button variant="destructive" onClick={hapusMassal}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default function TransaksiPage() {
  return (
    <Suspense fallback={<main className="p-8 text-sm text-muted-foreground">Memuat transaksi...</main>}>
      <IsiTransaksi />
    </Suspense>
  );
}
