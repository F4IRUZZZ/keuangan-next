import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FamVault",
  description: "Catat pendapatan dan pengeluaran pribadi + keluarga",
};

export const viewport: Viewport = {
  themeColor: "#059669",
};

import { Nav } from "@/components/nav";
import { DaftarSW } from "@/components/daftar-sw";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="famvault-tema";var t=localStorage.getItem(k);if(t!=="terang"&&t!=="gelap"){t=matchMedia("(prefers-color-scheme: dark)").matches?"gelap":"terang";}if(t==="gelap")document.documentElement.classList.add("dark");}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <DaftarSW />
        <Nav />
        <div className="pb-24 lg:pb-0 lg:pl-60">{children}</div>
      </body>
    </html>
  );
}
