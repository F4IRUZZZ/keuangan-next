// Verifikasi F1.6: menu Riwayat terpisah — tab Transaksi|Hutang baca-saja.
// Pakai server persisten (SKIP_SPAWN=1, UJI_PORT) — jangan spawn per run.
const { chromium } = require("D:\\Project Developments\\GITHUB\\Webapp Keuangan(Ga Tuntas)\\tools\\uji\\node_modules\\playwright-core");

const PORT = Number(process.env.UJI_PORT || 3003);
const BASE = `http://localhost:${PORT}`;
const hasil = [];
const lapor = (n, ok, d) => {
  hasil.push(ok);
  console.log(`${ok ? "ok: " : "GAGAL: "}${n}${d ? ` — ${d}` : ""}`);
};

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  try {
    // Kosong: empty state kedua tab + nav Riwayat ada
    await page.goto(`${BASE}/riwayat`, { waitUntil: "load", timeout: 120000 });
    await page.waitForFunction(() => /Belum ada transaksi/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    await page.locator("#tab-riwayat").getByRole("tab", { name: /^Hutang/ }).click();
    await page.waitForFunction(() => /Belum ada hutang/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    const navAda = await page.locator('nav a[href="/riwayat"]').count();
    if (navAda < 1) throw new Error("nav Riwayat tak ada");
    lapor("empty state + nav ada", true);
    // Seed 1 transaksi keluar via form
    await page.goto(`${BASE}/transaksi`, { waitUntil: "load", timeout: 120000 });
    await page.locator("#tab-form").getByRole("tab", { name: /^Keluar/ }).click();
    await page.fill("#jml", "16000");
    await page.click("#kombo-kat");
    await page.waitForSelector('[role="listbox"]', { timeout: 8000 });
    await page.fill('input[aria-label="Cari kategori"]', "TesRiw16");
    await page.getByRole("button", { name: '+ Tambah "TesRiw16"' }).click();
    await page.waitForFunction(
      (t) => document.getElementById("kombo-kat")?.textContent?.includes(t),
      "TesRiw16",
      { timeout: 8000 }
    );
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    // Seed 1 hutang via form (arah default = hutang)
    await page.goto(`${BASE}/hutang`, { waitUntil: "load", timeout: 120000 });
    await page.fill("#pihak", "BudiRiw16");
    await page.fill("#jml-hutang", "25000");
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /BudiRiw16 Rp25\.000 tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    // Tab Transaksi: default, isi + hitung
    await page.goto(`${BASE}/riwayat`, { waitUntil: "load", timeout: 120000 });
    const tabAwal = await page.locator("#tab-riwayat").getByRole("tab", { selected: true }).textContent();
    if (!/^Transaksi/.test((tabAwal ?? "").trim())) throw new Error("tab default bukan Transaksi: " + tabAwal);
    await page.waitForFunction(() => /Keluar - TesRiw16/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    await page.waitForFunction(() => /Menampilkan 1 dari 1 catatan/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    lapor("tab Transaksi isi + hitung", true);
    // Tab Hutang: badge + sisa + hitung
    await page.locator("#tab-riwayat").getByRole("tab", { name: /^Hutang/ }).click();
    await page.waitForFunction(() => /BudiRiw16/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    await page.waitForFunction(() => /HUTANG/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    await page.waitForFunction(() => /Sisa Rp25\.000 dari Rp25\.000/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    await page.waitForFunction(() => /Menampilkan 1 dari 1 catatan/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    lapor("tab Hutang isi + hitung", true);
    // Baca-saja: nihil tombol aksi di seluruh halaman
    for (const nama of [/^Ubah$/, /^Hapus$/, /^Cicil$/, /^Lunaskan$/, /^Rincian$/, /Catatan untuk/, /^Simpan$/, /^Tambah$/]) {
      const n = await page.getByRole("button", { name: nama }).count();
      if (n > 0) throw new Error(`tombol aksi lolos: ${nama} x${n}`);
    }
    lapor("nihil tombol aksi", true);
    // Nav menandai Riwayat aktif
    const aktif = await page.locator('nav a[aria-current="page"]', { hasText: "Riwayat" }).count();
    if (aktif < 1) throw new Error("nav tak tandai aktif");
    lapor("nav aktif", true);
    const serius = errs.filter((m) => !/favicon/i.test(m));
    lapor("console bersih", serius.length === 0, serius.slice(0, 2).join(" | "));
  } catch (e) {
    lapor("FATAL", false, String(e.message ?? e).split("\n")[0]);
    process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {});
  }
  console.log(hasil.every(Boolean) ? "F16-ALL-OK" : "F16-GAGAL");
  if (!hasil.every(Boolean)) process.exitCode = 1;
})();
