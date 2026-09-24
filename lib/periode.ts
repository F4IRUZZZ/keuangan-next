import { tanggalHariIni } from "./db-lokal";

function potong(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function awalMingguIni(): string {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return potong(d);
}
export function akhirMingguIni(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return potong(d);
}
export function awalBulanIni(): string {
  const d = new Date();
  return potong(new Date(d.getFullYear(), d.getMonth(), 1));
}
export function akhirBulanIni(): string {
  const d = new Date();
  return potong(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}
export { tanggalHariIni };
