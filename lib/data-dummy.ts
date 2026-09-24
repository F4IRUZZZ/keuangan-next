export type Jenis = "masuk" | "keluar";

export interface Transaksi {
  id: number;
  jenis: Jenis;
  judul: string;
  kategori: string;
  tanggal: string;
  jumlah: number;
}

export const DUMMY_AWAL: Transaksi[] = [
  { id: 1, jenis: "masuk", judul: "Gaji Pokok & Bonus", kategori: "Pendapatan", tanggal: "2026-09-24", jumlah: 12500000 },
  { id: 2, jenis: "keluar", judul: "Makan Siang Resto Sederhana", kategori: "Makan & Minum", tanggal: "2026-09-24", jumlah: 45000 },
  { id: 3, jenis: "masuk", judul: "Proyek Branding Logo", kategori: "Freelance", tanggal: "2026-09-23", jumlah: 2350000 },
  { id: 4, jenis: "keluar", judul: "Belanja Dapur & Kebersihan", kategori: "Belanja", tanggal: "2026-09-23", jumlah: 255000 },
  { id: 5, jenis: "keluar", judul: "Bensin Pertamax Motor", kategori: "Transport", tanggal: "2026-09-22", jumlah: 20000 },
];

export function rupiah(n: number): string {
  return "Rp" + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
