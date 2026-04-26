import { Suspense } from "react";
import { getThemes, filterThemes, formatInstalls } from "@/lib/data";
import { ThemeCard } from "@/components/ThemeCard";
import { SearchBar } from "@/components/SearchBar";
import { JsonLd } from "@/components/JsonLd";

interface HomeProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    sort?: string;
    max?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const allThemes = await getThemes();
  const themes = filterThemes(allThemes, {
    search: params.q,
    type: (params.type as "dark" | "light" | "all") || "all",
    sort:
      (params.sort as "trending" | "installs" | "rating" | "updated" | "random") ||
      "trending",
    maxInstalls: params.max ? parseInt(params.max, 10) : undefined,
  }).slice(0, 15);
  const topTheme = themes[0];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "trendingvscode.themes",
          url: "https://trendingvscode.themes",
          description: "Discover emerging VS Code themes under 150K installs. Ranked by trending velocity.",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://trendingvscode.themes?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <div className="flex flex-1 flex-col">
      <header className="border-b border-[var(--border)] px-4 pt-8 pb-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--muted)] mb-3">
            ~/trending-themes
          </p>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.9]" aria-label="Discover emerging VS Code themes under 150K installs, ranked by trending velocity">
            <span className="text-[var(--text)]">discover</span>
            <br />
            <span className="text-[var(--accent)]">emerging</span>
            <br />
            <span className="text-[var(--text)]">themes</span>
            <span className="inline-block w-[2px] h-[0.85em] bg-[var(--accent)] ml-1 align-middle cursor-blink" />
          </h1>

          <p className="mt-4 text-sm text-[var(--muted)]">
            under 150K installs · ranked by trending velocity
          </p>

          <div className="mt-6">
            <Suspense>
              <SearchBar />
            </Suspense>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-0 flex-1">
        {themes.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-[var(--muted)]">
            <p className="text-sm">$ no results found</p>
            <p className="mt-1 text-xs opacity-60">
              try: different query or filter
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {themes.map((theme, i) => (
              <ThemeCard key={theme.id} theme={theme} index={i} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-[var(--border)] px-4 py-2 flex items-center justify-between text-[10px] text-[var(--muted)] sm:px-6 lg:px-8">
        <span>trendingvscode.themes</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 bg-[var(--accent)]" />
            connected
          </span>
          <span>{themes.length} results</span>
          {params.max && <span>max {formatInstalls(parseInt(params.max, 10))}</span>}
        </span>
      </footer>
    </div>
    </>
  );
}