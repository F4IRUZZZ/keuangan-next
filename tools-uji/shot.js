// Screenshot bukti C2: halaman bawaan + demo 2 komponen 21st/shadcn.
const { spawn } = require("child_process");
const { chromium } = require("D:\\Project Developments\\GITHUB\\Webapp Keuangan(Ga Tuntas)\\tools\\uji\\node_modules\\playwright-core");

(async () => {
  const srv = spawn("npm", ["run", "dev", "--", "--port", "3001"], {
    cwd: __dirname,
    shell: true,
  });
  const t0 = Date.now();
  for (;;) {
    try {
      const r = await fetch("http://localhost:3001/");
      if (r.status === 200) break;
    } catch (e) {}
    if (Date.now() - t0 > 90000) throw new Error("dev server tak hidup");
    await new Promise((s) => setTimeout(s, 1000));
  }
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  try {
    await page.goto("http://localhost:3001/", { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "bukti/bukti-next-bawaan.png" });
    await page.goto("http://localhost:3001/coba-komponen", { waitUntil: "load" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "bukti/bukti-next-komponen.png" });
    console.log("SCREENSHOT-OK errs=" + errs.length);
    if (errs.length) console.log(errs.slice(0, 3).join(" | "));
  } finally {
    await browser.close().catch(() => {});
    srv.kill();
  }
})().catch((e) => {
  console.error("GAGAL:", e.message);
  process.exit(1);
});
