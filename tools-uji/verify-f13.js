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
  page.on("dialog", (d) => d.accept()); // confirm() zona bahaya (2x)
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  try {
    await page.goto(`${BASE}/hutang`, { waitUntil: "load", timeout: 120000 });
    // Validasi: pihak kosong -> pesan
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /Pihak wajib/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 30000 });
    lapor("validasi pihak wajib", true);
    // Tulis hutang Budi 100000
    await page.fill("#pihak", "BudiF13");
    await page.fill("#jml-hutang", "100000");
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /BudiF13 Rp100\.000 tercatat/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 30000 });
    lapor("tambah hutang", true);
    // Bayar 40000 -> sisa 60000
    await page.locator("li", { hasText: "BudiF13" }).getByRole("button", { name: /^Cicil$/ }).click();
    await page.waitForSelector("#nom-bayar", { polling: 100, timeout: 15000 });
    await page.fill("#nom-bayar", "40000");
    await page.locator('[role="dialog"]').getByRole("button", { name: /Simpan cicilan/ }).click();
    await page.waitForFunction(() => /sisa Rp60\.000/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 30000 });
    lapor("bayar sebagian + sisa", true);
    // Bayar melebihi sisa -> ditolak
    await page.locator("li", { hasText: "BudiF13" }).getByRole("button", { name: /^Cicil$/ }).click();
    await page.waitForSelector("#nom-bayar", { polling: 100, timeout: 15000 });
    await page.fill("#nom-bayar", "999999");
    await page.locator('[role="dialog"]').getByRole("button", { name: /Simpan cicilan/ }).click();
    await page.waitForFunction(() => /melebihi sisa/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 30000 });
    await page.locator('[role="dialog"]').getByRole("button", { name: /^Batal$/ }).click();
    lapor("tolak bayar melebihi sisa", true);
    // Lunaskan -> lunas + tombol bayar hilang
    await page.locator("li", { hasText: "BudiF13" }).getByRole("button", { name: /^Lunaskan$/ }).click();
    await page.waitForFunction(() => /Lunas \+ tercatat/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 30000 });
    const bayarHilang = await page.locator("li", { hasText: "BudiF13" }).getByRole("button", { name: /^Cicil$/ }).count();
    if (bayarHilang !== 0) throw new Error("tombol cicil masih ada setelah lunas");
    lapor("lunaskan + audit", true);
    // Kas auto pelunasan berkategori Hutang (bukan Lainnya)
    await page.goto(`${BASE}/transaksi`, { waitUntil: "load", timeout: 120000 });
    await page.waitForFunction(() => /Pelunasan hutang ke BudiF13/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 30000 });
    await page.waitForFunction(() => /Hutang - \d{2}\/\d{2}\/\d{4}/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 30000 });
    lapor("kas auto kategori Hutang", true);
    await page.goto(`${BASE}/hutang`, { waitUntil: "load", timeout: 120000 });
    // Hapus lunas via lib langsung tak ada UI -> cek tombol hapus hilang
    const hapusAda = await page.locator("li", { hasText: "BudiF13" }).getByRole("button", { name: /^Hapus$/ }).count();
    if (hapusAda !== 0) throw new Error("tombol hapus masih ada untuk lunas");
    lapor("lunas tanpa tombol hapus", true);
    // Tulis + hapus baris belum (dialog)
    await page.fill("#pihak", "HapusF13");
    await page.fill("#jml-hutang", "5000");
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /HapusF13/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 30000 });
    await page.locator("li", { hasText: "HapusF13" }).getByRole("button", { name: /^Hapus$/ }).click();
    await page.waitForSelector('[role="dialog"]', { polling: 100, timeout: 15000 });
    await page.locator('[role="dialog"]').getByRole("button", { name: "Hapus" }).click();
    await page.waitForFunction(() => /Catatan dihapus/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 30000 });
    lapor("hapus baris belum via dialog", true);
    // F1.3b: bayar bertanggal lampau + panel Rincian terurut
    await page.fill("#pihak", "RincianF13");
    await page.fill("#jml-hutang", "100000");
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /RincianF13/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 30000 });
    await page.locator("li", { hasText: "RincianF13" }).getByRole("button", { name: /^Cicil$/ }).click();
    await page.waitForSelector("#tgl-bayar", { polling: 100, timeout: 15000 });
    await page.fill("#tgl-bayar", "2026-09-20");
    await page.fill("#nom-bayar", "30000");
    await page.locator('[role="dialog"]').getByRole("button", { name: /Simpan cicilan/ }).click();
    await page.waitForFunction(() => /sisa Rp70\.000/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 30000 });
    await page.locator("li", { hasText: "RincianF13" }).getByRole("button", { name: /^Cicil$/ }).click();
    await page.waitForSelector("#tgl-bayar", { polling: 100, timeout: 15000 });
    await page.fill("#nom-bayar", "20000");
    await page.locator('[role="dialog"]').getByRole("button", { name: /Simpan cicilan/ }).click();
    await page.waitForFunction(() => /sisa Rp50\.000/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 30000 });
    await page.locator("li", { hasText: "RincianF13" }).getByRole("button", { name: /^Rincian$/ }).click();
    await page.waitForFunction(() => {
      const t = document.body.textContent ?? "";
      const i1 = t.indexOf("20/09/2026");
      const i2 = t.indexOf("Rp30.000");
      const i3 = t.indexOf("Rp20.000");
      return i1 !== -1 && i2 !== -1 && i3 !== -1 && i1 < i2 && i2 < i3;
    }, null, { polling: 100, timeout: 30000 });
    lapor("cicilan bertanggal + rincian terurut", true);
    // Badge arah + subtotal terpecah: 1 hutang + 1 piutang
    async function langkah(label, fn) {
      try {
        await fn();
        console.log("STEP-OK: " + label);
      } catch (e) {
        let st = "?";
        try {
          st = await page.evaluate(() => {
            const ps = Array.from(document.querySelectorAll("p")).map((x) => x.textContent);
            const rows = Array.from(document.querySelectorAll("ul.space-y-2 > li")).map((li) =>
              (li.textContent ?? "").slice(0, 60).replace(/\s+/g, " ")
            );
            return JSON.stringify({ pesan: ps.filter((t) => /tercatat|Gagal/i.test(t ?? "")), rows });
          });
        } catch (ex) {
          st = "EVAL-GAGAL: " + String(ex.message).slice(0, 100);
        }
        console.log("STEP-GAGAL: " + label + " || " + st);
        throw e;
      }
    }
    await langkah("tabHutang", () => page.locator("#tab-arah").getByRole("tab", { name: /^Hutang/ }).click());
    await langkah("fillPihakH", () => page.fill("#pihak", "ArahH"));
    await langkah("fillJmlH", () => page.fill("#jml-hutang", "30000"));
    await langkah("submitH", () => page.click('button[type="submit"]'));
    await langkah("waitArahH", () => page.waitForFunction(() => /ArahH/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 30000 }));
    await langkah("tabPiutang", () => page.locator("#tab-arah").getByRole("tab", { name: /^Piutang/ }).click());
    await langkah("fillPihakP", () => page.fill("#pihak", "ArahP"));
    await langkah("fillJmlP", () => page.fill("#jml-hutang", "70000"));
    await langkah("submitP", () => page.click('button[type="submit"]'));
    await langkah("waitArahP", () => page.waitForFunction(() => /ArahP/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 30000 }));
    // Subtotal riil: hutang = Budi 0 + Rincian 50000 + ArahH 30000 = 80000
    await langkah("assertGabung", () => page.waitForFunction(() => {
      const t = document.body.textContent ?? "";
      return /HUTANG/.test(t) && /PIUTANG/.test(t) && /Sisa hutang: Rp80\.000/.test(t) && /Sisa piutang: Rp70\.000/.test(t);
    }, null, { timeout: 30000 }));
    lapor("badge arah + subtotal terpecah", true);
    // Kas auto pelunasan piutang berkategori Piutang
    await page.locator("li", { hasText: "ArahP" }).getByRole("button", { name: /^Lunaskan$/ }).click();
    await page.waitForFunction(() => /Lunas \+ tercatat/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 30000 });
    await page.goto(`${BASE}/transaksi`, { waitUntil: "load", timeout: 120000 });
    await page.waitForFunction(() => /Pelunasan piutang ArahP/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 30000 });
    await page.waitForFunction(() => /Piutang - \d{2}\/\d{2}\/\d{4}/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 30000 });
    lapor("kas auto kategori Piutang", true);
    // Zona Bahaya: set batas -> Dialog hapus -> batas ikut hilang
    await page.goto(`${BASE}/pengaturan`, { waitUntil: "load", timeout: 120000 });
    await page.fill("#batas", "123456");
    await page.getByRole("button", { name: /^Simpan Batas$/ }).click();
    await page.waitForFunction(() => /Batas disimpan/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 30000 });
    await page.getByRole("button", { name: /Hapus Semua Data/ }).click();
    await page.waitForSelector('[role="dialog"]', { polling: 100, timeout: 15000 });
    await page.locator('[role="dialog"]').getByRole("button", { name: /Ya, hapus semua/ }).click();
    await page.waitForFunction(() => /Semua data dihapus/.test(document.body.textContent ?? ""), null, { polling: 100, timeout: 30000 });
    const sisaBatas = await page.evaluate(() => window.localStorage.getItem("batasHarian"));
    if (sisaBatas !== null) throw new Error("batasHarian masih ada: " + sisaBatas);
    lapor("zona bahaya hapus batas juga", true);
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
