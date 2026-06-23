import type { Metadata } from "next";
import { Archivo_Black, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

/*
 * Typography stack (from SKILLS.md):
 *   Display (H1/H2, hero, big stat numbers) → Archivo Black
 *   Body / UI (nav, buttons, forms, copy)   → Inter
 *   Data / numeric output                    → IBM Plex Mono
 *
 * CSS variable names here MUST match the references in globals.css
 * and Tailwind's fontFamily config so utility classes resolve correctly.
 */

const archivoBlack = Archivo_Black({
  weight: "400", // Archivo Black only has one weight
  variable: "--font-archivo-black",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ThreadCounty — AI-Powered Textile Analysis",
  description:
    "Upload fabric images and get instant AI analysis: thread density, warp/weft counts, fabric classification, and confidence scoring. Built for textile manufacturers and researchers.",
  keywords: [
    "textile analysis",
    "thread density",
    "fabric analysis",
    "AI textile",
    "warp count",
    "weft count",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivoBlack.variable} ${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
