import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: "https://emerging.tools",
  title: "emerging.tools",
  description:
    "Find what's next in dev tooling. Themes, extensions, fonts, and customizations ranked by momentum, not popularity.",
  keywords: ["vscode themes", "neovim themes", "terminal themes", "dev tools", "discover"],
  authors: [{ name: "emerging.tools" }],
  openGraph: {
    title: "emerging.tools",
    description: "Find what's next in dev tooling. Ranked by trending velocity, not installs.",
    url: "https://emerging.tools",
    siteName: "emerging.tools",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "emerging.tools",
    description: "Find what's next in dev tooling.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-mono">
        <div className="scanline" />
        {children}
        <Analytics />
      </body>
    </html>
  );
}