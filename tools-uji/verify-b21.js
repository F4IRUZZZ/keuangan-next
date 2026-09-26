// Verifikasi B2.1: tulis via form transaksi Next -> db-lokal.
const { spawn } = require("child_process");
const { chromium } = require("D:\\Project Developments\\GITHUB\\Webapp Keuangan(Ga Tuntas)\\tools\\uji\\node_modules\\playwright-core");

const PORT = Number(process.env.UJI_PORT || 3003);
const BASE = `http://localhost:${PORT}`;
const hasil = [];
const lapor = (n, ok, d) => {
  hasil.push(ok);
  console.log(`${ok ? "ok: " : "GAGAL: "}${n}${d ? ` — ${d}` : ""}`);
};

(async () => {
  // Server persisten bila SKIP_SPAWN=1 (pola baku suite lain).
  let srv = null;
  if (process.env.SKIP_SPAWN !== "1") {
    srv = spawn("npm", ["run", "dev", "--", "--port", String(PORT)], { cwd: __dirname + "\\..", shell: true });
  }
  const t0 = Date.now();
  for (;;) {
    try {
      const r = await fetch(`${BASE}/transaksi`);
      if (r.status === 200) break;
    } catch {}
    if (Date.now() - t0 > 180000) throw new Error("dev tak hidup");
    await new Promise((s) => setTimeout(s, 2000));
  }
  const browser = await chromium.launch();
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  try {
    await page.goto(`${BASE}/transaksi`, { waitUntil: "load", timeout: 120000 });
    // Validasi: submit kosong -> pesan error
    await page.click('button[type="submit"]');
    await page.waitForFunction(
      () => /lebih dari 0/.test(document.body.textContent ?? ""),
      null,
      { timeout: 10000 }
    );
    lapor("validasi nominal 0", true);
    // Tulis keluar 15000 + catatan (set jenis di FORM dulu agar dropdown tampil)
    await page.locator("#tab-form").getByRole("tab", { name: /^Keluar/ }).click();
    await page.fill("#jml", "15000");
    await page.click("#kombo-kat");
    await page.waitForSelector('[role="listbox"]', { timeout: 8000 });
    await page.fill('input[aria-label="Cari kategori"]', "TesB2");
    await page.getByRole("button", { name: '+ Tambah "TesB2"' }).click();
    await page.waitForFunction(
      (t) => document.getElementById("kombo-kat")?.textContent?.includes(t),
      "TesB2",
      { timeout: 8000 }
    );
    await page.fill("#ctt", "Uji tulis B2");
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    await page.waitForFunction(() => /Uji tulis B2/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    lapor("tulis keluar + catatan", true);
    // Persistensi: reload -> tetap ada
    await page.reload({ waitUntil: "load", timeout: 120000 });
    await page.waitForFunction(() => /Uji tulis B2/.test(document.body.textContent ?? ""), null, { timeout: 15000 });
    lapor("persist IndexedDB", true);
    const serius = errs.filter((m) => !/favicon/i.test(m));
    lapor("console bersih", serius.length === 0, serius.slice(0, 2).join(" | "));
  } catch (e) {
    lapor("FATAL", false, String(e.message ?? e).split("\n")[0]);
    process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {});
    if (srv) srv.kill();
  }
  console.log(hasil.every(Boolean) ? "B21-ALL-OK" : "B21-GAGAL");
  if (!hasil.every(Boolean)) process.exitCode = 1;
})();
