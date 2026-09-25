// Port TypeScript dari Webapp Keuangan js/db-lokal.js (Fase B1 rewrite).
// Kontrak SAMA: {data,code} / {error,code} / null (ubah hilang) / boolean.
// Aman SSR: semua sentuhan window/IndexedDB terjadi saat fungsi dipanggil
// (halaman selalu client component), plus fallback localStorage.
export type Jenis = "masuk" | "keluar";
export type Arah = "hutang" | "piutang";
export type StatusHutang = "belum" | "lunas";

export interface Produk {
  id: number;
  nama: string;
  kategori: string;
}
export interface Transaksi {
  id: number;
  jenis: Jenis;
  jumlah: number;
  produkId: number | null;
  kategori: string | null;
  tanggal: string;
}
export interface Catatan {
  id: number;
  transaksiId: number;
  isi: string;
}
export interface Hutang {
  id: number;
  arah: Arah;
  pihak: string;
  jumlah: number;
  dibayar: number;
  tanggal: string;
  jatuhTempo: string | null;
  keterangan: string;
  status: StatusHutang;
  transaksiIdLunas: number | null;
}
export type Hasil<T> = { data: T; code: number } | { error: string; code: number };
export interface Saldo {
  masuk: number;
  keluar: number;
  saldo: number;
}
export interface RingkasKat {
  kategori: string;
  total: number;
  persen: number;
}
export interface FilterTanggal {
  dari?: string;
  sampai?: string;
}
interface PatchTransaksi {
  jumlah?: number;
  jenis?: string;
  tanggal?: string;
  kategori?: string | null;
}
interface InputTransaksi {
  jenis?: string;
  jumlah?: number;
  produkId?: number | null;
  kategori?: string | null;
  tanggal?: string;
}
interface InputHutang {
  arah?: string;
  pihak?: string;
  jumlah?: number;
  tanggal?: string;
  jatuhTempo?: string | null;
  keterangan?: string;
}

const NAMA_DB = "keuanganDB";
const VERSI_DB = 1;

export function tanggalHariIni(d = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function validTanggalLokal(s: unknown): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s ?? ""));
}

// --- Lapisan simpan rendah: IndexedDB, fallback localStorage ---
let _db: IDBDatabase | null = null;
let _dbSiap: Promise<IDBDatabase | null> | null = null;
let _pakaiLS = false;
let _cekLingkungan = false;

function dbSiap(): Promise<IDBDatabase | null> {
  if (_dbSiap) return _dbSiap;
  if (!_cekLingkungan) {
    _cekLingkungan = true;
    _pakaiLS = typeof window === "undefined" || typeof window.indexedDB === "undefined";
  }
  if (_pakaiLS) {
    _dbSiap = Promise.resolve(null);
    return _dbSiap;
  }
  _dbSiap = new Promise((selesai) => {
    let req: IDBOpenDBRequest;
    try {
      req = window.indexedDB.open(NAMA_DB, VERSI_DB);
    } catch {
      _pakaiLS = true;
      selesai(null);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("produk"))
        db.createObjectStore("produk", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("transaksi"))
        db.createObjectStore("transaksi", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("hutang"))
        db.createObjectStore("hutang", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("catatan")) {
        const c = db.createObjectStore("catatan", { keyPath: "id", autoIncrement: true });
        c.createIndex("transaksiId", "transaksiId", { unique: false });
      }
    };
    req.onsuccess = () => {
      _db = req.result;
      selesai(_db);
    };
    req.onerror = () => {
      _pakaiLS = true;
      selesai(null);
    };
  });
  return _dbSiap;
}

type Baris = Record<string, unknown> & { id?: number | null };

function lsBaca(store: string): Baris[] {
  try {
    const mentah = window.localStorage.getItem(`${NAMA_DB}:${store}`);
    const arr = mentah ? (JSON.parse(mentah) as unknown) : [];
    return Array.isArray(arr) ? (arr as Baris[]) : [];
  } catch {
    return [];
  }
}

function lsTulis(store: string, arr: Baris[]): void {
  try {
    window.localStorage.setItem(`${NAMA_DB}:${store}`, JSON.stringify(arr));
  } catch {
    /* abaikan */
  }
}

function lsIdBaru(arr: Baris[]): number {
  return arr.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1;
}

function dbSemua<T>(store: string): Promise<T[]> {
  return dbSiap().then(
    () =>
      new Promise<T[]>((selesai, gagal) => {
        if (_pakaiLS || !_db) {
          selesai(lsBaca(store) as T[]);
          return;
        }
        const tx = _db.transaction(store, "readonly");
        const q = tx.objectStore(store).getAll();
        q.onsuccess = () => selesai((q.result as T[]) || []);
        q.onerror = () => gagal(q.error);
      })
  );
}

function dbAmbil<T>(store: string, id: number): Promise<T | null> {
  return dbSiap().then(
    () =>
      new Promise<T | null>((selesai, gagal) => {
        if (_pakaiLS || !_db) {
          const ketemu = lsBaca(store).filter((r) => r.id === id);
          selesai((ketemu[0] as T) ?? null);
          return;
        }
        const tx = _db.transaction(store, "readonly");
        const q = tx.objectStore(store).get(id);
        q.onsuccess = () => selesai((q.result as T) ?? null);
        q.onerror = () => gagal(q.error);
      })
  );
}

function dbSimpan<T>(store: string, baris: T): Promise<T> {
  return dbSiap().then(
    () =>
      new Promise<T>((selesai, gagal) => {
        if (_pakaiLS || !_db) {
          const arr = lsBaca(store);
          const salin = { ...(baris as Baris) } as T & { id?: number | null };
          if (salin.id === undefined || salin.id === null) {
            salin.id = lsIdBaru(arr);
            arr.push(salin);
          } else {
            const i = arr.findIndex((r) => r.id === salin.id);
            if (i === -1) arr.push(salin);
            else arr[i] = salin;
          }
          lsTulis(store, arr);
          selesai({ ...(salin as T) });
          return;
        }
        const tx = _db.transaction(store, "readwrite");
        const simpan = { ...(baris as Baris) };
        if (simpan.id === undefined || simpan.id === null) delete simpan.id;
        tx.oncomplete = () => selesai(simpan as T);
        tx.onerror = () => gagal(tx.error);
        tx.onabort = () => gagal(tx.error ?? new Error("transaksi dibatalkan"));
        const q = tx.objectStore(store).put(simpan);
        q.onsuccess = () => {
          simpan.id = q.result as number;
        };
      })
  );
}

function dbHapus(store: string, id: number): Promise<boolean> {
  return dbSiap().then(
    () =>
      new Promise<boolean>((selesai, gagal) => {
        if (_pakaiLS || !_db) {
          const arr = lsBaca(store);
          const ada = arr.some((r) => r.id === id);
          lsTulis(
            store,
            arr.filter((r) => r.id !== id)
          );
          selesai(ada);
          return;
        }
        const tx = _db.transaction(store, "readwrite");
        let ada = false;
        tx.oncomplete = () => selesai(ada);
        tx.onerror = () => gagal(tx.error);
        tx.onabort = () => gagal(tx.error ?? new Error("transaksi dibatalkan"));
        const cek = tx.objectStore(store).get(id);
        cek.onsuccess = () => {
          if (!cek.result) {
            ada = false;
            return;
          }
          ada = true;
          tx.objectStore(store).delete(id);
        };
      })
  );
}

function dbKosongkan(store: string): Promise<void> {
  return dbSiap().then(
    () =>
      new Promise<void>((selesai, gagal) => {
        if (_pakaiLS || !_db) {
          lsTulis(store, []);
          selesai();
          return;
        }
        const tx = _db.transaction(store, "readwrite");
        const q = tx.objectStore(store).clear();
        q.onsuccess = () => selesai();
        q.onerror = () => gagal(q.error);
      })
  );
}

// --- Normalisasi kategori ---
function kapitalisasi(teks: unknown): string {
  const s = String(teks ?? "").trim();
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function normalisasiKategori(nama: unknown): Promise<string> {
  const bersih = String(nama ?? "").trim();
  if (!bersih) return "Lainnya";
  const daftar = await dbSemua<Produk>("produk");
  const cocok = daftar.filter(
    (p) => String(p.kategori ?? "").toLowerCase() === bersih.toLowerCase()
  );
  if (cocok.length) return cocok[0].kategori;
  return kapitalisasi(bersih);
}

async function kategoriDariProduk(produkId: number | null | undefined): Promise<string | null> {
  if (produkId === null || produkId === undefined) return null;
  const p = await dbAmbil<Produk>("produk", Number(produkId));
  return p ? p.kategori : null;
}

// --- Produk ---
export let cacheProduk: Produk[] = [];

export async function segarkanCacheProduk(): Promise<Produk[]> {
  const daftar = await dbSemua<Produk>("produk");
  daftar.sort((a, b) => a.id - b.id);
  cacheProduk = daftar;
  return cacheProduk;
}

export function kategoriOf(t: Transaksi): string {
  if (t.kategori) return t.kategori;
  if (t.produkId !== null && t.produkId !== undefined) {
    const p = cacheProduk.find((x) => x.id === t.produkId);
    if (p) return p.kategori;
  }
  return "Lainnya";
}

export async function addProduk(nama: unknown, kategori: unknown): Promise<Hasil<Produk>> {
  const bersih = String(nama ?? "").trim();
  if (!bersih) return { error: "Nama produk wajib", code: 400 };
  const daftar = await dbSemua<Produk>("produk");
  if (daftar.some((p) => String(p.nama ?? "").toLowerCase() === bersih.toLowerCase()))
    return { error: "Produk sudah ada", code: 400 };
  const baris = await dbSimpan<Produk>("produk", {
    id: null as unknown as number,
    nama: bersih,
    kategori: await normalisasiKategori(kategori),
  });
  await segarkanCacheProduk();
  return { data: baris, code: 201 };
}

export async function updateProduk(
  id: number,
  patch: { nama?: string; kategori?: string }
): Promise<Produk | null | { error: string; code: number }> {
  const lama = await dbAmbil<Produk>("produk", Number(id));
  if (!lama) return null;
  if (patch.nama !== undefined) {
    const bersih = String(patch.nama ?? "").trim();
    if (!bersih) return { error: "Nama produk wajib", code: 400 };
    const daftar = await dbSemua<Produk>("produk");
    if (
      daftar.some(
        (p) => p.id !== lama.id && String(p.nama ?? "").toLowerCase() === bersih.toLowerCase()
      )
    )
      return { error: "Produk sudah ada", code: 400 };
    lama.nama = bersih;
  }
  if (patch.kategori !== undefined) lama.kategori = await normalisasiKategori(patch.kategori);
  const baris = await dbSimpan<Produk>("produk", lama);
  await segarkanCacheProduk();
  return baris;
}

export async function deleteProduk(id: number): Promise<boolean> {
  const ok = await dbHapus("produk", Number(id));
  if (!ok) return false;
  await segarkanCacheProduk();
  return true;
}

// --- Transaksi ---
export async function getTransaksi(): Promise<Transaksi[]> {
  const daftar = await dbSemua<Transaksi>("transaksi");
  daftar.sort((a, b) => a.id - b.id);
  return daftar;
}

export async function addTransaksi(input: InputTransaksi): Promise<Hasil<Transaksi>> {
  const jenis = String(input.jenis ?? "");
  const jumlah = Number(input.jumlah);
  if (jenis !== "masuk" && jenis !== "keluar")
    return { error: "Jenis harus masuk/keluar", code: 400 };
  if (!(jumlah > 0)) return { error: "Jumlah harus angka > 0 (Rp)", code: 400 };
  const produkId =
    input.produkId === null || input.produkId === undefined ? null : Number(input.produkId);
  const kategori =
    input.kategori !== undefined && input.kategori !== null
      ? await normalisasiKategori(input.kategori)
      : await kategoriDariProduk(produkId);
  const tanggal =
    input.tanggal && validTanggalLokal(input.tanggal) ? input.tanggal : tanggalHariIni();
  const baris = await dbSimpan<Transaksi>("transaksi", {
    id: null as unknown as number,
    jenis: jenis as Jenis,
    jumlah,
    produkId,
    kategori,
    tanggal,
  });
  return { data: baris, code: 201 };
}

export async function updateTransaksi(
  id: number,
  patch: PatchTransaksi
): Promise<Transaksi | null | { error: string; code: number }> {
  const lama = await dbAmbil<Transaksi>("transaksi", Number(id));
  if (!lama) return null;
  if (patch.jumlah !== undefined && !(Number(patch.jumlah) > 0))
    return { error: "Jumlah harus angka > 0 (Rp)", code: 400 };
  if (patch.jenis !== undefined && patch.jenis !== "masuk" && patch.jenis !== "keluar")
    return { error: "Jenis harus masuk/keluar", code: 400 };
  if (patch.tanggal !== undefined && !validTanggalLokal(patch.tanggal))
    return { error: "Tanggal harus YYYY-MM-DD", code: 400 };
  if (patch.jumlah !== undefined) lama.jumlah = Number(patch.jumlah);
  if (patch.jenis !== undefined) lama.jenis = patch.jenis as Jenis;
  if (patch.tanggal !== undefined) lama.tanggal = patch.tanggal;
  if (patch.kategori !== undefined) lama.kategori = await normalisasiKategori(patch.kategori);
  return dbSimpan<Transaksi>("transaksi", lama);
}

export async function deleteTransaksi(id: number): Promise<boolean> {
  const ok = await dbHapus("transaksi", Number(id));
  if (!ok) return false;
  const semua = await dbSemua<Catatan>("catatan");
  for (const c of semua.filter((x) => x.transaksiId === Number(id)))
    await dbHapus("catatan", c.id);
  return true;
}

// --- Catatan ---
export async function getCatatan(transaksiId: number): Promise<Catatan[]> {
  const semua = await dbSemua<Catatan>("catatan");
  return semua
    .filter((c) => c.transaksiId === Number(transaksiId))
    .sort((a, b) => a.id - b.id);
}

export async function muatSemuaCatatan(): Promise<Catatan[]> {
  const semua = await dbSemua<Catatan>("catatan");
  semua.sort((a, b) => a.id - b.id);
  return semua;
}

export async function addCatatan(
  transaksiId: number,
  isi: unknown
): Promise<Hasil<Catatan>> {
  const induk = await dbAmbil<Transaksi>("transaksi", Number(transaksiId));
  if (!induk) return { error: "Transaksi tidak ditemukan", code: 404 };
  const bersih = String(isi ?? "").trim();
  if (!bersih) return { error: "Isi catatan wajib", code: 400 };
  const baris = await dbSimpan<Catatan>("catatan", {
    id: null as unknown as number,
    transaksiId: Number(transaksiId),
    isi: bersih,
  });
  return { data: baris, code: 201 };
}

export async function updateCatatan(
  id: number,
  isi: unknown
): Promise<Catatan | null | { error: string; code: number }> {
  const lama = await dbAmbil<Catatan>("catatan", Number(id));
  if (!lama) return null;
  const bersih = String(isi ?? "").trim();
  if (!bersih) return { error: "Isi catatan wajib", code: 400 };
  lama.isi = bersih;
  return dbSimpan<Catatan>("catatan", lama);
}

export async function deleteCatatan(id: number): Promise<boolean> {
  return dbHapus("catatan", Number(id));
}

// --- Hutang ---
export async function getHutang(): Promise<Hutang[]> {
  const daftar = await dbSemua<Hutang>("hutang");
  daftar.sort((a, b) => a.id - b.id);
  return daftar;
}

export async function addHutang(input: InputHutang): Promise<Hasil<Hutang>> {
  const arah = String(input.arah ?? "");
  const jumlah = Number(input.jumlah);
  const pihak = String(input.pihak ?? "").trim();
  if (arah !== "hutang" && arah !== "piutang")
    return { error: "Arah harus hutang/piutang", code: 400 };
  if (!pihak) return { error: "Pihak wajib diisi", code: 400 };
  if (!(jumlah > 0)) return { error: "Jumlah harus angka > 0 (Rp)", code: 400 };
  let jatuhTempo: string | null = null;
  if (input.jatuhTempo !== undefined && input.jatuhTempo !== null && input.jatuhTempo !== "") {
    if (!validTanggalLokal(input.jatuhTempo))
      return { error: "Jatuh tempo harus YYYY-MM-DD", code: 400 };
    jatuhTempo = input.jatuhTempo;
  }
  const tanggal =
    input.tanggal && validTanggalLokal(input.tanggal) ? input.tanggal : tanggalHariIni();
  const baris = await dbSimpan<Hutang>("hutang", {
    id: null as unknown as number,
    arah: arah as Arah,
    pihak,
    jumlah,
    dibayar: 0,
    tanggal,
    jatuhTempo,
    keterangan: input.keterangan ? String(input.keterangan).trim() : "",
    status: "belum",
    transaksiIdLunas: null,
  });
  return { data: baris, code: 201 };
}

export async function bayarHutang(
  id: number,
  nominal: unknown
): Promise<Hasil<Hutang>> {
  const h = await dbAmbil<Hutang>("hutang", Number(id));
  if (!h) return { error: "Hutang tidak ditemukan", code: 404 };
  const n = Number(nominal);
  if (!(n > 0)) return { error: "Nominal harus angka > 0 (Rp)", code: 400 };
  if (h.status === "lunas") return { error: "Sudah lunas", code: 400 };
  const sisa = h.jumlah - h.dibayar;
  if (n > sisa) return { error: `Nominal melebihi sisa Rp${sisa}`, code: 400 };
  const jenisKas: Jenis = h.arah === "hutang" ? "keluar" : "masuk";
  const kas = await dbSimpan<Transaksi>("transaksi", {
    id: null as unknown as number,
    jenis: jenisKas,
    jumlah: n,
    produkId: null,
    kategori: null,
    tanggal: tanggalHariIni(),
  });
  await dbSimpan<Catatan>("catatan", {
    id: null as unknown as number,
    transaksiId: kas.id,
    isi: `Bayar ${h.arah === "hutang" ? "hutang ke " : "piutang "}${h.pihak} Rp${n}`,
  });
  h.dibayar = h.dibayar + n;
  if (h.dibayar >= h.jumlah) {
    h.status = "lunas";
    h.transaksiIdLunas = kas.id;
  }
  const baris = await dbSimpan<Hutang>("hutang", h);
  return { data: baris, code: 200 };
}

export async function lunaskanHutang(id: number): Promise<Hasil<Hutang>> {
  const h = await dbAmbil<Hutang>("hutang", Number(id));
  if (!h) return { error: "Hutang tidak ditemukan", code: 404 };
  if (h.status === "lunas") return { error: "Sudah lunas", code: 400 };
  const sisa = h.jumlah - h.dibayar;
  const jenisKas: Jenis = h.arah === "hutang" ? "keluar" : "masuk";
  const kas = await dbSimpan<Transaksi>("transaksi", {
    id: null as unknown as number,
    jenis: jenisKas,
    jumlah: sisa,
    produkId: null,
    kategori: null,
    tanggal: tanggalHariIni(),
  });
  await dbSimpan<Catatan>("catatan", {
    id: null as unknown as number,
    transaksiId: kas.id,
    isi: `Pelunasan ${h.arah === "hutang" ? "hutang ke " : "piutang "}${h.pihak} Rp${sisa}`,
  });
  h.dibayar = h.jumlah;
  h.status = "lunas";
  h.transaksiIdLunas = kas.id;
  const baris = await dbSimpan<Hutang>("hutang", h);
  return { data: baris, code: 200 };
}

export async function deleteHutang(id: number): Promise<boolean | { error: string; code: number }> {
  const h = await dbAmbil<Hutang>("hutang", Number(id));
  if (!h) return false;
  if (h.status === "lunas") return { error: "Sudah lunas, tidak boleh dihapus", code: 400 };
  await dbHapus("hutang", Number(id));
  return true;
}

// --- Saldo + ringkasan ---
function dalamPeriode(tanggal: string, filter?: FilterTanggal): boolean {
  if (filter?.dari && tanggal < filter.dari) return false;
  if (filter?.sampai && tanggal > filter.sampai) return false;
  return true;
}

export async function getSaldo(filter?: FilterTanggal): Promise<Saldo> {
  const daftar = await dbSemua<Transaksi>("transaksi");
  let masuk = 0;
  let keluar = 0;
  for (const t of daftar) {
    if (!dalamPeriode(t.tanggal, filter)) continue;
    if (t.jenis === "masuk") masuk += Number(t.jumlah);
    else keluar += Number(t.jumlah);
  }
  return { masuk, keluar, saldo: masuk - keluar };
}

export async function getRingkasanKategori(filter?: FilterTanggal): Promise<RingkasKat[]> {
  const daftar = await dbSemua<Transaksi>("transaksi");
  const total: Record<string, number> = {};
  for (const t of daftar) {
    if (t.jenis !== "keluar") continue;
    if (!dalamPeriode(t.tanggal, filter)) continue;
    let kat: string | null = t.kategori;
    if (!kat && t.produkId !== null && t.produkId !== undefined) {
      const p = cacheProduk.find((x) => x.id === t.produkId);
      if (p) kat = p.kategori;
    }
    kat = kat || "Lainnya";
    total[kat] = (total[kat] || 0) + Number(t.jumlah);
  }
  const keluarSemua = Object.values(total).reduce((s, v) => s + v, 0);
  return Object.entries(total)
    .map(([kategori, v]) => ({
      kategori,
      total: v,
      persen: keluarSemua > 0 ? Math.round((v / keluarSemua) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

// --- Impor + reset (Pengaturan) ---
export async function imporBackup(data: {
  produk?: Produk[];
  transaksi?: Transaksi[];
  catatan?: Catatan[];
  hutang?: Hutang[];
}): Promise<{ produk: number; transaksi: number; catatan: number; hutang: number }> {
  if (
    !data ||
    !Array.isArray(data.transaksi) ||
    !Array.isArray(data.hutang) ||
    !Array.isArray(data.produk) ||
    !Array.isArray(data.catatan)
  )
    throw new Error("Format backup tidak dikenal");
  await hapusSemuaData();
  for (const s of ["produk", "transaksi", "catatan", "hutang"] as const)
    for (const baris of ((data[s] ?? []) as unknown as Baris[])) await dbSimpan(s, { ...baris });
  await segarkanCacheProduk();
  return {
    produk: data.produk.length,
    transaksi: data.transaksi.length,
    catatan: data.catatan.length,
    hutang: data.hutang.length,
  };
}

export async function hapusSemuaData(): Promise<void> {
  for (const s of ["produk", "transaksi", "catatan", "hutang"]) await dbKosongkan(s);
  cacheProduk = [];
}

export function formatRupiah(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// --- Batas harian: 1 angka di localStorage. Belum diatur = 500rb; 0 = sembunyi.
export function getBatasHarian(): number {
  try {
    const mentah = window.localStorage.getItem("batasHarian");
    if (mentah === null || mentah === "") return 500000;
    return Number(mentah) || 0;
  } catch {
    return 500000;
  }
}

export function setBatasHarian(v: number): void {
  try {
    window.localStorage.setItem("batasHarian", String(Number(v) || 0));
  } catch {
    /* abaikan */
  }
}

function selCSV(teks: unknown): string {
  return `"${String(teks).replace(/"/g, '""')}"`;
}

// --- Ekspor CSV seluruh data perangkat (dipakai toolbar Transaksi + Pengaturan).
export async function eksporCSV(): Promise<string> {
  const [produk, transaksi, catatan] = await Promise.all([
    dbSemua<Produk>("produk"),
    getTransaksi(),
    muatSemuaCatatan(),
  ]);
  const katOf = (t: Transaksi): string => {
    if (t.kategori) return t.kategori;
    const p = produk.find((x) => x.id === t.produkId);
    return p ? p.kategori : "Lainnya";
  };
  const baris = ["tanggal,jenis,jumlah,kategori,catatan"];
  for (const t of transaksi) {
    const notes = catatan
      .filter((c) => c.transaksiId === t.id)
      .map((c) => c.isi)
      .join("; ");
    baris.push(
      [selCSV(t.tanggal), selCSV(t.jenis), t.jumlah, selCSV(katOf(t)), selCSV(notes)].join(",")
    );
  }
  return baris.join("\r\n");
}

export function unduhFile(nama: string, teks: string, tipe: string): void {
  const blob = new Blob([teks], { type: tipe });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nama;
  a.click();
  URL.revokeObjectURL(a.href);
}
