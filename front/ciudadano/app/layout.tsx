import "./globals.css";
import { JetBrains_Mono, Outfit } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "RDAM Ciudadano",
  description: "Portal ciudadano RDAM - Poder Judicial de Santa Fe",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${jetbrains.variable} ${outfit.variable}`}>
      <body className="font-sans">
        <Providers>
          <div className="min-h-screen bg-slate-50">
            <PublicHeader />
            <main className="mx-auto w-full max-w-6xl px-6 py-10">
              {children}
            </main>
            <PublicFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
