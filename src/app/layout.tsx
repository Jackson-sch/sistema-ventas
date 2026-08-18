import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NovaMarket POS - Sistema Multi-Tenant para Supermercados",
  description: "Punto de venta de alta velocidad, inventario en tiempo real y facturación electrónica para retail y supermercados.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`dark ${jakarta.variable} ${geistMono.variable}`}>
      <body className="antialiased min-h-screen bg-[hsl(224,71%,4%)] text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
        {children}
        <Toaster richColors position="top-right" theme="dark" closeButton />
      </body>
    </html>
  );
}
