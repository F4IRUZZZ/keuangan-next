// Cek cepat nav bawah + font (sekali pakai).
const { chromium } = require("D:\\Project Developments\\GITHUB\\Webapp Keuangan(Ga Tuntas)\\tools\\uji\\node_modules\\playwright-core");

(async () => {
  const browser = await chromium.launch();
  const m = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = [];
  m.on("pageerror", (e) => errs.push(e.message));
  m.on("console", (c) => { if (c.type() === "error") errs.push(c.text()); });
  await m.goto("http://localhost:3000/transaksi", { waitUntil: "load", timeout: 120000 });
  await m.waitForTimeout(1500);
  const nav = await m.evaluate(() => {
    const el = document.querySelector('nav[aria-label="Navigasi utama"].fixed');
    if (!el) return "TAK-ADA";
    const r = el.getBoundingClientRect();
    const items = el.querySelectorAll("a").length;
    return `fixed items=${items} bottom=${Math.round(r.bottom)}/${window.innerHeight}`;
  });
  console.log("MOBILE-NAV: " + nav);
  await m.screenshot({ path: "bukti-nav-hp.png" });
  const d = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await d.goto("http://localhost:3000/transaksi", { waitUntil: "load", timeout: 120000 });
  await d.waitForTimeout(1500);
  console.log("DESKTOP-TOPBAR: " + (await d.evaluate(() => !!document.querySelector("nav.sticky"))));
  console.log("FONT-H1: " + (await d.evaluate(() => getComputedStyle(document.querySelector("h1")).fontFamily)).slice(0, 60));
  await d.screenshot({ path: "bukti-nav-desktop.png" });
  await browser.close();
  const serius = errs.filter((e) => !/favicon/i.test(e));
  console.log("console-errs=" + serius.length + (serius.length ? " " + serius.slice(0, 2).join(" | ") : ""));
})().catch((e) => {
  console.error("GAGAL:", String(e.message ?? e).split("\n")[0]);
  process.exit(1);
});
