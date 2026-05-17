import { getThemeById } from "@/lib/data";
import { ThemeDetail } from "@/components/ThemeDetail";
import { JsonLd } from "@/components/JsonLd";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/site";

interface ThemePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ThemePageProps): Promise<Metadata> {
  const { id } = await params;
  const theme = await getThemeById(decodeURIComponent(id));
  if (!theme) return { title: "Theme not found" };

  return {
    title: `${theme.name} by ${theme.publisher}`,
    description: theme.description,
    keywords: [theme.name, theme.publisher, "VS Code theme", theme.type],
    openGraph: {
      title: theme.name,
      description: theme.description,
      url: `${SITE_URL}/themes/${theme.id}`,
      siteName: SITE_NAME,
      type: "article",
      authors: [theme.publisher],
      publishedTime: theme.lastUpdated,
    },
    twitter: {
      card: "summary",
      title: theme.name,
      description: theme.description,
    },
    alternates: {
      canonical: `${SITE_URL}/themes/${theme.id}`,
    },
  };
}

export default async function ThemePage({ params }: ThemePageProps) {
  const { id } = await params;
  const theme = await getThemeById(decodeURIComponent(id));

  if (!theme) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--muted)] text-sm">$ 404: theme not found</p>
          <Link
            href="/"
            className="mt-3 inline-block text-xs text-[var(--accent)] hover:underline"
          >
            $ cd ~/trending-themes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <JsonLd
        id="theme-jsonld"
        data={{
          "@graph": [
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: theme.name,
              description: theme.description,
              url: `${SITE_URL}/themes/${theme.id}`,
              applicationCategory: "DeveloperApplication",
              operatingSystem: "VS Code",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: theme.rating.toFixed(1),
                ratingCount: theme.ratingCount,
              },
              author: {
                "@type": "Organization",
                name: theme.publisher,
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Themes",
                  item: SITE_URL,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: theme.name,
                  item: `${SITE_URL}/themes/${theme.id}`,
                },
              ],
            },
          ],
        }}
      />
      <div className="flex flex-1 flex-col">
        <header className="border-b border-[var(--border)] px-4 py-2 flex items-center gap-3">
          <Link
            href="/"
            className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            ~/trending-themes
          </Link>
          <span className="text-[var(--muted)] text-[10px]">/</span>
          <span className="text-xs text-[var(--text)]">{theme.name}</span>
        </header>
        <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
          <ThemeDetail theme={theme} />
        </main>
        <footer className="border-t border-[var(--border)] px-4 py-2 flex items-center justify-between text-[10px] text-[var(--muted)]">
          <span>{SITE_NAME}</span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 bg-[var(--accent)]" />
            connected
          </span>
        </footer>
      </div>
    </>
  );
}

