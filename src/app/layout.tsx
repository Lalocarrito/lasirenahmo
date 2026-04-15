import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryProvider } from "@/components/QueryProvider";
import { Toaster } from "sonner";
import CookieConsent from "@/components/CookieConsent";

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "La Sirena | Extensiones de Pestañas",
  description: "Diseño premium de pestañas en Hermosillo. Realzamos tu mirada con estilo, lujo y perfección.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${outfit.variable} ${playfair.variable} antialiased`}>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster position="bottom-right" theme="system" richColors />
            <CookieConsent />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
