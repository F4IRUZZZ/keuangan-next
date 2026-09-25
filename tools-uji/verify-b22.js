// Verifikasi B2.2: bulk hapus + format live + Dialog ubah/hapus.
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
  page.on("dialog", (d) => d.accept()); // confirm() bulk
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  try {
    await page.goto(`${BASE}/transaksi`, { waitUntil: "load", timeout: 120000 });
    // Format live: ketik 5000 -> 5.000
    await page.fill("#jml", "5000");
    const live = await page.$eval("#jml", (el) => el.value);
    if (live !== "5.000") throw new Error("format live gagal: " + live);
    lapor("format live 5000 -> 5.000", true);
    // Baris edit-target: tulis 1 (DB fresh, daftar kosong sebelumnya)
    await page.locator("#tab-form").getByRole("tab", { name: /^Keluar/ }).click();
    await page.fill("#jml", "13000");
    await page.fill("#kat", "TesUbah");
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    // Dialog ubah: ganti jumlah -> simpan
    await page.locator("li", { hasText: "TesUbah" }).getByRole("button", { name: /^Ubah$/ }).click();
    await page.waitForSelector("#u-jml", { timeout: 8000 });
    await page.fill("#u-jml", "77000");
    await page.locator('[role="dialog"]').getByRole("button", { name: /^Simpan$/ }).click();
    await page.waitForFunction(() => /diubah jadi Rp77\.000/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    lapor("dialog ubah jumlah", true);
    // Dialog hapus: konfirmasi di dialog -> baris hilang
    await page.locator("li", { hasText: "TesUbah" }).getByRole("button", { name: /^Hapus$/ }).click();
    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    await page.locator('[role="dialog"]').getByRole("button", { name: "Hapus" }).click();
    await page.waitForFunction(() => /dihapus\./.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    await page.waitForFunction(() => !/TesUbah/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    lapor("dialog hapus konfirmasi", true);
    // Tulis 2 baris TesBulk untuk dihapus massal
    for (const nominal of ["11000", "12000"]) {
      await page.locator("#tab-form").getByRole("tab", { name: /^Keluar/ }).click();
      await page.fill("#jml", nominal);
      await page.fill("#kat", "TesBulk");
      await page.click('button[type="submit"]');
      await page.waitForFunction(() => /tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    }
    // Bulk: filter cari -> pilih semua tampil -> hapus
    await page.fill('input[placeholder*="Cari kategori"]', "TesBulk");
    await page.waitForFunction(
      () => (document.querySelectorAll('li input[type="checkbox"]').length ?? 0) >= 2,
      null,
      { timeout: 10000 }
    );
    await page.getByLabel("Pilih semua yang tampil").check();
    await page.getByRole("button", { name: /Hapus terpilih/ }).click();
    await page.waitForFunction(() => /2 transaksi dihapus/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    lapor("bulk hapus 2 + cascade", true);
    const serius = errs.filter((m) => !/favicon/i.test(m));
    lapor("console bersih", serius.length === 0, serius.slice(0, 2).join(" | "));
  } catch (e) {
    lapor("FATAL", false, String(e.message ?? e).split("\n")[0]);
    process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {});
  }
  console.log(hasil.every(Boolean) ? "B22-ALL-OK" : "B22-GAGAL");
  if (!hasil.every(Boolean)) process.exitCode = 1;
})();
