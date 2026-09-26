// Verifikasi F2.0: sidebar desktop + logo FamVault + manifest + favicon.
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
  const errs = [];
  try {
    // Statik: manifest + ikon + favicon 200
    for (const [nama, cek] of [
      ["manifest", async (r) => r.status === 200 && (await r.json()).name === "FamVault"],
      ["ikon-192", async (r) => r.status === 200 && (r.headers.get("content-type") ?? "").includes("image/png")],
      ["ikon-512", async (r) => r.status === 200 && (r.headers.get("content-type") ?? "").includes("image/png")],
      ["favicon", async (r) => r.status === 200],
    ]) {
      const url = nama === "manifest" ? `${BASE}/manifest.webmanifest` : nama === "favicon" ? `${BASE}/favicon.ico` : `${BASE}/${nama}.png`;
      const r = await fetch(url);
      if (!(await cek(r))) throw new Error(`${nama} gagal: ${r.status}`);
    }
    lapor("manifest + ikon + favicon", true);
    // Desktop 1280: sidebar tampil (lebar 240), bottom-nav sembunyi
    const desk = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    desk.on("pageerror", (e) => errs.push(e.message));
    await desk.goto(`${BASE}/`, { waitUntil: "load", timeout: 120000 });
    await desk.waitForTimeout(1000);
    const navs = desk.locator('nav[aria-label="Navigasi utama"]');
    const boxSide = await navs.nth(0).boundingBox();
    if (!boxSide || Math.abs(boxSide.width - 240) > 4) throw new Error("sidebar tak 240px");
    const nLinkSide = await navs.nth(0).locator('a[href^="/"]').count();
    if (nLinkSide < 6) throw new Error(`link sidebar=${nLinkSide}`);
    const logoAlt = await navs.nth(0).locator('img[alt="Logo FamVault"]').count();
    if (logoAlt !== 1) throw new Error("logo sidebar tak ada");
    const boxBawahDesk = await navs.nth(1).boundingBox();
    if (boxBawahDesk !== null) throw new Error("bottom-nav tampil di desktop");
    const judul = await desk.title();
    if (!/FamVault/.test(judul)) throw new Error("title=" + judul);
    await desk.screenshot({ path: "bukti/sidebar-desktop.png" });
    lapor("sidebar desktop + logo + title", true);
    await desk.close();
    // HP 390: bottom-nav 6 kolom tampil, sidebar sembunyi
    const hp = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    hp.on("pageerror", (e) => errs.push(e.message));
    await hp.goto(`${BASE}/riwayat`, { waitUntil: "load", timeout: 120000 });
    await hp.waitForTimeout(1000);
    const navsHp = hp.locator('nav[aria-label="Navigasi utama"]');
    const boxSideHp = await navsHp.nth(0).boundingBox();
    if (boxSideHp !== null) throw new Error("sidebar tampil di HP");
    const boxBawahHp = await navsHp.nth(1).boundingBox();
    if (!boxBawahHp || boxBawahHp.width < 300) throw new Error("bottom-nav HP hilang");
    const nLinkHp = await navsHp.nth(1).locator('a[href^="/"]').count();
    if (nLinkHp !== 6) throw new Error(`link HP=${nLinkHp}`);
    await hp.screenshot({ path: "bukti/sidebar-hp.png" });
    lapor("bottom-nav HP 6 item", true);
    await hp.close();
    const serius = errs.filter((m) => !/favicon/i.test(m));
    lapor("console bersih", serius.length === 0, serius.slice(0, 2).join(" | "));
  } catch (e) {
    lapor("FATAL", false, String(e.message ?? e).split("\n")[0]);
    process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {});
  }
  console.log(hasil.every(Boolean) ? "F20-ALL-OK" : "F20-GAGAL");
  if (!hasil.every(Boolean)) process.exitCode = 1;
})();
