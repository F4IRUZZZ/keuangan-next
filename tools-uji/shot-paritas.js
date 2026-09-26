// Sekali-pakai F2.3: serve vanilla statis + seed identik 2 app +
// matriks 4 rute x 2 tema x 2 app. Server Next (3000) disiapkan di luar.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("D:\\Project Developments\\GITHUB\\Webapp Keuangan(Ga Tuntas)\\tools\\uji\\node_modules\\playwright-core");

const NEXT = `http://localhost:${Number(process.env.UJI_PORT || 3000)}`;
const VROOT = "D:\\Project Developments\\GITHUB\\Webapp Keuangan(Ga Tuntas)";
const VPORT = 3100;
const VAN = `http://localhost:${VPORT}`;
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png" };

// Static server vanilla: dukung href tanpa ekstensi (/transaksi -> transaksi.html).
function serveVanilla() {
  return http
    .createServer((req, res) => {
      try {
        let p = decodeURIComponent(req.url.split("?")[0]);
        if (p === "/") p = "/index.html";
        let f = path.join(VROOT, p);
        if (!fs.existsSync(f) && fs.existsSync(f + ".html")) f += ".html";
        if (!fs.existsSync(f) || !fs.statSync(f).isFile()) {
          res.writeHead(404); res.end("nope"); return;
        }
        res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
        fs.createReadStream(f).pipe(res);
      } catch {
        res.writeHead(500); res.end("err");
      }
    })
    .listen(VPORT);
}

async function seedVanilla(page) {
  await page.goto(`${VAN}/transaksi`, { waitUntil: "load", timeout: 120000 });
  await page.waitForTimeout(1000);
  await page.click('.seg-btn[data-jenis="keluar"]');
  await page.fill("#jumlah", "45000");
  await page.fill("#kategori-kombo", "Makan");
  await page.click("#btn-tambah");
  await page.waitForFunction(() => /Makan/.test(document.getElementById("list-transaksi")?.textContent ?? ""), null, { timeout: 15000 });
  await page.click('.seg-btn[data-jenis="masuk"]');
  await page.fill("#jumlah", "90000");
  await page.click("#btn-tambah");
  await page.waitForFunction(() => /90\.000/.test(document.getElementById("list-transaksi")?.textContent ?? ""), null, { timeout: 15000 });
  await page.goto(`${VAN}/hutang`, { waitUntil: "load", timeout: 120000 });
  await page.waitForTimeout(1000);
  await page.fill("#pihak", "Budi");
  await page.fill("#jumlah-hutang", "25000");
  await page.click("#btn-tambah-hutang");
  await page.waitForFunction(() => /Budi/.test(document.getElementById("list-hutang")?.textContent ?? ""), null, { timeout: 15000 });
}

async function seedNext(page) {
  await page.goto(`${NEXT}/transaksi`, { waitUntil: "load", timeout: 120000 });
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
  await page.goto(`${NEXT}/hutang`, { waitUntil: "load", timeout: 120000 });
  await page.fill("#pihak", "Budi");
  await page.fill("#jml-hutang", "25000");
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => /tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
}

const RUTE = [
  ["dash", "/", "/"],
  ["tra", "/transaksi", "/transaksi"],
  ["pro", "/produk", "/produk"],
  ["hut", "/hutang", "/hutang"],
];

// Tanpa closure (init script diserialisasi; variabel luar tak terbawa).
function gelapNext() {
  new MutationObserver((_, obs) => {
    if (document.documentElement) {
      document.documentElement.classList.add("dark");
      obs.disconnect();
    }
  }).observe(document, { childList: true });
}
function gelapVan() {
  new MutationObserver((_, obs) => {
    if (document.documentElement) {
      document.documentElement.setAttribute("data-theme", "dark");
      obs.disconnect();
    }
  }).observe(document, { childList: true });
}

(async () => {
  const srv = serveVanilla();
  const browser = await chromium.launch();
  try {
    for (const [app, base, seed] of [["vanilla", VAN, seedVanilla], ["next", NEXT, seedNext]]) {
      for (const tema of ["terang", "gelap"]) {
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        if (tema === "gelap") await ctx.addInitScript(app === "next" ? gelapNext : gelapVan);
        const page = await ctx.newPage();
        const errs = [];
        page.on("pageerror", (e) => errs.push(e.message.split("\n")[0]));
        await seed(page);
        for (const [nama, nUrl, vUrl] of RUTE) {
          await page.goto(`${base}${app === "next" ? nUrl : vUrl}`, { waitUntil: "load", timeout: 120000 });
          await page.waitForTimeout(1800);
          await page.screenshot({ path: `bukti/paritas-${nama}-${tema}-${app}.png` });
        }
        const serius = errs.filter((m) => !/favicon/i.test(m));
        console.log(`${app}/${tema}: shots-ok console=${serius.length === 0 ? "bersih" : serius.slice(0, 2).join(" | ")}`);
        await ctx.close();
      }
    }
    console.log("SHOT-OK");
  } finally {
    await browser.close().catch(() => {});
    srv.close();
  }
})().catch((e) => { console.error("GAGAL:", String(e.message).split("\n")[0]); process.exit(1); });
