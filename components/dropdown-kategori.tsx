"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onPilih: (nama: string) => void;
  saran: string[];
}

// Dropdown kategori custom (port pola vanilla renderOpsiDropdown):
// tombol -> panel (cari + opsi + "+ Tambah" bila baru + kosong) ->
// tutup via pilih/Esc/klik-luar. ARIA listbox manual (pengganti datalist).
export function DropdownKategori({ id, label, placeholder, value, onPilih, saran }: Props) {
  const [buka, setBuka] = useState(false);
  const [cari, setCari] = useState("");
  const kotakRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!buka) return;
    setCari("");
    setTimeout(() => inputRef.current?.focus(), 0);
    function luar(e: MouseEvent) {
      if (kotakRef.current && !kotakRef.current.contains(e.target as Node)) setBuka(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setBuka(false);
    }
    document.addEventListener("click", luar);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("click", luar);
      document.removeEventListener("keydown", esc);
    };
  }, [buka ]);

  function pilih(nama: string) {
    onPilih(nama);
    setBuka(false);
  }

  const kunci = cari.trim().toLowerCase();
  const cocok = saran.filter((n) => n.toLowerCase().includes(kunci));
  const sudahAda = saran.some((n) => n.toLowerCase() === cari.trim().toLowerCase());

  return (
    <div>
      <span className="mb-1 block text-sm font-medium" id={`${id}-label`}>{label}</span>
      <div ref={kotakRef} className="relative">
        <Button
          type="button"
          variant="secondary"
          id={id}
          aria-labelledby={`${id}-label ${id}-tombol`}
          aria-expanded={buka}
          aria-haspopup="listbox"
          onClick={(e) => {
            e.stopPropagation();
            setBuka((b) => !b);
          }}
          className="w-full justify-between font-normal"
        >
          <span id={`${id}-tombol`} className="truncate">{value || placeholder}</span>
          <span aria-hidden="true">▾</span>
        </Button>
        {!buka ? null : (
          <div className="absolute inset-x-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg">
            <Input
              ref={inputRef}
              placeholder="Ketik untuk cari..."
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              aria-label="Cari kategori"
            />
            <ul role="listbox" aria-label={label} className="mt-1">
              {cocok.map((nama) => (
                <li key={nama} role="option" aria-selected={nama === value}>
                  <button
                    type="button"
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => pilih(nama)}
                  >
                    {nama}
                  </button>
                </li>
              ))}
              {cari.trim() && !sudahAda && (
                <li role="option" aria-selected={false}>
                  <button
                    type="button"
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-emerald-600 dark:text-emerald-400"
                    onClick={() => pilih(cari.trim())}
                  >
                    + Tambah &quot;{cari.trim()}&quot;
                  </button>
                </li>
              )}
              {cocok.length === 0 && !cari.trim() && (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  Belum ada kategori. Ketik untuk buat baru.
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
