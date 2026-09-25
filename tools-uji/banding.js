// Bukti C3: screenshot Next /transaksi (terang+gelap) vs vanilla /transaksi.
require("fs").mkdirSync("bukti", { recursive: true });
const { spawn } = require("child_process");
const { chromium } = require("D:\\Project Developments\\GITHUB\\Webapp Keuangan(Ga Tuntas)\\tools\\uji\\node_modules\\playwright-core");

async function tunggu(url) {
  const t0 = Date.now();
  for (;;) {
    try {
      const r = await fetch(url);
      if (r.status === 200) return;
    } catch (e) {}
    if (Date.now() - t0 > 120000) throw new Error("tak hidup: " + url);
    await new Promise((s) => setTimeout(s, 1000));
  }
}

(async () => {
  const next = spawn("npm", ["run", "dev", "--", "--port", "3001"], { cwd: __dirname + "\\..", shell: true });
  const van = spawn("bun", ["run", "tools/depan.ts"], {
    cwd: "D:\\Project Developments\\GITHUB\\Webapp Keuangan(Ga Tuntas)",
    env: Object.assign({}, process.env, { WEB_PORT: "5598" }),
    shell: true,
  });
  await tunggu("http://localhost:3001/transaksi");
  await tunggu("http://localhost:5598/transaksi");
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  try {
    // Timeout panjang: kompilasi pertama Next bisa >60 detik (cache .next setelahnya)
    await page.goto("http://localhost:3001/transaksi", { waitUntil: "load", timeout: 120000 });
    await page.waitForSelector("h1", { timeout: 120000 });
    await page.waitForTimeout(2500);
    await page.$eval("#list-atau-form", (el) => el && el.scrollIntoView()).catch(() => {});
    await page.screenshot({ path: "bukti/bukti-next-transaksi-terang.png" });
    const tema = await page.$('button[aria-label="Ganti tema"]');
    if (tema) {
      await tema.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: "bukti/bukti-next-transaksi-gelap.png" });
    }
    await page.goto("http://localhost:5598/transaksi", { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "bukti/bukti-vanilla-transaksi.png" });
    console.log("BANDING-OK errs=" + errs.length);
    if (errs.length) console.log(errs.slice(0, 3).join(" | "));
  } finally {
    await browser.close().catch(() => {});
    next.kill();
    van.kill();
  }
})().catch((e) => {
  console.error("GAGAL:", e.message);
  process.exit(1);
});
