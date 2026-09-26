// Tema terang/gelap: simpan pilihan (ikut OS bila belum memilih).
// Perubahan disiarkan via event "famvault-tema" agar semua ToggleTema sinkron
// dan grafik (baca .dark saat dibuat) bisa digambar ulang.
export type Tema = "terang" | "gelap";

export const KUNCI_TEMA = "famvault-tema";
export const EVENT_TEMA = "famvault-tema";

export function temaAwal(): Tema {
  if (typeof window === "undefined") return "terang";
  const simpan = window.localStorage.getItem(KUNCI_TEMA);
  if (simpan === "gelap" || simpan === "terang") return simpan;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "gelap" : "terang";
}

export function terapkanTema(t: Tema) {
  document.documentElement.classList.toggle("dark", t === "gelap");
  window.localStorage.setItem(KUNCI_TEMA, t);
  window.dispatchEvent(new CustomEvent<Tema>(EVENT_TEMA, { detail: t }));
}
