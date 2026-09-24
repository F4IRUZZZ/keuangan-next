"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Banknote,
  BriefcaseBusiness,
  Car,
  LayoutDashboard,
  Moon,
  Pencil,
  ShoppingCart,
  Sun,
  Tag,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dock, DockIcon } from "@/components/ui/dock";
import { Input } from "@/components/ui/input";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DUMMY_AWAL, rupiah, type Jenis, type Transaksi } from "@/lib/data-dummy";

function IkonKategori({ kategori, jenis }: { kategori: string; jenis: Jenis }) {
  const s = kategori.toLowerCase();
  const Ikon = /makan|minum/.test(s)
    ? UtensilsCrossed
    : /belanja|pasar/.test(s)
      ? ShoppingCart
      : /transport|bensin/.test(s)
        ? Car
        : /gaji|pendapatan|proyek|freelance/.test(s)
          ? BriefcaseBusiness
          : jenis === "masuk"
            ? Banknote
            : Tag;
  return <Ikon className="size-5" />;
}

const CHIPS = [10000, 50000, 100000, 500000];

export default function TransaksiPage() {
  const [daftar, setDaftar] = useState<Transaksi[]>(DUMMY_AWAL);
  const [jenis, setJenis] = useState<Jenis>("masuk");
  const [tab, setTab] = useState("semua");
  const [gelap, setGelap] = useState(false);
  const [nominal, setNominal] = useState("");
  const [kategori, setKategori] = useState("");
  const [catatan, setCatatan] = useState("");

  function gantiTema() {
    setGelap((g) => {
      document.documentElement.classList.toggle("dark", !g);
      return !g;
    });
  }

  const tampil = useMemo(
    () => daftar.filter((t) => tab === "semua" || t.jenis === tab),
    [daftar, tab]
  );
  const masuk = daftar.filter((t) => t.jenis === "masuk").reduce((s, t) => s + t.jumlah, 0);
  const keluar = daftar.filter((t) => t.jenis === "keluar").reduce((s, t) => s + t.jumlah, 0);
  const nMasuk = daftar.filter((t) => t.jenis === "masuk").length;
  const nKeluar = daftar.length - nMasuk;

  function simpan(e: React.FormEvent) {
    e.preventDefault();
    const jumlah = Number(String(nominal).replace(/[^0-9]/g, "")) || 0;
    if (!(jumlah > 0)) return;
    setDaftar((d) => [
      {
        id: Math.max(...d.map((x) => x.id)) + 1,
        jenis,
        judul: catatan.trim() || `${jenis === "masuk" ? "Masuk" : "Keluar"} • ${kategori.trim() || "Lainnya"}`,
        kategori: jenis === "keluar" ? kategori.trim() || "Lainnya" : "Lainnya",
        tanggal: "2026-09-24",
        jumlah,
      },
      ...d,
    ]);
    setNominal("");
    setCatatan("");
    setKategori("");
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-32 md:p-8">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Keuangan <span className="mx-1">/</span>{" "}
          <span className="font-semibold text-foreground">Transaksi</span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">Catat &amp; Kelola Transaksi</h1>
          <Badge variant="secondary">Offline • Perangkat ini</Badge>
          <Button variant="ghost" size="icon" onClick={gantiTema} aria-label="Ganti tema">
            {gelap ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Masuk (Demo)</p>
              <p className="text-2xl font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                Rp<NumberTicker value={masuk} />
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Keluar (Demo)</p>
              <p className="text-2xl font-bold text-red-600 tabular-nums dark:text-red-400">
                Rp<NumberTicker value={keluar} />
              </p>
            </CardContent>
          </Card>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Catat Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={simpan} className="space-y-4">
              <Tabs value={jenis} onValueChange={(v) => setJenis(v as Jenis)}>
                <TabsList className="grid w-full grid-cols-2">
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
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                  />
                  <datalist id="saran-kat">
                    <option value="Makan & Minum" />
                    <option value="Belanja" />
                    <option value="Transport" />
                  </datalist>
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="ctt">Catatan (opsional)</label>
                <Input id="ctt" placeholder="contoh: Gajian minggu ini" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" size="lg">Simpan Transaksi</Button>
            </form>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="semua">Semua ({daftar.length})</TabsTrigger>
              <TabsTrigger value="masuk">Masuk ({nMasuk})</TabsTrigger>
              <TabsTrigger value="keluar">Keluar ({nKeluar})</TabsTrigger>
            </TabsList>
          </Tabs>
          <ul className="space-y-2">
            {tampil.map((t) => (
              <li key={t.id}>
                <Card>
                  <CardContent className="flex items-center gap-3 py-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <IkonKategori kategori={t.kategori} jenis={t.jenis} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <Badge variant={t.jenis === "masuk" ? "default" : "destructive"}>
                          {t.jenis === "masuk" ? "MASUK" : "KELUAR"}
                        </Badge>
                        <strong className="truncate">{t.judul}</strong>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {t.kategori} • {t.tanggal}
                      </span>
                    </span>
                    <strong className={`flex items-center gap-1 whitespace-nowrap text-xl tabular-nums ${t.jenis === "masuk" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {t.jenis === "masuk" ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
                      {rupiah(t.jumlah)}
                    </strong>
                    <Button variant="ghost" size="icon" aria-label="Ubah"><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" aria-label="Hapus"><Trash2 className="size-4" /></Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Selisih: <strong className="text-foreground">{rupiah(masuk - keluar)}</strong> • Menampilkan {tampil.length} dari {daftar.length} catatan
          </p>
        </section>
      </div>

      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        <Dock>
          <DockIcon aria-label="Dashboard"><LayoutDashboard className="size-5" /></DockIcon>
          <DockIcon aria-label="Transaksi"><ArrowDown className="size-5" /></DockIcon>
          <DockIcon aria-label="Produk"><Banknote className="size-5" /></DockIcon>
        </Dock>
      </div>
    </main>
  );
}
