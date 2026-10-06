"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Galat({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-16 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Halaman gagal dimuat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {error?.message
              ? `Keterangan: ${error.message}`
              : "Terjadi gangguan saat memuat data dari perangkat ini."}{" "}
            Data tersimpan lokal dan tidak hilang — coba muat ulang.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={reset}>Coba lagi</Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Muat ulang halaman
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
