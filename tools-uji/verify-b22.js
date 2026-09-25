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
    // Chips B2.2b: +10rb dari kosong -> 10.000; 5 + +00 -> 500; +0 no-op
    await page.fill("#jml", "");
    await page.getByRole("button", { name: "+10rb" }).click();
    const chipTambah = await page.$eval("#jml", (el) => el.value);
    if (chipTambah !== "10.000") throw new Error("chip +10rb gagal: " + chipTambah);
    await page.fill("#jml", "5");
    await page.getByRole("button", { name: "+00", exact: true }).click();
    const chipTempel = await page.$eval("#jml", (el) => el.value);
    if (chipTempel !== "500") throw new Error("chip +00 gagal: " + chipTempel);
    await page.fill("#jml", "5");
    await page.getByRole("button", { name: "+000", exact: true }).click();
    const chipNol = await page.$eval("#jml", (el) => el.value);
    if (chipNol !== "5.000") throw new Error("chip +000 gagal: " + chipNol);
    lapor("chips +10rb/+00/+000 format", true);
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
    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    await page.locator('[role="dialog"]').getByRole("button", { name: "Hapus" }).click();
    await page.waitForFunction(() => /2 transaksi dihapus/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    lapor("bulk dialog + hapus 2 + cascade", true);
    // F1.2: preset URL + reset + filter hari + CSV + footer + limit + mini-stat
    await page.goto(`${BASE}/transaksi?jenis=keluar`, { waitUntil: "load", timeout: 120000 });
    await page.waitForFunction(() => {
      const el = document.querySelector("#tab-form [aria-selected='true']");
      return el && /Keluar/i.test(el.textContent ?? "");
    }, null, { timeout: 15000 });
    const jenisAktif = await page.$eval("#tab-form", (el) => el.querySelector('[aria-selected="true"]')?.textContent ?? "");
    if (!/Keluar/i.test(jenisAktif)) throw new Error("preset ?jenis= gagal: " + jenisAktif);
    lapor("preset ?jenis=keluar", true);
    await page.fill("#jml", "999");
    await page.getByRole("button", { name: /^Reset$/ }).click();
    const resetOk = await page.$eval("#jml", (el) => el.value === "");
    if (!resetOk) throw new Error("reset gagal");
    lapor("reset form", true);
    await page.getByRole("button", { name: /^Hari Ini$/ }).click();
    await page.waitForTimeout(800);
    const footerHari = await page.evaluate(() => document.body.textContent ?? "");
    if (!/Menampilkan \d+ dari \d+ catatan/.test(footerHari)) throw new Error("footer hitung hilang");
    lapor("filter Hari Ini + footer hitung", true);
    await page.getByRole("button", { name: /^Hari Ini$/ }).click(); // toggle lepas
    const [csvDl] = await Promise.all([
      page.waitForEvent("download", { timeout: 8000 }),
      page.getByRole("button", { name: /^CSV$/ }).click(),
    ]);
    const csvPath = `bukti-f12-daftar.csv`;
    await csvDl.saveAs(csvPath);
    const csvIsi = require("fs").readFileSync(csvPath, "utf8");
    if (csvIsi.split("\n")[0].trim() !== "tanggal,jenis,jumlah,kategori,catatan") throw new Error("header CSV salah");
    require("fs").unlinkSync(csvPath);
    lapor("CSV toolbar valid", true);
    const limitAda = await page.evaluate(() => {
      const el = document.getElementById("limit-card");
      return !!el && !el.hidden && /Limit Pengeluaran Harian/.test(document.body.textContent ?? "");
    });
    if (!limitAda) throw new Error("kartu limit tak tampil");
    const miniAda = await page.evaluate(() => /Bln Ini/.test(document.body.textContent ?? ""));
    if (!miniAda) throw new Error("mini-stat tak tampil");
    lapor("kartu limit + mini-stat", true);
    // Issue #9: hitung tab stabil — bersihkan cari dulu, tambah 2 masuk,
    // klik Keluar, label = total pra-tab (bukan 0 semua)
    await page.fill('input[placeholder*="Cari kategori"]', "");
    for (const nominal of ["71000", "72000"]) {
      await page.locator("#tab-form").getByRole("tab", { name: /^Masuk/ }).click();
      await page.fill("#jml", nominal);
      await page.click('button[type="submit"]');
      await page.waitForFunction(() => /tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    }
    const totalSemua = await page.evaluate(() => {
      const m = /Semua \((\d+)\)/.exec(document.body.textContent ?? "");
      return m ? Number(m[1]) : -1;
    });
    await page.locator("#tab-daftar").getByRole("tab", { name: /^Keluar/ }).click();
    await page.waitForFunction((total) => {
      const t = document.body.textContent ?? "";
      const semua = /Semua \((\d+)\)/.exec(t);
      const masuk = /Masuk \((\d+)\)/.exec(t);
      const keluar = /Keluar \((\d+)\)/.exec(t);
      return semua && masuk && keluar &&
        Number(semua[1]) === total && Number(masuk[1]) === total &&
        Number(keluar[1]) === 0;
    }, totalSemua, { timeout: 10000 });
    lapor("hitung tab stabil saat pindah tab", true);
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
