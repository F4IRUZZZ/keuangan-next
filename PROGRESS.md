# Progress — Rewrite Next.js Keuangan Keluarga (opsi B)

> Proyek aktif. App vanilla = arsip beku (39 commit, `main` repo lama).
> Aturan: 1 fitur = 1 Issue + 1 PR + uji hijau. Auth = Fase B5 (setelah B4).

## Legenda
- [x] selesai + teruji + termerge · [ ] belum · [~] jalan sekarang

## A. Fondasi eksperimen (selesai)
- [x] C2: scaffold Next 16 + Tailwind + shadcn + dock/number-ticker + build hijau
- [x] C3: halaman transaksi dummy terang/gelap + banding vs vanilla
- [x] Struktur rapi: bukti/ gitignore, tools-uji/, README ringkas

## B. Rewrite
### B1 — Data + 5 halaman baca (selesai)
- [x] lib/db-lokal.ts (kontrak = vanilla) + window guard
- [x] Dashboard + grafik, Transaksi, Produk, Hutang, Pengaturan (CSV/backup/restore/reset)
- [x] Migrasi backup vanilla → angka identik (B1-ALL-OK + 5 screenshot)

### B2 — Form tulis
- [x] B2.1: form transaksi → db + validasi (B21-ALL-OK)
- [x] B2.2: bulk + format live + Dialog ubah/hapus (B22-ALL-OK, PR #2)
- [~] B2.2b: chips +0/+00 + format otomatis chips (PR #4, uji 6/6 hijau)
- [ ] B2.3: hutang tulis + produk CRUD
- [ ] B2.4: validasi UX + uji gabungan + screenshot

### B3 — Offline PWA + hosting (Vercel dikunci)
- [ ] output export + SW manual + serve out/
- [ ] Deploy Vercel Hobby (HTTPS) + install PWA + mode pesawat HP
- [ ] Migrasi backup JSON + matikan SnapDeploy/TiDB (bila yakin)

### B4 — Paritas + ganti
- [ ] Palet, breadcrumb, dark toggle, koma-titik id-ID, font Geist
- [ ] Uji paritas 1:1 vs vanilla + arsip vanilla (tag pra-next)

### B5 — Auth Google + data bersama (NANTI, desain dulu)
- [ ] Desain: aturan milik + konflik offline + gabung data lokal
- [ ] Opsi terpilih: Supabase (rekomendasi) — diputuskan saat B5 dibuka
- [ ] Implementasi + migrasi + uji (estimasi 2–4 sesi)

## C. Backlog (ditunda sadar)
- [ ] Vanilla: DompetKu-3/4, push 39 commit, HP fisik, onboarding
- [ ] Next: Dialog konfirmasi cantik (sementara confirm())

## D. Arsip vanilla (beku, hanya dibaca)
- Fase 0–4, M1–M4, DompetKu-1/2, TxFull-1–4, SW v12, uji 16/16 — detail:
  repo lama `planning-webapp-keuangan.md` + cabang `arsip-server-v1`
