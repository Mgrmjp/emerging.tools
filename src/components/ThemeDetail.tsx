import Link from "next/link";
import { Theme } from "@/lib/types";
import { formatInstalls } from "@/lib/data";
import { SyntaxPreview } from "./SyntaxPreview";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="text-[9px] text-[var(--muted)] tracking-[0.15em] uppercase">
        {label}
      </div>
      <div className="mt-1 text-base font-bold text-[var(--text)] tabular-nums">
        {value}
      </div>
    </div>
  );
}

export function ThemeDetail({ theme }: { theme: Theme }) {
  const installUrl = "vscode:extension/" + theme.vscodeId;
  const marketplaceUrl = "https://marketplace.visualstudio.com/items/" + theme.vscodeId;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--muted)] mb-1">
            ~/themes/{theme.id}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
            {theme.name}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            by{" "}
            <a
              href={`https://github.com/${theme.publisherId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              {theme.publisher}
            </a>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <a
            href={marketplaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs text-[var(--muted)] transition-colors hover:border-[var(--border-hover)] hover:text-[var(--text)]"
          >
            marketplace
          </a>
          <a
            href={installUrl}
            className="bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[var(--bg)] transition-opacity hover:opacity-90"
          >
            $ install
          </a>
        </div>
      </div>

      {theme.description && (
        <p className="text-sm text-[var(--muted)]">{theme.description}</p>
      )}

      <SyntaxPreview theme={theme} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="installs" value={formatInstalls(theme.installs)} />
        <Stat label="rating" value={theme.rating.toFixed(1) + " / 5"} />
        <Stat label="reviews" value={theme.ratingCount.toString()} />
        <Stat
          label="updated"
          value={new Date(theme.lastUpdated).toLocaleDateString("fi-FI")}
        />
      </div>

      <div>
        <p className="text-[9px] text-[var(--muted)] tracking-[0.15em] uppercase mb-2">
          palette
        </p>
        <div className="flex items-stretch gap-0.5 h-8 overflow-hidden border border-[var(--border)]">
          {theme.colors.map((c, i) => (
            <div
              key={i}
              className="group/swatch relative flex-1 transition-all hover:flex-[2]"
              style={{ backgroundColor: c.hex }}
            >
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 scale-0 group-hover/swatch:scale-100 px-1 py-0.5 text-[9px] font-mono bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] whitespace-nowrap pointer-events-none transition-transform z-10">
                {c.hex}
              </span>
            </div>
          ))}
        </div>
      </div>

      {theme.categories.length > 0 && (
        <div>
          <p className="text-[9px] text-[var(--muted)] tracking-[0.15em] uppercase mb-2">
            tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {theme.categories.map((cat) => (
              <span
                key={cat}
                className="border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] text-[var(--muted)]"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {theme.repository && (
        <div>
          <p className="text-[9px] text-[var(--muted)] tracking-[0.15em] uppercase mb-1">
            repo
          </p>
          <a
            href={theme.repository}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--accent)] hover:underline"
          >
            {theme.repository}
          </a>
        </div>
      )}

      <Link
        href="/"
        className="inline-block text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
      >
        $ cd ../..
      </Link>
    </div>
  );
}
