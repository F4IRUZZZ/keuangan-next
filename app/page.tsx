"use client";

import { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";
import {
  formatRupiah,
  formatTanggal,
  getRingkasanKategori,
  getSaldo,
  getTransaksi,
  kategoriOf,
  segarkanCacheProduk,
  type RingkasKat,
  type Saldo,
  type Transaksi,
} from "@/lib/db-lokal";
import { akhirBulanIni, akhirMingguIni, awalBulanIni, awalMingguIni } from "@/lib/periode";

type Periode = "semua" | "minggu" | "bulan";

export default function Dashboard() {
  const [periode, setPeriode] = useState<Periode>("semua");
  const [saldo, setSaldo] = useState<Saldo>({ masuk: 0, keluar: 0, saldo: 0 });
  const [kat, setKat] = useState<RingkasKat[]>([]);
  const [riwayat, setRiwayat] = useState<Transaksi[]>([]);
  const refArus = useRef<HTMLCanvasElement>(null);
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
      const [s, k, daftar] = await Promise.all([
        getSaldo(filter),
        getRingkasanKategori(filter),
        getTransaksi(),
      ]);
      await segarkanCacheProduk();
      if (batal) return;
      setSaldo(s);
      setKat(k);
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
    if (refArus.current)
      charts.current.push(
        new Chart(refArus.current, {
          type: "bar",
          data: {
            labels: ["Masuk", "Keluar"],
            datasets: [{ data: [saldo.masuk, saldo.keluar], backgroundColor: ["#059669", "#dc2626"], borderRadius: 8 }],
          },
          options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { color: ticks } }, x: { ticks: { color: ticks } } } },
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
          options: { plugins: { legend: { position: "bottom" } } },
        })
      );
    return () => {
      charts.current.forEach((c) => c.destroy());
      charts.current = [];
    };
  }, [saldo, kat]);

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
      <Card className="bg-emerald-700 text-white dark:bg-emerald-900">
        <CardContent className="pt-4">
          <p className="text-sm opacity-85">Saldo</p>
          <p className="text-4xl font-bold tabular-nums">
            Rp<NumberTicker value={saldo.saldo} />
          </p>
        </CardContent>
      </Card>
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
        <div className="grid gap-6 md:grid-cols-2">
          <Card><CardContent className="pt-4"><canvas ref={refArus} height={220} /></CardContent></Card>
          {kat.length > 0 && (
            <Card><CardContent className="pt-4"><canvas ref={refDonat} height={220} /></CardContent></Card>
          )}
        </div>
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
                  <span className="min-w-0 flex-1 truncate">
                    {kategoriOf(t)} • {formatTanggal(t.tanggal)}
                  </span>
                  <strong className="tabular-nums">Rp{formatRupiah(t.jumlah)}</strong>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
