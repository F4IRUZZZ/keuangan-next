import { KerangkaKartu } from "@/components/kerangka";

export default function Memuat() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-16 md:p-8" aria-label="Memuat halaman">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" aria-hidden="true" />
      <KerangkaKartu baris={3} />
      <KerangkaKartu baris={2} />
    </main>
  );
}
