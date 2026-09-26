// Verifikasi M1 audit: storage penuh -> pesan gagal eksplisit (bukan sukses diam).
// Caranya: matikan IndexedDB (paksa jalur localStorage) + penuhi kuota,
// lalu submit form -> pesan "penyimpanan perangkat penuh".
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
  const ctx = await browser.newContext();
  // Paksa jalur localStorage: IndexedDB dibuat tak tersedia sejak awal.
  // Paksa jalur localStorage + simulasi kuota penuh secara deterministik
  // (isi kuota beneran bisa GB-an di Chromium; override setItem setara).
  await ctx.addInitScript(() => {
    try {
      delete window.indexedDB;
    } catch {
      Object.defineProperty(window, "indexedDB", { value: undefined });
    }
    window.Storage.prototype.setItem = function () {
      throw new DOMException("simulasi kuota penuh", "QuotaExceededError");
    };
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  try {
    await page.goto(`${BASE}/transaksi`, { waitUntil: "load", timeout: 120000 });
    await page.locator("#tab-form").getByRole("tab", { name: /^Masuk/ }).click();
    await page.fill("#jml", "1000");
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /penyimpanan perangkat penuh/.test(document.body.textContent ?? ""), null, { timeout: 15000 });
    lapor("gagal simpan eksplisit", true);
    // Tanpa unhandled rejection (console bersih dari TypeError/QuotaExceeded mentah)
    const serius = errs.filter((m) => !/favicon/i.test(m));
    lapor("console bersih", serius.length === 0, serius.slice(0, 2).join(" | "));
  } catch (e) {
    lapor("FATAL", false, String(e.message ?? e).split("\n")[0]);
    process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {});
  }
  console.log(hasil.every(Boolean) ? "F32-ALL-OK" : "F32-GAGAL");
  if (!hasil.every(Boolean)) process.exitCode = 1;
})();
