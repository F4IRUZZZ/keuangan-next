"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bacaPilihan, EVENT_TEMA, pantauSistem, terapkanTema, type Tema } from "@/lib/tema";

export function PemilihTema() {
  const [pilihan, setPilihan] = useState<Tema>("sistem");

  useEffect(() => {
    const awal = bacaPilihan();
    setPilihan(awal);
    terapkanTema(awal);
    function sinkron(e: Event) {
      setPilihan((e as CustomEvent<Tema>).detail);
    }
    window.addEventListener(EVENT_TEMA, sinkron);
    const lepas = pantauSistem();
    return () => {
      window.removeEventListener(EVENT_TEMA, sinkron);
      lepas();
    };
  }, []);

  return (
    <Tabs value={pilihan} onValueChange={(v) => terapkanTema(v as Tema)}>
      <TabsList aria-label="Pilih tema">
        <TabsTrigger value="sistem">Sistem</TabsTrigger>
        <TabsTrigger value="terang">Terang</TabsTrigger>
        <TabsTrigger value="gelap">Gelap</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
