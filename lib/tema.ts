// Tema: sistem (ikut OS, live) / terang / gelap.
// Perubahan disiarkan via event "famvault-tema" agar semua PemilihTema sinkron
// dan grafik (baca .dark saat dibuat) bisa digambar ulang.
export type Tema = "sistem" | "terang" | "gelap";

export const KUNCI_TEMA = "famvault-tema";
export const EVENT_TEMA = "famvault-tema";

export function bacaPilihan(): Tema {
  if (typeof window === "undefined") return "sistem";
  const s = window.localStorage.getItem(KUNCI_TEMA);
  return s === "terang" || s === "gelap" || s === "sistem" ? s : "sistem";
}

function gelapDari(p: Tema): boolean {
  if (p === "gelap") return true;
  if (p === "terang") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function terapkanTema(p: Tema) {
  document.documentElement.classList.toggle("dark", gelapDari(p));
  window.localStorage.setItem(KUNCI_TEMA, p);
  window.dispatchEvent(new CustomEvent<Tema>(EVENT_TEMA, { detail: p }));
}

// Mode sistem: bila OS ganti (mis. HP masuk mode malam), ikut tanpa reload.
export function pantauSistem(): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  function saatBerubah() {
    if (bacaPilihan() === "sistem") terapkanTema("sistem");
  }
  mq.addEventListener("change", saatBerubah);
  return () => mq.removeEventListener("change", saatBerubah);
}
