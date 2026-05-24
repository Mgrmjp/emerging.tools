import { getFontById } from "@/lib/font-data";
import { FontDetail } from "@/components/FontDetail";
import { JsonLd } from "@/components/JsonLd";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/site";

interface FontPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: FontPageProps): Promise<Metadata> {
  const { id } = await params;
  const font = await getFontById(decodeURIComponent(id));
  if (!font) return { title: "Font not found" };

  return {
    title: `${font.family} | Trending Fonts`,
    description: `${font.family} - ${font.category} font with ${font.weights.length} weights`,
    keywords: [font.family, font.category, "developer font", "trending font"],
    openGraph: {
      title: font.family,
      description: `${font.family} - ${font.category} font`,
      url: `${SITE_URL}/fonts/${font.id}`,
      siteName: SITE_NAME,
      type: "article",
      publishedTime: font.lastModified,
    },
    twitter: {
      card: "summary",
      title: font.family,
      description: `${font.family} - ${font.category} font`,
    },
    alternates: {
      canonical: `${SITE_URL}/fonts/${font.id}`,
    },
  };
}

export default async function FontPage({ params }: FontPageProps) {
  const { id } = await params;
  const font = await getFontById(decodeURIComponent(id));

  if (!font) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--muted)] text-sm">$ 404: font not found</p>
          <Link
            href="/fonts"
            className="mt-3 inline-block text-xs text-[var(--accent)] hover:underline"
          >
            $ cd ~/trending-fonts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <JsonLd
        id="font-jsonld"
        data={{
          "@graph": [
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: font.family,
              description: `${font.family} - ${font.category} font`,
              url: `${SITE_URL}/fonts/${font.id}`,
              applicationCategory: "DesignerApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Organization",
                name: "Google Fonts",
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Fonts",
                  item: `${SITE_URL}/fonts`,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: font.family,
                  item: `${SITE_URL}/fonts/${font.id}`,
                },
              ],
            },
          ],
        }}
      />
      <div className="flex flex-1 flex-col">
        <header className="border-b border-[var(--border)] px-4 py-2 flex items-center gap-3">
          <Link
            href="/fonts"
            className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            ~/trending-fonts
          </Link>
          <span className="text-[var(--muted)] text-[10px]">/</span>
          <span className="text-xs text-[var(--text)]">{font.family}</span>
        </header>
        <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
          <FontDetail font={font} />
        </main>
        <footer className="border-t border-[var(--border)] px-4 py-2 flex items-center justify-between text-[10px] text-[var(--muted)]">
          <span className="flex items-center gap-3">
            <span>{SITE_NAME}</span>
            <Link href="/" className="hover:text-[var(--text)] transition-colors">
              themes
            </Link>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 bg-[var(--accent)]" />
            connected
          </span>
        </footer>
      </div>
    </>
  );
}
