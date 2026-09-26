// Sekali-pakai F2.1: seed + matriks screenshot 6 rute x terang/gelap.
const { chromium } = require("D:\\Project Developments\\GITHUB\\Webapp Keuangan(Ga Tuntas)\\tools\\uji\\node_modules\\playwright-core");
const PORT = Number(process.env.UJI_PORT || 3000);
const RUTE = ["", "transaksi", "riwayat", "produk", "hutang", "pengaturan"];

async function seed(page, BASE) {
  await page.goto(`${BASE}/transaksi`, { waitUntil: "load", timeout: 120000 });
  await page.locator("#tab-form").getByRole("tab", { name: /^Keluar/ }).click();
  await page.fill("#jml", "45000");
  await page.click("#kombo-kat");
  await page.waitForSelector('[role="listbox"]', { timeout: 8000 });
  await page.fill('input[aria-label="Cari kategori"]', "Makan");
  await page.getByRole("button", { name: '+ Tambah "Makan"' }).click();
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => /tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
  await page.locator("#tab-form").getByRole("tab", { name: /^Masuk/ }).click();
  await page.fill("#jml", "90000");
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => /tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
  await page.goto(`${BASE}/hutang`, { waitUntil: "load", timeout: 120000 });
  await page.fill("#pihak", "Budi21");
  await page.fill("#jml-hutang", "25000");
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => /tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
}

(async () => {
  const BASE = `http://localhost:${PORT}`;
  const browser = await chromium.launch();
  for (const tema of ["terang", "gelap"]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    if (tema === "gelap") {
      // Init script jalan sebelum <html> ada -> tunggu via MutationObserver,
      // agar .dark sudah menempel sebelum skrip halaman (termasuk chart) jalan.
      await ctx.addInitScript(() => {
        new MutationObserver((_, obs) => {
          if (document.documentElement) {
            document.documentElement.classList.add("dark");
            obs.disconnect();
          }
        }).observe(document, { childList: true });
      });
    }
    const page = await ctx.newPage();
    const errs = [];
    page.on("pageerror", (e) => errs.push(e.message));
    await seed(page, BASE);
    for (const r of RUTE) {
      const nama = r === "" ? "dash" : r.slice(0, 3);
      await page.goto(`${BASE}/${r}`, { waitUntil: "load", timeout: 120000 });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `bukti/f21-${nama}-${tema}.png` });
    }
    const serius = errs.filter((m) => !/favicon/i.test(m));
    console.log(`${tema}: shots-ok console=${serius.length === 0 ? "bersih" : serius.slice(0, 2).join(" | ")}`);
    await ctx.close();
  }
  await browser.close();
  console.log("SHOT-OK");
})().catch((e) => { console.error("GAGAL:", String(e.message).split("\n")[0]); process.exit(1); });
