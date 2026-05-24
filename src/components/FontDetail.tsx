import Link from "next/link";
import { TrendingFont } from "@/lib/font-types";
import { formatDownloads } from "@/lib/font-data";
import { deriveFontPalette } from "@/lib/font-palette";
import { FontPreview } from "./FontPreview";

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="text-[9px] text-[var(--muted)] tracking-[0.15em] uppercase">
        {label}
      </div>
      <div
        className="mt-1 text-base font-bold tabular-nums"
        style={{ color: accent || "var(--text)" }}
      >
        {value}
      </div>
    </div>
  );
}

export function FontDetail({ font }: { font: TrendingFont }) {
  const palette = deriveFontPalette(font.category);
  const monthlyDownloads =
    font.stats.total.npmDownloadMonthly + font.stats.total.jsDelivrHitsMonthly;
  const swatches = [
    palette.bg,
    palette.fg,
    palette.accent,
    palette.keyword,
    palette.string,
    palette.comment,
    palette.function,
    palette.variable,
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--muted)] mb-1">
            ~/fonts/{font.id}
          </p>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: palette.fg }}
          >
            {font.family}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm" style={{ color: palette.muted }}>
            <span
              className="text-[9px] tracking-wider uppercase px-1.5 py-0.5 border"
              style={{
                color: palette.accent,
                borderColor: `${palette.accent}33`,
              }}
            >
              {font.category}
            </span>
            {font.variable && (
              <span className="text-[9px] tracking-wider uppercase px-1.5 py-0.5 border" style={{
                borderColor: `${palette.accent}30`,
                color: palette.accent,
              }}>
                variable
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <a
            href={font.installUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: palette.accent,
              color: palette.bg,
            }}
          >
            $ install
          </a>
        </div>
      </div>

      <FontPreview family={font.family} weights={font.weights} styles={font.styles} />

      <div className="flex items-center gap-0.5 h-8 overflow-hidden border" style={{ borderColor: palette.border }}>
        {swatches.map((c, i) => (
          <div
            key={i}
            className="group/swatch relative flex-1 transition-all hover:flex-[2]"
            style={{ backgroundColor: c }}
          >
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 scale-0 group-hover/swatch:scale-100 px-1 py-0.5 text-[9px] font-mono bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] whitespace-nowrap pointer-events-none transition-transform z-10">
              {c}
            </span>
          </div>
        ))}
      </div>

      <div
        className="p-4 border font-mono overflow-hidden"
        style={{
          backgroundColor: palette.bg,
          borderColor: `${palette.fg}10`,
        }}
      >
        <div className="flex gap-1.5 mb-3">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `${palette.variable}60` }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `${palette.number}60` }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `${palette.keyword}60` }} />
        </div>
        <div className="text-sm leading-7">
          <span style={{ color: palette.keyword }}>import</span>{" "}
          <span style={{ color: palette.string }}>&apos;@fontsource/{font.id}&apos;</span>
          <span style={{ color: palette.fg }}>;</span>
        </div>
        <div className="text-sm leading-7">
          <span style={{ color: palette.keyword }}>const</span>{" "}
          <span style={{ color: palette.variable }}>body</span>{" "}
          <span style={{ color: palette.fg }}>{'{'}</span>{" "}
          <span style={{ color: palette.accent }}>font-family</span>
          <span style={{ color: palette.fg }}>:</span>{" "}
          <span style={{ color: palette.string }}>&apos;{font.family}&apos;</span>
          <span style={{ color: palette.fg }}>;</span>
          <br />
          <span style={{ color: palette.fg }}>{'}'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="downloads/mo" value={formatDownloads(monthlyDownloads)} accent={palette.accent} />
        <Stat label="total downloads" value={formatDownloads(font.stats.total.npmDownloadTotal)} accent={palette.accent} />
        <Stat
          label="last updated"
          value={new Date(font.lastModified).toLocaleDateString("fi-FI")}
        />
        <Stat label="trending score" value={font.trendingScore.toFixed(1)} accent={palette.keyword} />
      </div>

      {font.styles.length > 0 && (
        <div>
          <p className="text-[9px] tracking-[0.15em] uppercase mb-2" style={{ color: palette.muted }}>
            styles
          </p>
          <div className="flex flex-wrap gap-1.5">
            {font.styles.map((s) => (
              <span
                key={s}
                className="border px-2 py-0.5 text-[10px] font-mono"
                style={{
                  borderColor: palette.border,
                  backgroundColor: palette.surface,
                  color: palette.muted,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {font.subsets.length > 0 && (
        <div>
          <p className="text-[9px] tracking-[0.15em] uppercase mb-2" style={{ color: palette.muted }}>
            subsets
          </p>
          <div className="flex flex-wrap gap-1.5">
            {font.subsets.map((s) => (
              <span
                key={s}
                className="border px-2 py-0.5 text-[10px] font-mono"
                style={{
                  borderColor: palette.border,
                  backgroundColor: palette.surface,
                  color: palette.muted,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-[10px]">
        <div className="border p-3" style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
          <div className="tracking-[0.15em] uppercase" style={{ color: palette.muted }}>npm monthly</div>
          <div className="mt-1 font-bold tabular-nums" style={{ color: palette.fg }}>
            {formatDownloads(font.stats.total.npmDownloadMonthly)}
          </div>
        </div>
        <div className="border p-3" style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
          <div className="tracking-[0.15em] uppercase" style={{ color: palette.muted }}>jsDelivr monthly</div>
          <div className="mt-1 font-bold tabular-nums" style={{ color: palette.fg }}>
            {formatDownloads(font.stats.total.jsDelivrHitsMonthly)}
          </div>
        </div>
        <div className="border p-3" style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
          <div className="tracking-[0.15em] uppercase" style={{ color: palette.muted }}>npm total</div>
          <div className="mt-1 font-bold tabular-nums" style={{ color: palette.fg }}>
            {formatDownloads(font.stats.total.npmDownloadTotal)}
          </div>
        </div>
        <div className="border p-3" style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
          <div className="tracking-[0.15em] uppercase" style={{ color: palette.muted }}>jsDelivr total</div>
          <div className="mt-1 font-bold tabular-nums" style={{ color: palette.fg }}>
            {formatDownloads(font.stats.total.jsDelivrHitsTotal)}
          </div>
        </div>
      </div>

      <Link
        href="/fonts"
        className="inline-block text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
      >
        $ cd ../..
      </Link>
    </div>
  );
}
