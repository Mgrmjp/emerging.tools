import Link from "next/link";
import { Theme } from "@/lib/types";
import { formatInstalls } from "@/lib/data";

export function ThemeCard({ theme, index }: { theme: Theme; index: number }) {
  const staggerClass = `stagger-${Math.min(index + 1, 12)}`;
  const bg = theme.colors[0]?.hex || "#111114";
  const fg = theme.colors[1]?.hex || "#e8e8ed";
  const keyword = theme.colors[2]?.hex || "#3cf73c";
  const stringColor = theme.colors[3]?.hex || "#f7d73c";
  const comment = theme.colors[4]?.hex || "#5a5a66";
  const variable = theme.colors[5]?.hex || "#f73c3c";
  const fn = theme.colors[6]?.hex || "#3c9cf7";
  const num = theme.colors[7]?.hex || "#f7d73c";

  return (
    <Link href={`/themes/${theme.id}`} className="group block">
      <div
        className={`fade-in-up ${staggerClass} relative overflow-hidden border border-[var(--border)] transition-all duration-200 hover:border-[var(--border-hover)] hover:translate-y-[-1px]`}
        style={{ backgroundColor: bg }}
      >
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] text-[var(--muted)] tabular-nums shrink-0">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3
                className="text-sm font-bold truncate"
                style={{ color: fg }}
                data-text={theme.name}
              >
                {theme.name}
              </h3>
            </div>
            <span
              className="shrink-0 text-[9px] tracking-wider uppercase px-1.5 py-0.5 border"
              style={{
                color: fg,
                borderColor: `${fg}22`,
                backgroundColor: `${fg}08`,
              }}
            >
              {theme.type}
            </span>
          </div>

          <p
            className="text-[11px] leading-relaxed mb-3 line-clamp-1"
            style={{ color: comment }}
          >
            {theme.description}
          </p>

          <div
            className="p-2.5 text-[11px] leading-6 font-mono mb-3 border"
            style={{
              backgroundColor: `${bg}`,
              borderColor: `${fg}10`,
            }}
          >
            <div className="flex gap-1 mb-1.5">
              <span className="h-2 w-2 bg-[#f73c3c]/60" />
              <span className="h-2 w-2 bg-[#f7d73c]/60" />
              <span className="h-2 w-2 bg-[#3cf73c]/60" />
            </div>
            <span style={{ color: keyword }}>fn</span>{" "}
            <span style={{ color: fn }}>main</span>
            <span style={{ color: fg }}>() {"{"}</span>
            <br />
            <span style={{ color: comment }}>{"  // "}{theme.name.toLowerCase().replace(/\s/g, "_")}</span>
            <br />
            <span style={{ color: fg }}>  </span>
            <span style={{ color: keyword }}>let</span>{" "}
            <span style={{ color: variable }}>x</span>{" "}
            <span style={{ color: fg }}>= </span>
            <span style={{ color: stringColor }}>"</span>
            <span style={{ color: stringColor }}>{Math.floor(theme.installs / 1000)}</span>
            <span style={{ color: stringColor }}>"</span>
            <span style={{ color: fg }}>;</span>
            <br />
            <span style={{ color: fg }}>{"}"}</span>
          </div>

          <div className="flex items-center gap-1 mb-3">
            {theme.colors.slice(0, 8).map((c, i) => (
              <div
                key={i}
                className="group/swatch relative h-4 flex-1 first:border-l last:border-r transition-all hover:flex-[2] hover:z-10"
                style={{ backgroundColor: c.hex }}
              >
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 scale-0 group-hover/swatch:scale-100 px-1 py-0.5 text-[9px] font-mono bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] whitespace-nowrap pointer-events-none transition-transform">
                  {c.hex}
                </span>
              </div>
            ))}
          </div>

          <div
            className="flex items-center justify-between text-[10px]"
            style={{ color: comment }}
          >
            <span>{formatInstalls(theme.installs)}</span>
            <span>
              {theme.rating.toFixed(1)}
              <span style={{ color: `${fg}40` }}>/5</span>
            </span>
            <span
              className="font-bold tracking-tight"
              style={{ color: keyword }}
            >
              {theme.trendingScore}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
