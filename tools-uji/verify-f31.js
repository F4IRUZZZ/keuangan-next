// Verifikasi F3.1: serve out/ (production) -> SW terdaftar -> seed online ->
// setOffline(true) -> reload -> data tetap tampil (uji pesawat sungguhan).
// Server out/ dibawa-sendiri (port 3101); tak perlu dev server.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("D:\\Project Developments\\GITHUB\\Webapp Keuangan(Ga Tuntas)\\tools\\uji\\node_modules\\playwright-core");

const OUT = path.join(__dirname, "..", "out");
const PORT = 3101;
const BASE = `http://localhost:${PORT}`;
const hasil = [];
const lapor = (n, ok, d) => {
  hasil.push(ok);
  console.log(`${ok ? "ok: " : "GAGAL: "}${n}${d ? ` — ${d}` : ""}`);
};

function serveOut() {
  return http
    .createServer((req, res) => {
      try {
        let p = decodeURIComponent(req.url.split("?")[0]);
        if (p.endsWith("/")) p += "index.html";
        const kandidat = [path.join(OUT, p), path.join(OUT, p + ".html"), path.join(OUT, p, "index.html")];
        const f = kandidat.find((k) => fs.existsSync(k) && fs.statSync(k).isFile());
        if (!f) {
          res.writeHead(404); res.end("nope"); return;
        }
        const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json", ".txt": "text/plain" };
        res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
        fs.createReadStream(f).pipe(res);
      } catch {
        res.writeHead(500); res.end("err");
      }
    })
    .listen(PORT);
}

(async () => {
  if (!fs.existsSync(path.join(OUT, "index.html"))) {
    lapor("FATAL", false, "out/ belum dibangun (npm run build dulu)");
    console.log("F31-GAGAL");
    process.exitCode = 1;
    return;
  }
  const srv = serveOut();
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  try {
    await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 120000 });
    await page.waitForTimeout(1500);
    // SW terdaftar (production only)
    await page.waitForFunction(
      () => navigator.serviceWorker && navigator.serviceWorker.controller !== null,
      null,
      { timeout: 20000 }
    );
    lapor("SW terdaftar + kendali", true);
    // Seed online
    await page.goto(`${BASE}/transaksi`, { waitUntil: "load", timeout: 120000 });
    await page.locator("#tab-form").getByRole("tab", { name: /^Keluar/ }).click();
    await page.fill("#jml", "45000");
    await page.click("#kombo-kat");
    await page.waitForSelector('[role="listbox"]', { timeout: 8000 });
    await page.fill('input[aria-label="Cari kategori"]', "TesOff");
    await page.getByRole("button", { name: '+ Tambah "TesOff"' }).click();
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    await page.goto(`${BASE}/hutang`, { waitUntil: "load", timeout: 120000 });
    await page.fill("#pihak", "BudiOff");
    await page.fill("#jml-hutang", "25000");
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    lapor("seed online", true);
    // Online: badge koneksi tidak tampil
    const badgeOn = await page.getByText("Offline • Perangkat ini", { exact: true }).count();
    if (badgeOn > 0) throw new Error("badge tampil saat online");
    lapor("badge absen saat online", true);
    // MODE PESAWAT: reload dashboard + transaksi + hutang dari cache + IDB
    await page.context().setOffline(true);
    await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 30000 });
    await page.waitForFunction(() => /Keluar - TesOff/.test(document.body.textContent ?? ""), null, { timeout: 15000 });
    await page.waitForFunction(() => /Offline • Perangkat ini/.test(document.body.textContent ?? ""), null, { timeout: 15000 });
    lapor("dashboard offline tampil + badge", true);
    await page.goto(`${BASE}/transaksi`, { waitUntil: "load", timeout: 30000 });
    await page.waitForFunction(() => /TesOff/.test(document.body.textContent ?? ""), null, { timeout: 15000 });
    lapor("transaksi offline tampil", true);
    await page.goto(`${BASE}/hutang`, { waitUntil: "load", timeout: 30000 });
    await page.waitForFunction(() => /BudiOff/.test(document.body.textContent ?? ""), null, { timeout: 15000 });
    lapor("hutang offline tampil", true);
    const serius = errs.filter((m) => !/favicon|offline|Failed to fetch|net::/i.test(m));
    lapor("console bersih", serius.length === 0, serius.slice(0, 2).join(" | "));
  } catch (e) {
    lapor("FATAL", false, String(e.message ?? e).split("\n")[0]);
    process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {});
    srv.close();
  }
  console.log(hasil.every(Boolean) ? "F31-ALL-OK" : "F31-GAGAL");
  if (!hasil.every(Boolean)) process.exitCode = 1;
})();
