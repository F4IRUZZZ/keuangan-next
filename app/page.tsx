"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Chart } from "chart.js/auto";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatRupiah,
  formatTanggal,
  getRingkasanKategori,
  getSaldo,
  getTransaksi,
  kategoriOf,
  muatSemuaCatatan,
  segarkanCacheProduk,
  type Catatan,
  type RingkasKat,
  type Saldo,
  type Transaksi,
} from "@/lib/db-lokal";
import { akhirBulanIni, akhirMingguIni, awalBulanIni, awalMingguIni } from "@/lib/periode";

type Periode = "semua" | "minggu" | "bulan";

const NAMA_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const LABEL_PERIODE: Record<Periode, string> = {
  semua: "Semua Waktu",
  minggu: "Minggu Ini",
  bulan: "Bulan Ini",
};

// '2026-09-22' -> indeks Senin=0..Minggu=6 (Date lokal, bukan UTC).
function indeksHari(tanggal: string): number {
  const p = String(tanggal).split("-");
  const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  return (d.getDay() + 6) % 7;
}

function judul(t: Transaksi, notes: Catatan[]): string {
  const n = notes.find((c) => c.transaksiId === t.id);
  if (n?.isi) return n.isi;
  return `${t.jenis === "masuk" ? "Masuk" : "Keluar"} - ${kategoriOf(t)}`;
}

export default function Dashboard() {
  const [periode, setPeriode] = useState<Periode>("semua");
  const [tabGrafik, setTabGrafik] = useState("arus");
  const [saldo, setSaldo] = useState<Saldo>({ masuk: 0, keluar: 0, saldo: 0 });
  const [kat, setKat] = useState<RingkasKat[]>([]);
  const [riwayat, setRiwayat] = useState<Transaksi[]>([]);
  const [notes, setNotes] = useState<Catatan[]>([]);
  const [minggu, setMinggu] = useState<{ masuk: number[]; keluar: number[] }>({
    masuk: [0, 0, 0, 0, 0, 0, 0],
    keluar: [0, 0, 0, 0, 0, 0, 0],
  });
  const refArus = useRef<HTMLCanvasElement>(null);
  const refMinggu = useRef<HTMLCanvasElement>(null);
  const refDonat = useRef<HTMLCanvasElement>(null);
  const charts = useRef<Chart[]>([]);

  useEffect(() => {
    let batal = false;
    (async () => {
      const filter =
        periode === "minggu"
          ? { dari: awalMingguIni(), sampai: akhirMingguIni() }
          : periode === "bulan"
            ? { dari: awalBulanIni(), sampai: akhirBulanIni() }
            : undefined;
      const [s, k, daftar, n] = await Promise.all([
        getSaldo(filter),
        getRingkasanKategori(filter),
        getTransaksi(),
        muatSemuaCatatan(),
      ]);
      await segarkanCacheProduk();
      if (batal) return;
      setSaldo(s);
      setKat(k);
      setNotes(n);
      // Agregat mingguan: per nama hari dalam filter periode aktif.
      const mH = [0, 0, 0, 0, 0, 0, 0];
      const kH = [0, 0, 0, 0, 0, 0, 0];
      for (const t of daftar) {
        if (filter?.dari && t.tanggal < filter.dari) continue;
        if (filter?.sampai && t.tanggal > filter.sampai) continue;
        const i = indeksHari(t.tanggal);
        if (t.jenis === "masuk") mH[i] += t.jumlah;
        else kH[i] += t.jumlah;
      }
      setMinggu({ masuk: mH, keluar: kH });
      const urut = daftar
        .slice()
        .sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : b.id - a.id))
        .slice(0, 5);
      setRiwayat(urut);
    })();
    return () => {
      batal = true;
    };
  }, [periode]);

  useEffect(() => {
    charts.current.forEach((c) => c.destroy());
    charts.current = [];
    if (saldo.masuk === 0 && saldo.keluar === 0) return;
    if (typeof window === "undefined") return;
    const gelap = document.documentElement.classList.contains("dark");
    const ticks = gelap ? "#93a89e" : "#6b7280";
    // Tooltip Rp (semantik = vanilla): bar parsed={x,y}, donat parsed=angka.
    const labelRp = (c: { parsed: { y?: unknown } | number | null }) => {
      const p = c.parsed;
      const angka = typeof p === "number" ? p : Number(p?.y ?? 0);
      return ` Rp${formatRupiah(angka)}`;
    };
    if (refArus.current)
      charts.current.push(
        new Chart(refArus.current, {
          type: "bar",
          data: {
            labels: ["Masuk", "Keluar"],
            datasets: [{ data: [saldo.masuk, saldo.keluar], backgroundColor: ["#059669", "#dc2626"], borderRadius: 8 }],
          },
          options: {
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: labelRp } } },
            scales: { y: { beginAtZero: true, ticks: { color: ticks } }, x: { ticks: { color: ticks } } },
          },
        })
      );
    // Grafik mingguan: selalu digambar (kosong = batang nol, bukan error).
    if (refMinggu.current)
      charts.current.push(
        new Chart(refMinggu.current, {
          type: "bar",
          data: {
            labels: NAMA_HARI,
            datasets: [
              { label: "Masuk", data: minggu.masuk, backgroundColor: "#059669", borderRadius: 6 },
              { label: "Keluar", data: minggu.keluar, backgroundColor: "#dc2626", borderRadius: 6 },
            ],
          },
          options: {
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "bottom", labels: { color: ticks, boxWidth: 12 } },
              tooltip: { callbacks: { label: labelRp } },
            },
            scales: { y: { beginAtZero: true, ticks: { color: ticks } }, x: { ticks: { color: ticks } } },
          },
        })
      );
    if (refDonat.current && kat.length > 0)
      charts.current.push(
        new Chart(refDonat.current, {
          type: "doughnut",
          data: {
            labels: kat.map((r) => r.kategori),
            datasets: [{ data: kat.map((r) => r.total), backgroundColor: ["#059669", "#10b981", "#34d399", "#f59e0b", "#3b82f6"] }],
          },
          options: {
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "bottom" },
              tooltip: { callbacks: { label: labelRp } },
            },
          },
        })
      );
    return () => {
      charts.current.forEach((c) => c.destroy());
      charts.current = [];
    };
  }, [saldo, kat, minggu, tabGrafik]);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-16 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Badge variant="secondary">Offline • Perangkat ini</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total masuk</p>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
              Rp<NumberTicker value={saldo.masuk} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total keluar</p>
            <p className="text-2xl font-bold text-red-600 tabular-nums dark:text-red-400">
              Rp<NumberTicker value={saldo.keluar} />
            </p>
          </CardContent>
        </Card>
      </div>
      <Card className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white dark:from-emerald-800 dark:to-emerald-950">
        <CardContent className="pt-4">
          <p className="text-sm opacity-85">Saldo</p>
          <p className={`text-4xl font-bold tabular-nums${saldo.saldo < 0 ? " text-red-200" : ""}`}>
            Rp<NumberTicker value={saldo.saldo} />
          </p>
          <p className="text-sm opacity-85">{LABEL_PERIODE[periode]}</p>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Link className={buttonVariants({ variant: "default" })} href="/transaksi?jenis=masuk">+ Masuk</Link>
        <Link className={buttonVariants({ variant: "secondary" })} href="/transaksi?jenis=keluar">+ Keluar</Link>
        <Link className={buttonVariants({ variant: "outline" })} href="/hutang">Bayar Hutang</Link>
      </div>
      <div className="flex gap-2">
        {(["semua", "minggu", "bulan"] as Periode[]).map((p) => (
          <Button key={p} variant={periode === p ? "default" : "secondary"} onClick={() => setPeriode(p)}>
            {p === "semua" ? "Semua Waktu" : p === "minggu" ? "Minggu Ini" : "Bulan Ini"}
          </Button>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Keluar per Kategori</CardTitle></CardHeader>
        <CardContent>
          {kat.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada pengeluaran pada periode ini.</p>
          ) : (
            <ul className="space-y-2">
              {kat.map((r) => (
                <li key={r.kategori} className="flex justify-between text-sm">
                  <span>{r.kategori}</span>
                  <span className="tabular-nums">Rp{formatRupiah(r.total)} ({r.persen}%)</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      {saldo.masuk === 0 && saldo.keluar === 0 ? (
        <p className="text-sm text-muted-foreground">Silakan input data terlebih dahulu untuk menampilkan grafik.</p>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <Tabs value={tabGrafik} onValueChange={setTabGrafik}>
              <TabsList aria-label="Pilih grafik">
                <TabsTrigger value="arus">Arus</TabsTrigger>
                <TabsTrigger value="minggu">Mingguan</TabsTrigger>
                <TabsTrigger value="kategori">Kategori</TabsTrigger>
              </TabsList>
              <TabsContent value="arus">
                <div className="h-64">
                  <canvas id="grafik-arus" ref={refArus} height={220} />
                </div>
              </TabsContent>
              <TabsContent value="minggu">
                <div className="h-64">
                  <canvas id="grafik-minggu" ref={refMinggu} height={220} aria-label="Grafik batang pemasukan dan pengeluaran per hari Senin sampai Minggu" />
                </div>
              </TabsContent>
              <TabsContent value="kategori">
                {kat.length > 0 ? (
                  <div className="mx-auto h-64 w-full max-w-[560px]">
                    <canvas id="grafik-kategori" ref={refDonat} height={220} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Belum ada pengeluaran pada periode ini.</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle>Terakhir dicatat</CardTitle></CardHeader>
        <CardContent>
          {riwayat.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
          ) : (
            <ul className="space-y-2">
              {riwayat.map((t) => (
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
          )}
        </CardContent>
      </Card>
      <p><Link className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400" href="/transaksi">Lihat semua →</Link></p>
    </main>
  );
}
