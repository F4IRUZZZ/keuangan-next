// Verifikasi B1: restore backup vanilla -> banding angka -> screenshot 5 rute.
const { spawn } = require("child_process");
const path = require("path");
const { chromium } = require("D:\\Project Developments\\GITHUB\\Webapp Keuangan(Ga Tuntas)\\tools\\uji\\node_modules\\playwright-core");

const PORT = 3002;
const BASE = `http://localhost:${PORT}`;
const BACKUP = "D:\\Project Developments\\GITHUB\\Webapp Keuangan(Ga Tuntas)\\migrasi\\backup-server.json";
const hasil = [];
const lapor = (n, ok, d) => {
  hasil.push(ok);
  console.log(`${ok ? "ok: " : "GAGAL: "}${n}${d ? ` — ${d}` : ""}`);
};

(async () => {
  // Server bawa-sendiri bila SKIP_SPAWN=1 (mis. next start produksi).
  // Pola pelajaran: spawn job yatim — matikan via taskkill /T.
  let srv = null;
  if (process.env.SKIP_SPAWN !== "1") {
    srv = spawn("npm", ["run", "dev", "--", "--port", String(PORT)], { cwd: __dirname + "\\..", shell: true });
  }
  const t0 = Date.now();
  for (;;) {
    try {
      const r = await fetch(`${BASE}/`);
      if (r.status === 200) break;
    } catch {}
    if (Date.now() - t0 > 120000) throw new Error("dev tak hidup");
    await new Promise((s) => setTimeout(s, 1000));
  }
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  try {
    // Restore backup vanilla
    await page.goto(`${BASE}/pengaturan`, { waitUntil: "load", timeout: 120000 });
    await page.setInputFiles("#file-restore", BACKUP);
    await page.waitForFunction(
      () => /Restore sukses: 1 transaksi, 0 hutang, 7 produk/.test(document.body.textContent ?? ""),
      null,
      { timeout: 15000 }
    );
    lapor("restore backup vanilla", true);
    // Banding angka
    await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 60000 });
    await page.waitForFunction(() => /Rp300\.000/.test(document.body.textContent ?? ""), null, { timeout: 15000 });
    lapor("saldo Rp300.000 cocok", true);
    await page.goto(`${BASE}/produk`, { waitUntil: "load", timeout: 60000 });
    await page.waitForFunction(() => document.querySelectorAll("li").length >= 7, null, { timeout: 15000 });
    const nProduk = await page.$$eval("li", (rs) => rs.length);
    if (nProduk !== 7) throw new Error(`produk=${nProduk}`);
    lapor("7 produk tampil", true);
    await page.goto(`${BASE}/transaksi`, { waitUntil: "load", timeout: 60000 });
    await page.waitForFunction(() => /Uang Belanja/.test(document.body.textContent ?? ""), null, { timeout: 15000 });
    lapor("catatan tampil", true);
    // Screenshot 5 rute
    for (const [nama, url] of [["dash", "/"], ["trx", "/transaksi"], ["prd", "/produk"], ["htg", "/hutang"], ["set", "/pengaturan"]]) {
      await page.goto(`${BASE}${url}`, { waitUntil: "load", timeout: 60000 });
      await page.waitForTimeout(800);
      await page.screenshot({ path: `bukti/bukti-b1-${nama}.png` });
    }
    lapor("screenshot 5 rute", true);
    const serius = errs.filter((m) => !/favicon/i.test(m));
    lapor("console bersih", serius.length === 0, serius.slice(0, 2).join(" | "));
  } catch (e) {
    lapor("FATAL", false, String(e.message ?? e).split("\n")[0]);
    process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {});
    if (srv) srv.kill();
  }
  console.log(hasil.every(Boolean) ? "B1-ALL-OK" : "B1-GAGAL");
  if (!hasil.every(Boolean)) process.exitCode = 1;
})();
