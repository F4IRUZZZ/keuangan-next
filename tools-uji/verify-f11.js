// Verifikasi F1.1: Dialog catatan inline (tambah/ubah/hapus + hitung).
// Server persisten (SKIP_SPAWN=1, UJI_PORT).
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
    await page.goto(`${BASE}/transaksi`, { waitUntil: "load", timeout: 120000 });
    // Buat baris target (jenis keluar dulu agar #kat tampil)
    await page.locator("#tab-form").getByRole("tab", { name: /^Keluar/ }).click();
    await page.fill("#jml", "91000");
    await page.click("#kombo-kat");
    await page.waitForSelector('[role="listbox"]', { timeout: 8000 });
    await page.fill('input[aria-label="Cari kategori"]', "TesCatatan");
    await page.getByRole("button", { name: '+ Tambah "TesCatatan"' }).click();
    await page.waitForFunction(
      (t) => document.getElementById("kombo-kat")?.textContent?.includes(t),
      "TesCatatan",
      { timeout: 8000 }
    );
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    // Buka dialog catatan baris TesCatatan
    await page.locator("li", { hasText: "TesCatatan" }).getByRole("button", { name: /Catatan untuk/ }).click();
    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    await page.fill('input[aria-label="Tulis catatan"]', "Ingat bayar parkir");
    await page.getByRole("button", { name: /^Tambah$/ }).click();
    await page.waitForFunction(() => /Ingat bayar parkir/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    lapor("tambah catatan + tampil", true);
    // Ubah catatan
    await page.getByRole("button", { name: /^Ubah$/ }).click();
    await page.fill('input[aria-label="Isi catatan baru"]', "Ingat bayar parkir dan tol");
    await page.getByRole("button", { name: /^Simpan$/ }).click();
    await page.waitForFunction(() => /parkir dan tol/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    lapor("ubah catatan", true);
    // Hapus catatan
    await page.getByRole("button", { name: /^Hapus$/ }).click();
    await page.waitForFunction(() => !/parkir dan tol/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    lapor("hapus catatan", true);
    const serius = errs.filter((m) => !/favicon/i.test(m));
    lapor("console bersih", serius.length === 0, serius.slice(0, 2).join(" | "));
  } catch (e) {
    lapor("FATAL", false, String(e.message ?? e).split("\n")[0]);
    process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {});
  }
  console.log(hasil.every(Boolean) ? "F11-ALL-OK" : "F11-GAGAL");
  if (!hasil.every(Boolean)) process.exitCode = 1;
})();
