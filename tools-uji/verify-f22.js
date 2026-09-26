// Verifikasi F2.2: toggle tema + persist + chart ikut + font Geist +
// koma-titik id-ID + badge amber LEWAT TEMPO.
// Pakai server persisten (SKIP_SPAWN=1, UJI_PORT) — jangan spawn per run.
const { chromium } = require("D:\\Project Developments\\GITHUB\\Webapp Keuangan(Ga Tuntas)\\tools\\uji\\node_modules\\playwright-core");

const PORT = Number(process.env.UJI_PORT || 3003);
const BASE = `http://localhost:${PORT}`;
const hasil = [];
const lapor = (n, ok, d) => {
  hasil.push(ok);
  console.log(`${ok ? "ok: " : "GAGAL: "}${n}${d ? ` — ${d}` : ""}`);
};

function kemarinISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  try {
    // Seed: 1 keluar 50000 + 1 hutang lewat tempo
    await page.goto(`${BASE}/transaksi`, { waitUntil: "load", timeout: 120000 });
    await page.locator("#tab-form").getByRole("tab", { name: /^Keluar/ }).click();
    await page.fill("#jml", "50000");
    await page.click("#kombo-kat");
    await page.waitForSelector('[role="listbox"]', { timeout: 8000 });
    await page.fill('input[aria-label="Cari kategori"]', "TesF22");
    await page.getByRole("button", { name: '+ Tambah "TesF22"' }).click();
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    await page.goto(`${BASE}/hutang`, { waitUntil: "load", timeout: 120000 });
    await page.fill("#pihak", "TempoF22");
    await page.fill("#jml-hutang", "10000");
    await page.fill("#tempo", kemarinISO());
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    // Dashboard: awal terang (headless default), angka id-ID bertitik
    await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 120000 });
    await page.waitForFunction(() => /50\.000/.test(document.body.textContent ?? ""), null, { timeout: 15000 });
    lapor("angka id-ID bertitik", true);
    const gelapAwal = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    if (gelapAwal) throw new Error("harusnya terang dulu");
    // Sidebar nihil kontrol tema (satu-satunya di Pengaturan)
    const kontrolNav = await page.locator("nav").getByRole("tab").count();
    if (kontrolNav > 0) throw new Error("sidebar masih ada kontrol tema");
    lapor("sidebar nihil kontrol tema", true);
    // Pengaturan: default segmen Sistem + ikut OS (terang)
    await page.goto(`${BASE}/pengaturan`, { waitUntil: "load", timeout: 120000 });
    const segAwal = await page.getByRole("tab", { selected: true }).textContent();
    if ((segAwal ?? "").trim() !== "Sistem") throw new Error("default bukan Sistem: " + segAwal);
    const simpanAwal = await page.evaluate(() => localStorage.getItem("famvault-tema"));
    if (simpanAwal !== null && simpanAwal !== "sistem") throw new Error("persist awal=" + simpanAwal);
    lapor("default Sistem ikut OS", true);
    // Segmen Gelap -> class + persist
    await page.getByRole("tab", { name: "Gelap", exact: true }).click();
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"), null, { timeout: 8000 });
    const simpan = await page.evaluate(() => localStorage.getItem("famvault-tema"));
    if (simpan !== "gelap") throw new Error("persist=" + simpan);
    lapor("segmen Gelap + persist", true);
    // Grafik tetap ter-render sesudah ganti tema (recreate)
    await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 120000 });
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"), null, { timeout: 8000 });
    await page.getByRole("tab", { name: "Mingguan", exact: true }).click();
    await page.waitForTimeout(800);
    const boxG = await page.$eval("#grafik-minggu", (el) => el.getBoundingClientRect().height);
    if (boxG < 50) throw new Error("grafik hilang sesudah toggle");
    lapor("grafik ikut tema", true);
    // Reload -> tetap gelap; segmen Terang -> terang + persist
    await page.reload({ waitUntil: "load", timeout: 120000 });
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"), null, { timeout: 8000 });
    await page.goto(`${BASE}/pengaturan`, { waitUntil: "load", timeout: 120000 });
    await page.getByRole("tab", { name: "Terang", exact: true }).click();
    await page.waitForFunction(() => !document.documentElement.classList.contains("dark"), null, { timeout: 8000 });
    const simpanT = await page.evaluate(() => localStorage.getItem("famvault-tema"));
    if (simpanT !== "terang") throw new Error("persist terang=" + simpanT);
    lapor("persist reload + segmen Terang", true);
    // Segmen Sistem -> ikut OS (terang di headless) + persist "sistem"
    await page.getByRole("tab", { name: "Sistem", exact: true }).click();
    await page.waitForFunction(() => !document.documentElement.classList.contains("dark"), null, { timeout: 8000 });
    const simpanS = await page.evaluate(() => localStorage.getItem("famvault-tema"));
    if (simpanS !== "sistem") throw new Error("persist sistem=" + simpanS);
    lapor("segmen Sistem ikut OS", true);
    // Font Geist terpakai
    const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    if (!/Geist/i.test(font)) throw new Error("font=" + font);
    lapor("font Geist", true);
    // Badge LEWAT TEMPO amber (bukan merah)
    await page.goto(`${BASE}/hutang`, { waitUntil: "load", timeout: 120000 });
    await page.waitForFunction(() => /LEWAT TEMPO/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    const badgeCls = await page.getByText("LEWAT TEMPO", { exact: true }).getAttribute("class");
    if (!badgeCls || !badgeCls.includes("bg-warning")) throw new Error("badge bukan warning");
    lapor("badge amber LEWAT TEMPO", true);
    const serius = errs.filter((m) => !/favicon/i.test(m));
    lapor("console bersih", serius.length === 0, serius.slice(0, 2).join(" | "));
  } catch (e) {
    lapor("FATAL", false, String(e.message ?? e).split("\n")[0]);
    process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {});
  }
  console.log(hasil.every(Boolean) ? "F22-ALL-OK" : "F22-GAGAL");
  if (!hasil.every(Boolean)) process.exitCode = 1;
})();
