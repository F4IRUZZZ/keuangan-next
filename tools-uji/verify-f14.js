// Verifikasi F1.4: produk tambah/duplikat/ubah/hapus + hitung pakai.
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
    await page.goto(`${BASE}/produk`, { waitUntil: "load", timeout: 120000 });
    // Validasi: nama kosong -> pesan
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /Nama produk wajib/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 15000 });
    lapor("validasi nama wajib", true);
    // Tambah BerasF14/Pangan
    await page.fill("#nama-produk", "BerasF14");
    await page.fill("#kat-produk", "Pangan");
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /BerasF14.*ditambah/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 15000 });
    lapor("tambah produk", true);
    // Duplikat (beda kapital) -> ditolak
    await page.fill("#nama-produk", "berasf14");
    await page.fill("#kat-produk", "X");
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /Produk sudah ada/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 15000 });
    lapor("tolak duplikat case-insensitive", true);
    // Ubah via dialog
    await page.locator("li", { hasText: "BerasF14" }).getByRole("button", { name: /^Ubah$/ }).click();
    await page.waitForSelector("#u-nama", { timeout: 8000 });
    await page.fill("#u-nama", "BerasF14Baru");
    await page.locator('[role="dialog"]').getByRole("button", { name: /^Simpan$/ }).click();
    await page.waitForFunction(() => /BerasF14Baru/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 15000 });
    lapor("dialog ubah produk", true);
    // Hapus via dialog
    await page.locator("li", { hasText: "BerasF14Baru" }).getByRole("button", { name: /^Hapus$/ }).click();
    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    await page.locator('[role="dialog"]').getByRole("button", { name: "Hapus" }).click();
    await page.waitForFunction(() => /dihapus\./.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 15000 });
    // Absensi via baris (bukan body): pesan sukses mengandung nama sehingga body selalu cocok
    await page.waitForFunction(() => {
      const rows = Array.from(document.querySelectorAll("ul.space-y-2 > li"));
      return !rows.some((li) => (li.textContent ?? "").includes("BerasF14Baru"));
    }, null, { polling: 100, timeout: 15000 });
    lapor("dialog hapus produk", true);
    const serius = errs.filter((m) => !/favicon/i.test(m));
    lapor("console bersih", serius.length === 0, serius.slice(0, 2).join(" | "));
  } catch (e) {
    lapor("FATAL", false, String(e.message ?? e).split("\n")[0]);
    process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {});
  }
  console.log(hasil.every(Boolean) ? "F14-ALL-OK" : "F14-GAGAL");
  if (!hasil.every(Boolean)) process.exitCode = 1;
})();
