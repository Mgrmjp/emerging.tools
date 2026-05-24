import { Suspense } from "react";
import { getFonts, filterFonts, formatDownloads } from "@/lib/font-data";
import { FontCard } from "@/components/FontCard";
import { FontSearchBar } from "@/components/FontSearchBar";
import { JsonLd } from "@/components/JsonLd";
import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import Link from "next/link";

interface FontsProps {
  searchParams: Promise<{
    q?: string;
    cat?: string;
    sort?: string;
    var?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Trending Fonts | " + SITE_TITLE,
  description: "Discover emerging developer fonts ranked by trending velocity and downloads.",
  alternates: {
    canonical: `${SITE_URL}/fonts`,
  },
};

export default async function Fonts({ searchParams }: FontsProps) {
  const params = await searchParams;
  const allFonts = await getFonts();
  const fonts = filterFonts(allFonts, {
    search: params.q,
    category: params.cat || "all",
    sort:
      (params.sort as "trending" | "downloads" | "updated" | "random") ||
      "trending",
    variable: params.var === "1",
  });

  return (
    <>
      <JsonLd
        id="fonts-itemlist-jsonld"
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Trending developer fonts",
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          numberOfItems: fonts.length,
          itemListElement: fonts.slice(0, 30).map((font, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${SITE_URL}/fonts/${font.id}`,
            name: font.family,
          })),
        }}
      />
      <div className="flex flex-1 flex-col">
        <header className="border-b border-[var(--border)] px-4 pt-8 pb-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--muted)] mb-3">
              ~/trending-fonts
            </p>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.9]" aria-label="Discover emerging developer fonts, ranked by trending velocity">
              <span className="text-[var(--text)]">discover</span>
              <br />
              <span className="bg-gradient-to-r from-[#3cf73c] via-[#f7d73c] to-[#3c9cf7] bg-clip-text text-transparent">emerging</span>
              <br />
              <span className="text-[var(--text)]">fonts</span>
              <span className="inline-block w-[2px] h-[0.85em] bg-gradient-to-b from-[#3cf73c] to-[#3c9cf7] ml-1 align-middle cursor-blink" />
            </h1>

            <div className="mt-3 flex items-center gap-1.5">
              <span className="h-1.5 w-6 bg-[#3cf73c]" />
              <span className="h-1.5 w-6 bg-[#f7d73c]" />
              <span className="h-1.5 w-6 bg-[#f73c3c]" />
              <span className="h-1.5 w-6 bg-[#3c9cf7]" />
              <span className="h-1.5 w-6 bg-[#c73cf7]" />
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              ranked by trending velocity · npm & jsDelivr stats
            </p>

            <div className="mt-6">
              <Suspense>
                <FontSearchBar />
              </Suspense>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-0 flex-1">
          {fonts.length === 0 ? (
            <div className="flex flex-col items-center py-24 text-[var(--muted)]">
              <p className="text-sm">$ no results found</p>
              <p className="mt-1 text-xs opacity-60">
                try: different query or filter
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fonts.map((font, i) => (
                <FontCard key={font.id} font={font} index={i} />
              ))}
            </div>
          )}
        </main>

        <footer className="border-t border-[var(--border)] px-4 py-2 flex items-center justify-between text-[10px] text-[var(--muted)] sm:px-6 lg:px-8">
          <span className="flex items-center gap-3">
            <span>{SITE_NAME}</span>
            <Link href="/" className="hover:text-[var(--text)] transition-colors">
              themes
            </Link>
          </span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 bg-gradient-to-br from-[#3cf73c] to-[#3c9cf7]" />
              connected
            </span>
            <span>{fonts.length} results</span>
          </span>
        </footer>
      </div>
    </>
  );
}
