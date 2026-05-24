import Link from "next/link";
import { TrendingFont } from "@/lib/font-types";
import { formatDownloads } from "@/lib/font-data";
import { deriveFontPalette } from "@/lib/font-palette";

export function FontCard({ font, index }: { font: TrendingFont; index: number }) {
  const staggerClass = `stagger-${Math.min(index + 1, 12)}`;
  const monthlyDownloads =
    font.stats.total.npmDownloadMonthly + font.stats.total.jsDelivrHitsMonthly;
  const palette = deriveFontPalette(font.category);
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
    <Link href={`/fonts/${font.id}`} className="group block">
      <div
        className={`fade-in-up ${staggerClass} relative overflow-hidden border transition-all duration-200 hover:translate-y-[-1px]`}
        style={{
          backgroundColor: palette.surface,
          borderColor: palette.border,
        }}
      >
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] tabular-nums shrink-0" style={{ color: palette.muted }}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3
                className="text-sm font-bold truncate"
                style={{ color: palette.fg }}
                data-text={font.family}
              >
                {font.family}
              </h3>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {font.variable && (
                <span
                  className="text-[9px] tracking-wider uppercase px-1.5 py-0.5 border"
                  style={{
                    color: palette.accent,
                    borderColor: `${palette.accent}30`,
                    backgroundColor: `${palette.accent}10`,
                  }}
                >
                  var
                </span>
              )}
              <span
                className="text-[9px] tracking-wider uppercase px-1.5 py-0.5 border"
                style={{
                  color: palette.accent,
                  borderColor: `${palette.accent}33`,
                  backgroundColor: `${palette.accent}08`,
                }}
              >
                {font.category}
              </span>
            </div>
          </div>

          <div
            className="mb-3 border overflow-hidden"
            style={{
              backgroundColor: palette.bg,
              borderColor: `${palette.fg}10`,
            }}
          >
            <div
              className="p-4 text-center leading-tight"
              style={{
                fontSize: "32px",
                color: palette.fg,
              }}
            >
              <span className="block truncate">{font.family.split(" ")[0]}</span>
            </div>
            <div
              className="px-4 pb-2 flex items-center gap-1.5 text-[10px]"
              style={{ color: palette.comment }}
            >
              <span className="px-1.5 py-0.5 border" style={{ borderColor: palette.border }}>
                {font.weights.length}w
              </span>
              {font.variable && (
                <span className="px-1.5 py-0.5 border" style={{ borderColor: palette.border }}>
                  var
                </span>
              )}
              {font.subsets.length > 0 && (
                <span className="truncate">{font.subsets.slice(0, 3).join(", ")}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 mb-3">
            {swatches.map((c, i) => (
              <div
                key={i}
                className="group/swatch relative h-4 flex-1 first:border-l last:border-r transition-all hover:flex-[2] hover:z-10"
                style={{ backgroundColor: c }}
              >
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 scale-0 group-hover/swatch:scale-100 px-1 py-0.5 text-[9px] font-mono bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] whitespace-nowrap pointer-events-none transition-transform">
                  {c}
                </span>
              </div>
            ))}
          </div>

          <div
            className="flex items-center justify-between text-[10px]"
            style={{ color: palette.comment }}
          >
            <span>{formatDownloads(monthlyDownloads)}/mo</span>
            <span>{formatDownloads(font.stats.total.npmDownloadTotal)}</span>
            <span
              className="font-bold tracking-tight"
              style={{ color: palette.keyword }}
            >
              {font.trendingScore.toFixed(1)}
            </span>
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-[1px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${palette.accent}40, transparent)`,
          }}
        />
      </div>
    </Link>
  );
}
