# FamVault (rewrite Next.js — opsi B)

Rewrite Next.js + shadcn dari app vanilla `Webapp Keuangan` (offline-first,
tanpa server). App vanilla tetap acuan uji (arsip beku).

## Jalan

```powershell
npm install
npm run dev        # http://localhost:3000
```

## Uji (butuh server di atas jalan)

```powershell
$env:SKIP_SPAWN="1"; $env:UJI_PORT="3000"; node tools-uji/verify-b22.js
```

Skrip: `tools-uji/` (`verify-*` per fase + `shot-*`/`cek-*` sekali-pakai yang dipertahankan).
Bukti screenshot: `bukti/` (di-gitignore). Pola: 1 server persisten per sesi
(`Start-Job` + poll + kill pohon proses tiap selesai) — jangan spawn per run.
