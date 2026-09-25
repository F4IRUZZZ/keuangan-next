# Keuangan Next (eksperimen rewrite — opsi B)

Rewrite Next.js + shadcn dari app vanilla `Webapp Keuangan` (offline-first,
tanpa server). Status: fase B2 (form tulis). App vanilla tetap acuan uji.

## Jalan

```powershell
npm install
npm run dev        # http://localhost:3000
```

## Uji (butuh server di atas jalan)

```powershell
$env:SKIP_SPAWN="1"; $env:UJI_PORT="3000"; node tools-uji/verify-b22.js
```

Skrip: `tools-uji/` (banding, shot, verify-b1/b21/b22). Bukti screenshot: `bukti/`
(di-gitignore). Pola: 1 server persisten per sesi, matikan pohon proses
(`taskkill /T`) tiap selesai — jangan spawn per run.
