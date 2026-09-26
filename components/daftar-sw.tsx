"use client";

import { useEffect } from "react";

// Daftarkan SW hanya di production (dev bebas cache basi).
export function DaftarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    function daftar() {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    if (document.readyState === "complete") daftar();
    else window.addEventListener("load", daftar, { once: true });
  }, []);
  return null;
}
