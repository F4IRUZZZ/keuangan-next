# Progress — Rewrite Next.js Keuangan Keluarga (opsi B)

> Proyek aktif. App vanilla = arsip beku (39 commit, `main` repo lama).
> Aturan: 1 fitur = 1 Issue + 1 PR + uji hijau.
> **Urutan disepakati: F1 logika/fitur → F2 desain/layout → F3 hosting/HP → F4 OAuth.**

## Legenda

- [X] selesai + teruji + termerge · [ ] belum · [~] jalan sekarang

## A. Fondasi eksperimen (selesai)

- [X] C2: scaffold Next 16 + Tailwind + shadcn + dock/number-ticker + build hijau
- [X] C3: halaman transaksi dummy terang/gelap + banding vs vanilla
- [X] Struktur rapi: bukti/ gitignore, tools-uji/, README ringkas

## B. Rewrite

### B1 — Data + 5 halaman baca (selesai)

- [X] lib/db-lokal.ts (kontrak = vanilla) + window guard
- [X] Dashboard + grafik, Transaksi, Produk, Hutang, Pengaturan (CSV/backup/restore/reset)
- [X] Migrasi backup vanilla → angka identik (B1-ALL-OK + 5 screenshot)

### B2 — Form tulis

- [X] B2.1: form transaksi → db + validasi (B21-ALL-OK)
- [X] B2.2: bulk + format live + Dialog ubah/hapus (B22-ALL-OK, PR #2)

- [x] B2.2b: chips +00/+000 + format otomatis chips (PR #4 merged)

## F1 — Logika & fitur sampai paritas (JALAN SEKARANG)

- [x] F1.1: catatan inline per transaksi (PR #6 merged)
- [x] F1.2: limit harian + setting + mini-stat bulan + preset ?jenis + reset + filter Hari/Bulan + CSV toolbar + footer hitung + pilih-semua toolbar + Dialog bulk (PR #8 merged)
- [x] F1.3: hutang tulis/bayar/lunas/hapus + progress + tempo + badge arah + Dialog Zona Bahaya + search toggle (PR #10 + #12 merged)
- [x] F1.3b: tanggal cicilan bisa diatur + tombol Rincian + tanggal dd/mm/yyyy + label Cicil (PR #14 merged)
- [x] F1.4: produk CRUD + hitung pakai + dropdown kategori custom (PR #16 merged)
- [x] F1.5: dashboard riwayat ringkas + grafik mingguan (PR #18 merged)
- [x] F1.6: menu Riwayat terpisah (tab Transaksi | Hutang, baca-saja; dashboard tetap 5 + link) (PR #28 merged)

- Kriteria: semua skenario vanilla lolos di `:3000`.

## F2 — Desain & layout belakangan

- [x] F2.0 (pertama): sidebar kiri + logo FamVault pojok kiri atas (desktop; HP tetap bottom-nav tanpa logo) + logo di manifest/favicon (PR #31 merged)
- [x] F2.1: dock final (hapus demo) + hero ala vanilla + polish gelap + audit spacing + angka ticker warisi warna (PR #33 merged)
- [x] F2.2: palet warning/info + segmen tema Sistem|Terang|Gelap + koma-titik id-ID (breadcrumb SKIP, Geist verifikasi) (PR #35 merged)
- [x] F2.3: paritas visual vs vanilla + mini-bar kategori + judul emerald (T3/T4 backlog) (PR #37 merged)
- [x] F2.4: tombol aksi jadi ikon + logo transparan gelap (T4 tombol-ikon selesai) (PR #39 merged)

- Kriteria: nilai berdampingan vs referensi DompetKu.

## F3 — Hosting + HP

- [x] F3.1: output export + SW manual famvault-v1 + uji pesawat desktop (PR #45 merged)
- [ ] Deploy Vercel Hobby (HTTPS) + install PWA + mode pesawat HP
- [ ] Migrasi backup JSON + matikan SnapDeploy/TiDB (bila yakin)

## F4 — OAuth Google + data bersama (NANTI, desain dulu)

- [ ] Desain: aturan milik + konflik offline + gabung data lokal
- [ ] Opsi terpilih: Supabase (rekomendasi) — diputuskan saat F4 dibuka
- [ ] Implementasi + migrasi + uji (estimasi 2–4 sesi)

## C. Backlog (ditunda sadar)

- [ ] Vanilla: DompetKu-3/4, push 39 commit, HP fisik, onboarding
- [ ] Next: Dialog konfirmasi cantik (sementara confirm())
- [ ] Next (temuan paritas F2.3): command palette Cari/aksi Ctrl+K ala vanilla (fase sendiri)
- [ ] Next (temuan paritas F2.3): set ikon kategori baris transaksi ala vanilla (fase sendiri; tombol-ikon selesai di F2.4)

## D. Arsip vanilla (beku, hanya dibaca)

- Fase 0–4, M1–M4, DompetKu-1/2, TxFull-1–4, SW v12, uji 16/16 — detail:
  repo lama `planning-webapp-keuangan.md` + cabang `arsip-server-v1`

## E. Antrean Usulan (usulan tengah jalan — dinilai dulu, baru dicatat)

> Alur: usul kapan saja → saya bedah dampak vs fase berjalan →
> DITERIMA (masuk fase sebagai item baru) atau DITOLAK beralasan
> (tetap tercatat, bisa dibuka lagi). Darurat: nyatakan eksplisit.

_Belum ada usulan._

## F. Riwayat Perubahan (per PR/commit fitur, terbaru di atas)

| Tanggal | Perubahan | Uji | PR |
|---|---|---|---|
| 2026-09-27 | F3.1 merged: static export + SW + offline desktop | F31 6/6, F15/F20 ALL-OK, tsc, build | #45 |
| 2026-09-27 | F1.5d merged: default Minggu Ini + placeholder kecil | F15/F22/B1 ALL-OK, tsc, build | #43 |
| 2026-09-27 | Fix overflow HP: grid blowout form transaksi | pra doc=523 -> pasca 415, audit 18 kombinasi NOL-LUBER, B22/F13 ALL-OK | #41 |
| 2026-09-27 | F2.4 merged: tombol ikon + logo transparan | 8 suite ALL-OK, tsc, build | #39 |
| 2026-09-27 | F2.3 merged: 16 shot paritas + mini-bar + judul emerald | F15/F16/F20/F22 ALL-OK, tsc, build | #37 |
| 2026-09-27 | F2.2 merged: warning/info + segmen tema + id-ID + badge amber | F22 10/10, F15/F16/F20 ALL-OK, tsc, build | #35 |
| 2026-09-27 | F2.1 merged: hapus Dock/demo + radius 16px + token gelap emerald + hero vanilla + ticker warisi warna | matriks 12 shot 2 tema, F15/F16/F20 ALL-OK, tsc, build | #33 |
| 2026-09-27 | F2.0 merged: sidebar w-60 + logo FamVault + manifest + favicon | F20 4/4, F15/F16 ALL-OK, tsc, build | #31 |
| 2026-09-27 | Fix nav: Riwayat pindah ke kiri Pengaturan | F16 ALL-OK, tsc | #29 |
| 2026-09-27 | F1.6 merged: menu Riwayat (tab Transaksi\|Hutang baca-saja) + nav 6 item | F16 6/6, F15 ALL-OK, tsc, build | #28 |
| 2026-09-27 | F1.5c merged: kunci tinggi chart h-64 (dari ~540px) | screenshot 1056x256, F15 ALL-OK, tsc | #26 |
| 2026-09-27 | F1.5b merged: 3 grafik jadi 1 frame 3 tab (Arus\|Mingguan\|Kategori) | F15 9/9, screenshot 3 tab, tsc | #24 |
| 2026-09-27 | Fix tooltip RpNaN: parsed.y (semantik vanilla) | screenshot hover Rp45.000, F15 ALL-OK, tsc | #22 |
| 2026-09-27 | Fix donat kebesaran: batasi 560px tengah (paritas vanilla) | screenshot 528px, F15 ALL-OK, tsc | #20 |
| 2026-09-27 | F1.5 merged: grafik mingguan + aksi cepat + label periode + riwayat catatan + saldo-minus | F15 9/9, F11/B22/F13/F14 ALL-OK, tsc, build | #18 |
| 2026-09-25 | F1.4 merged: produk CRUD + hitung pakai + dropdown kategori custom | F14 6/6, B22 ALL-OK, F13 hijau, tsc, build | #16 |
| 2026-09-25 | F1.3b merged: cicilan bertanggal + Rincian + dd/mm/yyyy + Cicil | F13 hijau, tsc | #14 |
| 2026-09-25 | F1.3 merged: hutang tulis + Dialog Zona Bahaya + search toggle + badge arah + fix hitung tab | B22 14/14, F13 10/10, tsc, build | #10, #12 |
| 2026-09-25 | F1.2 merged: sisa fitur transaksi + pilih-semua toolbar + Dialog bulk | B22 11/11, tsc, build | #8 |
| 2026-09-25 | F1.1 merged: Dialog catatan inline per transaksi | F11 4/4, tsc, build | #6 |
| 2026-09-25 | B2.2b merged: chips +00/+000 + nav bawah + font Geist | B22 6/6, viewport, tsc, build | #4 |
| 2026-09-25 | Rapikan PROGRESS (B2.3/B2.4 pindah F1, samakan checkbox) + phasing F1–F4 | - (docs) | - |
| 2026-09-25 | Nav bawah HP/tablet + font Geist + padding konten | viewport 390/1280, console bersih | #4 |
| 2026-09-25 | B2.2b chips +0/+00→+00/+000 + format 1 pintu | B22 6/6, tsc, build | #4 |
| 2026-09-25 | PROGRESS.md dibuat (status + B5 + backlog) | - (docs) | - |
| 2026-09-25 | B2.2 bulk + format live + Dialog ubah/hapus | B22 5/5, tsc, build | #2 |
| 2026-09-25 | Rapikan struktur (bukti/, tools-uji/, README) | verify-b22 hijau pasca-rename | - |
| 2026-09-25 | B2.1 form transaksi → db + validasi | B21 4/4 | - |
| 2026-09-24 | B1 port db-lokal TS + 5 halaman baca + migrasi backup identik | B1-ALL-OK, 5 screenshot | - |
| 2026-09-24 | C3 halaman transaksi dummy + banding vs vanilla | screenshot terang/gelap | - |
| 2026-09-24 | C2 scaffold Next + shadcn + dock/number-ticker | tsc + build | - |
