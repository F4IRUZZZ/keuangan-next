import { Card, CardContent } from "@/components/ui/card";
import { cn } from "cn";

function Bar({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function KerangkaKartu({ baris = 3 }: { baris?: number }) {
  return (
    <Card aria-busy="true" aria-label="Memuat konten">
      <CardContent className="space-y-2 pt-4">
        <Bar className="h-4 w-1/3" />
        {Array.from({ length: baris }).map((_, i) => (
          <Bar key={i} className="h-3 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

export function KerangkaBaris({ jumlah = 4 }: { jumlah?: number }) {
  return (
    <ul aria-busy="true" aria-label="Memuat daftar" className="space-y-2">
      {Array.from({ length: jumlah }).map((_, i) => (
        <li key={i} className="flex items-center gap-2">
          <Bar className="h-5 w-16" />
          <Bar className="h-4 flex-1" />
          <Bar className="h-4 w-20" />
        </li>
      ))}
    </ul>
  );
}
