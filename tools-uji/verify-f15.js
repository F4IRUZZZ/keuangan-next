// Verifikasi F1.5: dashboard — grafik mingguan + aksi cepat + label periode +
// riwayat judul catatan + link Lihat semua + saldo-minus.
// Pakai server persisten (SKIP_SPAWN=1, UJI_PORT) — jangan spawn per run.
const { chromium } = require("D:\\Project Developments\\GITHUB\\Webapp Keuangan(Ga Tuntas)\\tools\\uji\\node_modules\\playwright-core");

const PORT = Number(process.env.UJI_PORT || 3003);
const BASE = `http://localhost:${PORT}`;
const hasil = [];
const lapor = (n, ok, d) => {
  hasil.push(ok);
  console.log(`${ok ? "ok: " : "GAGAL: "}${n}${d ? ` — ${d}` : ""}`);
};

// Senin minggu berjalan + offset hari -> 'YYYY-MM-DD' (deterministik kapan pun di-run).
function isoSeninPlus(offset) {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  try {
    await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 120000 });
    // Aksi cepat: href sesuai vanilla
    for (const [nama, href] of [
      ["+ Masuk", "/transaksi?jenis=masuk"],
      ["+ Keluar", "/transaksi?jenis=keluar"],
      ["Bayar Hutang", "/hutang"],
    ]) {
      const h = await page.getByRole("link", { name: nama }).getAttribute("href");
      if (h !== href) throw new Error(`aksi ${nama} href=${h}`);
    }
    lapor("aksi cepat 3 link", true);
    // Label periode: default + ganti filter
    const labelAda = async (t) =>
      page.waitForFunction((x) => (document.body.textContent ?? "").includes(x), t, { timeout: 8000 });
    await labelAda("Semua Waktu");
    await page.getByRole("button", { name: /^Minggu Ini$/ }).click();
    await labelAda("Minggu Ini");
    await page.getByRole("button", { name: /^Bulan Ini$/ }).click();
    await labelAda("Bulan Ini");
    lapor("label periode ikut filter", true);
    // Seed 2 keluar beda hari (Senin 20000, Rabu 30000) via form
    async function isiKeluar(tgl, nominal, kategori) {
      await page.goto(`${BASE}/transaksi`, { waitUntil: "load", timeout: 120000 });
      await page.locator("#tab-form").getByRole("tab", { name: /^Keluar/ }).click();
      await page.fill("#jml", nominal);
      await page.click("#kombo-kat");
      await page.waitForSelector('[role="listbox"]', { timeout: 8000 });
      await page.fill('input[aria-label="Cari kategori"]', kategori);
      await page.getByRole("button", { name: `+ Tambah "${kategori}"` }).click();
      await page.waitForFunction(
        (t) => document.getElementById("kombo-kat")?.textContent?.includes(t),
        kategori,
        { timeout: 8000 }
      );
      await page.fill("#tgl", tgl);
      await page.click('button[type="submit"]');
      await page.waitForFunction(() => /tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    }
    await isiKeluar(isoSeninPlus(0), "20000", "TesSenin");
    await isiKeluar(isoSeninPlus(2), "30000", "TesRabu");
    await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 120000 });
    // Tab grafik: default Arus, pindah tiap tab -> kanvas ter-render
    async function assertKanvas(id) {
      const box = await page.waitForSelector(id, { timeout: 8000 }).then((el) => el.boundingBox());
      if (!box || box.height < 50) throw new Error(`${id} tak ter-render`);
    }
    const tabAwal = await page.getByRole("tab", { selected: true }).textContent();
    if ((tabAwal ?? "").trim() !== "Arus") throw new Error("tab default bukan Arus: " + tabAwal);
    await assertKanvas("#grafik-arus");
    await page.getByRole("tab", { name: "Mingguan", exact: true }).click();
    await assertKanvas("#grafik-minggu");
    await page.getByRole("tab", { name: "Kategori", exact: true }).click();
    await assertKanvas("#grafik-kategori");
    lapor("3 tab grafik ter-render", true);
    // Ganti periode di tab Mingguan tak boleh meruntuhkan grafik (destroy/recreate stabil)
    await page.getByRole("tab", { name: "Mingguan", exact: true }).click();
    await page.getByRole("button", { name: /^Minggu Ini$/ }).click();
    await page.waitForTimeout(800);
    const boxMinggu = await page.$eval("#grafik-minggu", (el) => el.getBoundingClientRect().height);
    if (boxMinggu < 50) throw new Error("grafik minggu runtuh saat ganti periode");
    lapor("grafik stabil saat ganti periode", true);
    // Riwayat fallback: judul 'Keluar - <kategori>' + meta 'kat • dd/mm/yyyy'
    await page.waitForFunction(() => /Keluar - TesSenin/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    await page.waitForFunction(() => /TesSenin • \d{2}\/\d{2}\/\d{4}/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    lapor("riwayat judul fallback + meta", true);
    // Saldo minus (keluar 50000, masuk 0) = merah (tunggu count-up selesai dulu)
    await page.waitForFunction(() => {
      const ps = [...document.querySelectorAll("p.text-4xl")];
      return ps.some((p) => /50\.000/.test(p.textContent ?? ""));
    }, null, { timeout: 15000 });
    const minusMerah = await page.evaluate(() => {
      const ps = [...document.querySelectorAll("p.text-4xl")];
      const el = ps.find((p) => /50\.000/.test(p.textContent ?? ""));
      return !!el && el.className.includes("text-red-200");
    });
    if (!minusMerah) throw new Error("saldo minus tak merah");
    lapor("saldo-minus merah", true);
    // Judul catatan: tambah catatan via dialog, tampil di riwayat dashboard
    await page.goto(`${BASE}/transaksi`, { waitUntil: "load", timeout: 120000 });
    await page.locator("li", { hasText: "TesSenin" }).getByRole("button", { name: /Catatan untuk/ }).click();
    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    await page.fill('input[aria-label="Tulis catatan"]', "Titip beli gula");
    await page.getByRole("button", { name: /^Tambah$/ }).click();
    await page.waitForFunction(() => /Titip beli gula/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 120000 });
    await page.waitForFunction(() => /Titip beli gula/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    lapor("riwayat judul = catatan", true);
    // Link Lihat semua
    const lihatHref = await page.getByRole("link", { name: /Lihat semua/ }).getAttribute("href");
    if (lihatHref !== "/transaksi") throw new Error("Lihat semua href=" + lihatHref);
    lapor("link Lihat semua", true);
    const serius = errs.filter((m) => !/favicon/i.test(m));
    lapor("console bersih", serius.length === 0, serius.slice(0, 2).join(" | "));
  } catch (e) {
    lapor("FATAL", false, String(e.message ?? e).split("\n")[0]);
    process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {});
  }
  console.log(hasil.every(Boolean) ? "F15-ALL-OK" : "F15-GAGAL");
  if (!hasil.every(Boolean)) process.exitCode = 1;
})();
