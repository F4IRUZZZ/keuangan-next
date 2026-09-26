// Sekali-pakai: audit overflow 6 rute x 360/390/420 DENGAN data (profil persisten).
const { chromium } = require("D:\\Project Developments\\GITHUB\\Webapp Keuangan(Ga Tuntas)\\tools\\uji\\node_modules\\playwright-core");
const PORT = Number(process.env.UJI_PORT || 3000);
const RUTE = ["", "transaksi", "riwayat", "produk", "hutang", "pengaturan"];
(async () => {
  const BASE = `http://localhost:${PORT}`;
  const browser = await chromium.launchPersistentContext("C:\\Users\\Fairuzz\\AppData\\Local\\Temp\\opencode\\profil-luber", {
    viewport: { width: 360, height: 844 },
  });
  const page = await browser.newPage();
  // Seed sekali (mirip data pelapor: ada masuk, keluar, hutang)
  await page.goto(`${BASE}/transaksi`, { waitUntil: "load", timeout: 120000 });
  await page.locator("#tab-form").getByRole("tab", { name: /^Keluar/ }).click();
  await page.fill("#jml", "100000");
  await page.click("#kombo-kat");
  await page.waitForSelector('[role="listbox"]', { timeout: 8000 });
  await page.fill('input[aria-label="Cari kategori"]', "Makan");
  await page.getByRole("button", { name: '+ Tambah "Makan"' }).click();
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => /tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
  await page.locator("#tab-form").getByRole("tab", { name: /^Masuk/ }).click();
  await page.fill("#jml", "350000");
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => /tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
  await page.goto(`${BASE}/hutang`, { waitUntil: "load", timeout: 120000 });
  await page.fill("#pihak", "BudiLuber");
  await page.fill("#jml-hutang", "25000");
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => /tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
  let gagal = 0;
  for (const w of [360, 390, 420]) {
    await page.setViewportSize({ width: w, height: 844 });
    for (const r of RUTE) {
      await page.goto(`${BASE}/${r}`, { waitUntil: "load", timeout: 120000 });
      await page.waitForTimeout(1500);
      const info = await page.evaluate(() => {
        const de = document.documentElement;
        const over = [...document.querySelectorAll("body *")].filter((el) => {
          const b = el.getBoundingClientRect();
          return b.width > 0 && (b.right > window.innerWidth + 1 || b.left < -1);
        }).slice(0, 3).map((el) => {
          const id = el.id ? `#${el.id}` : "";
          const cls = (el.className?.baseVal ?? el.className ?? "").toString().split(" ").slice(0, 4).join(".");
          return `${el.tagName}${id}.${cls}`;
        });
        return { doc: de.scrollWidth, win: window.innerWidth, over };
      });
      const ok = info.doc <= info.win;
      if (!ok) gagal++;
      console.log(`${ok ? "ok: " : "LUBER:"} ${w}px /${r} doc=${info.doc} ${ok ? "" : JSON.stringify(info.over)}`);
    }
  }
  await browser.close().catch(() => {});
  console.log(gagal === 0 ? "NOL-LUBER" : `LUBER-${gagal}`);
  if (gagal > 0) process.exitCode = 1;
})().catch((e) => { console.error("GAGAL:", String(e.message).split("\n")[0]); process.exit(1); });
