import type { Metadata } from "next";
import { Lora, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "RDAM | Registro de Deudores Alimentarios Morosos",
  description:
    "Portal oficial del Registro de Deudores Alimentarios Morosos del Poder Judicial de la Provincia de Santa Fe.",
  keywords: ["RDAM", "deudores alimentarios", "Santa Fe", "poder judicial"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${lora.variable} ${dmSans.variable}`}>
      <body>
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            classNames: {
              toast: "font-sans text-sm",
            },
          }}
        />
      </body>
    </html>
  );
}
