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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addHutang,
  bayarHutang,
  deleteHutang,
  formatRupiah,
  formatTanggal,
  getCicilan,
  getHutang,
  lunaskanHutang,
  tanggalHariIni,
  type Arah,
  type Hutang,
  type Transaksi,
} from "@/lib/db-lokal";

export default function HutangPage() {
  const [daftar, setDaftar] = useState<Hutang[]>([]);
  const [tab, setTab] = useState("semua");
  // Form tambah
  const [arah, setArah] = useState<Arah>("hutang");
  const [pihak, setPihak] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [tanggal, setTanggal] = useState(tanggalHariIni());
  const [tempo, setTempo] = useState("");
  const [ket, setKet] = useState("");
  const [pesan, setPesan] = useState("");
  const [pesanOk, setPesanOk] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  // Dialog bayar + hapus
  const [bayarId, setBayarId] = useState<number | null>(null);
  const [bayarNom, setBayarNom] = useState("");
  const [bayarTgl, setBayarTgl] = useState(tanggalHariIni());
  const [bayarPesan, setBayarPesan] = useState("");
  const [hapusId, setHapusId] = useState<number | null>(null);
  // Panel rincian cicilan (akordeon: 1 terbuka per saat)
  const [rincianId, setRincianId] = useState<number | null>(null);
  const [rincianRows, setRincianRows] = useState<Transaksi[]>([]);

  async function muat() {
    setDaftar(await getHutang());
  }

  useEffect(() => {
    muat();
  }, []);

  function ketikRp(v: string, set: (s: string) => void) {
    const digit = v.replace(/[^0-9]/g, "").slice(0, 15);
    set(digit ? formatRupiah(Number(digit)) : "");
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    const jml = Number(String(jumlah).replace(/[^0-9]/g, "")) || 0;
    setMenyimpan(true);
    try {
      const res = await addHutang({
        arah,
        pihak,
        jumlah: jml,
        tanggal: tanggal || tanggalHariIni(),
        jatuhTempo: tempo || null,
        keterangan: ket,
      });
      if ("error" in res) {
        setPesan(`Gagal (${res.code}): ${res.error}`);
        setPesanOk(false);
        return;
      }
      setPesan(`${res.data.arah} ${res.data.pihak} Rp${formatRupiah(res.data.jumlah)} tercatat!`);
      setPesanOk(true);
      setPihak("");
      setJumlah("");
      setTempo("");
      setKet("");
      setTanggal(tanggalHariIni());
      await muat();
    } finally {
      setMenyimpan(false);
    }
  }

  function bukaBayar(h: Hutang) {
    setBayarId(h.id);
    setBayarNom("");
    setBayarTgl(tanggalHariIni());
    setBayarPesan("");
  }

  async function jalankanBayar() {
    if (bayarId === null) return;
    console.log("DBG-JALANKAN-BAYAR id=" + bayarId);
    const n = Number(String(bayarNom).replace(/[^0-9]/g, "")) || 0;
    const out = await bayarHutang(bayarId, n, bayarTgl || undefined);
    if ("error" in out) {
      setBayarPesan(`Gagal (${out.code}): ${out.error}`);
      return;
    }
    setBayarId(null);
    const s = out.data.jumlah - out.data.dibayar;
    setPesan(out.data.status === "lunas" ? "Lunas + tercatat di kas." : `Bayaran tercatat, sisa Rp${formatRupiah(s)}.`);
    setPesanOk(true);
    await muat();
    if (rincianId === out.data.id) setRincianRows(await getCicilan(out.data.id));
  }

  async function jalankanLunas(id: number) {
    console.log("DBG-JALANKAN-LUNAS id=" + id);
    const out = await lunaskanHutang(id);
    if ("error" in out) {
      setPesan(`Gagal (${out.code}): ${out.error}`);
      setPesanOk(false);
      return;
    }
    setPesan("Lunas + tercatat di kas.");
    setPesanOk(true);
    await muat();
  }

  async function jalankanHapus() {
    if (hapusId === null) return;
    const out = await deleteHutang(hapusId);
    setHapusId(null);
    if (typeof out === "object") {
      setPesan(`Gagal (${out.code}): ${out.error}`);
      setPesanOk(false);
      return;
    }
    if (!out) {
      setPesan("Gagal: data tidak ditemukan.");
      setPesanOk(false);
      await muat();
      return;
    }
    setPesan("Catatan dihapus.");
    setPesanOk(true);
    await muat();
  }

  async function toggleRincian(h: Hutang) {
    if (rincianId === h.id) {
      setRincianId(null);
      return;
    }
    setRincianId(h.id);
    setRincianRows(await getCicilan(h.id));
  }

  const data = daftar.filter((h) => tab === "semua" || h.arah === tab);
  const sisa = (h: Hutang) => h.jumlah - h.dibayar;
  const subHutang = data.filter((h) => h.arah === "hutang").reduce((s, h) => s + sisa(h), 0);
  const subPiutang = data.filter((h) => h.arah === "piutang").reduce((s, h) => s + sisa(h), 0);
  const hariIni = tanggalHariIni();
  const bayarH = daftar.find((h) => h.id === bayarId);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-16 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">Hutang</h1>
        <Badge variant="secondary">Offline - Perangkat ini</Badge>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Catat Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={simpan} className="space-y-4">
              <Tabs value={arah} onValueChange={(v) => setArah(v as Arah)}>
                <TabsList id="tab-arah" className="grid w-full grid-cols-2">
                  <TabsTrigger value="hutang">Hutang</TabsTrigger>
                  <TabsTrigger value="piutang">Piutang</TabsTrigger>
                </TabsList>
              </Tabs>
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="pihak">Pihak</label>
                <Input id="pihak" placeholder="contoh: Budi" value={pihak} onChange={(e) => setPihak(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="jml-hutang">Jumlah</label>
                <Input
                  id="jml-hutang"
                  inputMode="numeric"
                  className="text-3xl font-bold"
                  placeholder="contoh: 50000"
                  value={jumlah}
                  onChange={(e) => ketikRp(e.target.value, setJumlah)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="tgl-hutang">Tanggal</label>
                  <Input id="tgl-hutang" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="tempo">Jatuh tempo</label>
                  <Input id="tempo" type="date" value={tempo} onChange={(e) => setTempo(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="ket">Keterangan (opsional)</label>
                <Input id="ket" placeholder="contoh: Pinjam hajatan" value={ket} onChange={(e) => setKet(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={menyimpan}>
                {menyimpan ? "Menyimpan..." : "Catat"}
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
            <TabsList id="tab-daftar-hutang">
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
                  <div className="mt-2 flex flex-wrap gap-2">
                    {h.status === "belum" && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => bukaBayar(h)}>Cicil</Button>
                        <Button size="sm" variant="secondary" onClick={() => jalankanLunas(h.id)}>Lunaskan</Button>
                      </>
                    )}
                    {h.status === "belum" && (
                      <Button size="sm" variant="ghost" onClick={() => setHapusId(h.id)}>Hapus</Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-expanded={rincianId === h.id}
                      onClick={() => toggleRincian(h)}
                    >
                      {rincianId === h.id ? "Tutup rincian" : "Rincian"}
                    </Button>
                  </div>
                  {rincianId === h.id && (
                    <div className="mt-2 space-y-1 rounded-lg border p-2 text-sm">
                      {(() => {
                        const totalTaut = rincianRows.reduce((s, t) => s + Number(t.jumlah), 0);
                        const praFitur = h.dibayar - totalTaut;
                        let jalan = 0;
                        return (
                          <>
                            {praFitur > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Ada Rp{formatRupiah(praFitur)} pembayaran sebelum fitur tanggal (tak tercatat tanggalnya).
                              </p>
                            )}
                            {rincianRows.length === 0 && praFitur <= 0 ? (
                              <p className="text-xs text-muted-foreground">Belum ada cicilan tercatat.</p>
                            ) : (
                              <ul className="space-y-1">
                                {rincianRows.map((t) => {
                                  jalan += Number(t.jumlah);
                                  return (
                                    <li key={t.id} className="flex justify-between gap-2 tabular-nums">
                                      <span>{formatTanggal(t.tanggal)}</span>
                                      <span>Rp{formatRupiah(t.jumlah)}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                            <p className="text-xs text-muted-foreground">
                              tempo {h.jatuhTempo ? formatTanggal(h.jatuhTempo) : "-"} • {h.keterangan || "tanpa keterangan"}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-muted-foreground">
            Sisa hutang: Rp{formatRupiah(subHutang)} - Sisa piutang: Rp{formatRupiah(subPiutang)}
          </p>
        </section>
      </div>

      <Dialog open={bayarId !== null} onOpenChange={(b) => { if (!b) setBayarId(null); }}>
        <DialogContent aria-label="Cicil hutang">
          <DialogHeader>
            <DialogTitle>
              Cicil{bayarH ? `: ${bayarH.pihak} (sisa Rp${formatRupiah(bayarH.jumlah - bayarH.dibayar)})` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="nom-bayar">Nominal cicilan</label>
              <Input id="nom-bayar" inputMode="numeric" placeholder="contoh: 50000" value={bayarNom} onChange={(e) => ketikRp(e.target.value, setBayarNom)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="tgl-bayar">Tanggal cicilan</label>
              <Input id="tgl-bayar" type="date" value={bayarTgl} onChange={(e) => setBayarTgl(e.target.value)} />
            </div>
            {bayarPesan && <p className="text-sm font-semibold text-red-600 dark:text-red-400">{bayarPesan}</p>}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setBayarId(null)}>Batal</Button>
            <Button onClick={jalankanBayar}>Simpan cicilan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={hapusId !== null} onOpenChange={(b) => { if (!b) setHapusId(null); }}>
        <DialogContent aria-label="Hapus hutang">
          <DialogHeader>
            <DialogTitle>Hapus catatan ini?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Yang sudah lunas tidak boleh dihapus (jejak audit).</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setHapusId(null)}>Batal</Button>
            <Button variant="destructive" onClick={jalankanHapus}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
