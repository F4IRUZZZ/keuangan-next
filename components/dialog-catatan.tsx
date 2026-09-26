"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { NotebookPen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  addCatatan,
  deleteCatatan,
  getCatatan,
  updateCatatan,
  type Catatan,
} from "@/lib/db-lokal";

interface Props {
  transaksiId: number | null;
  judul: string;
  onBerubah: () => void;
}

// Dialog catatan F1.1 (pola B2.2): daftar + tambah + ubah/hapus inline.
// Props = data masuk (transaksiId/judul), onBerubah = kabar ke induk.
export function DialogCatatan({ transaksiId, judul, onBerubah }: Props) {
  const [buka, setBuka] = useState(false);
  const [daftar, setDaftar] = useState<Catatan[]>([]);
  const [baru, setBaru] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editIsi, setEditIsi] = useState("");
  const [pesan, setPesan] = useState("");

  async function muat() {
    if (transaksiId === null) return;
    setDaftar(await getCatatan(transaksiId));
  }

  useEffect(() => {
    if (buka) {
      setBaru("");
      setEditId(null);
      setPesan("");
      muat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buka, transaksiId]);

  async function tambah() {
    if (transaksiId === null || !baru.trim()) return;
    const res = await addCatatan(transaksiId, baru);
    if ("error" in res) {
      setPesan(`Gagal (${res.code}): ${res.error}`);
      return;
    }
    setBaru("");
    setPesan("");
    await muat();
    onBerubah();
  }

  async function simpanUbah(id: number) {
    if (!editIsi.trim()) return;
    const out = await updateCatatan(id, editIsi);
    if (!out) {
      setPesan("Gagal: catatan tidak ditemukan.");
      return;
    }
    if (typeof out === "object" && "error" in out) {
      setPesan(`Gagal (${out.code}): ${out.error}`);
      return;
    }
    setEditId(null);
    setPesan("");
    await muat();
    onBerubah();
  }

  async function hapus(id: number) {
    await deleteCatatan(id);
    await muat();
    onBerubah();
  }

  return (
    <Dialog open={buka} onOpenChange={setBuka}>
      <Button variant="ghost" size="icon" onClick={() => setBuka(true)} aria-label={`Catatan untuk ${judul}`} title={daftar.length > 0 ? `Catatan (${daftar.length})` : "Catatan"}>
        <NotebookPen aria-hidden="true" />
      </Button>
      <DialogContent aria-label="Catatan transaksi">
        <DialogHeader>
          <DialogTitle className="truncate">Catatan - {judul}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {daftar.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada catatan.</p>
          ) : (
            <ul className="space-y-2">
              {daftar.map((c) => (
                <li key={c.id} className="flex items-center gap-2 rounded-lg border p-2 text-sm">
                  {editId === c.id ? (
                    <>
                      <Input value={editIsi} onChange={(e) => setEditIsi(e.target.value)} aria-label="Isi catatan baru" className="h-8" />
                      <Button size="sm" onClick={() => simpanUbah(c.id)}>Simpan</Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>Batal</Button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate">{c.isi}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditId(c.id);
                          setEditIsi(c.isi);
                        }}
                      >
                        Ubah
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => hapus(c.id)}>
                        Hapus
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Input placeholder="Tulis catatan..." value={baru} onChange={(e) => setBaru(e.target.value)} aria-label="Tulis catatan" />
            <Button onClick={tambah}>Tambah</Button>
          </div>
          {pesan && <p className="text-sm font-semibold text-red-600 dark:text-red-400">{pesan}</p>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setBuka(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
