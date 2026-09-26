"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EVENT_TEMA, temaAwal, terapkanTema, type Tema } from "@/lib/tema";

export function ToggleTema({ tampilLabel = true }: { tampilLabel?: boolean }) {
  const [tema, setTema] = useState<Tema>("terang");

  useEffect(() => {
    const awal = temaAwal();
    setTema(awal);
    document.documentElement.classList.toggle("dark", awal === "gelap");
    function sinkron(e: Event) {
      setTema((e as CustomEvent<Tema>).detail);
    }
    window.addEventListener(EVENT_TEMA, sinkron);
    return () => window.removeEventListener(EVENT_TEMA, sinkron);
  }, []);

  function ganti() {
    terapkanTema(tema === "terang" ? "gelap" : "terang");
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={ganti}
      aria-pressed={tema === "gelap"}
      aria-label={tema === "terang" ? "Ganti ke tema gelap" : "Ganti ke tema terang"}
    >
      {tema === "terang" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      {tampilLabel && (tema === "terang" ? "Terang" : "Gelap")}
    </Button>
  );
}
