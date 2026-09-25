// Verifikasi F1.3: hutang tulis/bayar/lunas/hapus + validasi + progress.
// Server persisten (SKIP_SPAWN=1, UJI_PORT).
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
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  try {
    await page.goto(`${BASE}/hutang`, { waitUntil: "load", timeout: 120000 });
    // Validasi: pihak kosong -> pesan
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /Pihak wajib/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    lapor("validasi pihak wajib", true);
    // Tulis hutang Budi 100000
    await page.fill("#pihak", "BudiF13");
    await page.fill("#jml-hutang", "100000");
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /BudiF13 Rp100\.000 tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    lapor("tambah hutang", true);
    // Bayar 40000 -> sisa 60000
    await page.locator("li", { hasText: "BudiF13" }).getByRole("button", { name: /^Bayar$/ }).click();
    await page.waitForSelector("#nom-bayar", { timeout: 8000 });
    await page.fill("#nom-bayar", "40000");
    await page.locator('[role="dialog"]').getByRole("button", { name: /Simpan pembayaran/ }).click();
    await page.waitForFunction(() => /sisa Rp60\.000/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    lapor("bayar sebagian + sisa", true);
    // Bayar melebihi sisa -> ditolak
    await page.locator("li", { hasText: "BudiF13" }).getByRole("button", { name: /^Bayar$/ }).click();
    await page.waitForSelector("#nom-bayar", { timeout: 8000 });
    await page.fill("#nom-bayar", "999999");
    await page.locator('[role="dialog"]').getByRole("button", { name: /Simpan pembayaran/ }).click();
    await page.waitForFunction(() => /melebihi sisa/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    await page.locator('[role="dialog"]').getByRole("button", { name: /^Batal$/ }).click();
    lapor("tolak bayar melebihi sisa", true);
    // Lunaskan -> lunas + tombol bayar hilang
    await page.locator("li", { hasText: "BudiF13" }).getByRole("button", { name: /^Lunaskan$/ }).click();
    await page.waitForFunction(() => /Lunas \+ tercatat/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    const bayarHilang = await page.locator("li", { hasText: "BudiF13" }).getByRole("button", { name: /^Bayar$/ }).count();
    if (bayarHilang !== 0) throw new Error("tombol bayar masih ada setelah lunas");
    lapor("lunaskan + audit", true);
    // Hapus lunas via lib langsung tak ada UI -> cek tombol hapus hilang
    const hapusAda = await page.locator("li", { hasText: "BudiF13" }).getByRole("button", { name: /^Hapus$/ }).count();
    if (hapusAda !== 0) throw new Error("tombol hapus masih ada untuk lunas");
    lapor("lunas tanpa tombol hapus", true);
    // Tulis + hapus baris belum (dialog)
    await page.fill("#pihak", "HapusF13");
    await page.fill("#jml-hutang", "5000");
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /HapusF13/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    await page.locator("li", { hasText: "HapusF13" }).getByRole("button", { name: /^Hapus$/ }).click();
    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    await page.locator('[role="dialog"]').getByRole("button", { name: "Hapus" }).click();
    await page.waitForFunction(() => /Catatan dihapus/.test(document.body.textContent ?? ""), null, { timeout: 10000 });
    lapor("hapus baris belum via dialog", true);
    const serius = errs.filter((m) => !/favicon/i.test(m));
    lapor("console bersih", serius.length === 0, serius.slice(0, 2).join(" | "));
  } catch (e) {
    lapor("FATAL", false, String(e.message ?? e).split("\n")[0]);
    process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {});
  }
  console.log(hasil.every(Boolean) ? "F13-ALL-OK" : "F13-GAGAL");
  if (!hasil.every(Boolean)) process.exitCode = 1;
})();
