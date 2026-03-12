import "./globals.css";
import { JetBrains_Mono, Outfit } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "./providers";

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
  title: "RDAM Backoffice",
  description: "Registro de Deudores Alimentarios Morosos - PJ Santa Fe",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${jetbrains.variable} ${outfit.variable}`}>
      <body className="font-mono">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
