"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

// Indikator koneksi: hanya tampil saat offline (amber = kondisi perhatian).
// Render awal = online agar aman SSR/hydration; dikoreksi setelah mount.
export function BadgeKoneksi() {
  const [daring, setDaring] = useState(true);

  useEffect(() => {
    function sinkron() {
      setDaring(window.navigator.onLine);
    }
    sinkron();
    window.addEventListener("online", sinkron);
    window.addEventListener("offline", sinkron);
    return () => {
      window.removeEventListener("online", sinkron);
      window.removeEventListener("offline", sinkron);
    };
  }, []);

  if (daring) return null;
  return <Badge variant="warning">Offline • Perangkat ini</Badge>;
}
