import fs from "fs/promises";
import path from "path";
import { TrendingFont } from "./font-types";

const SNAPSHOT_PATH = path.join(process.cwd(), "data", "fonts-latest.json");

interface FontSnapshot {
  date: string;
  fonts: TrendingFont[];
  generatedAt?: string;
}

async function readSnapshotFonts(): Promise<TrendingFont[] | null> {
  try {
    const file = await fs.readFile(SNAPSHOT_PATH, "utf8");
    const snapshot = JSON.parse(file) as FontSnapshot;
    return snapshot.fonts;
  } catch {
    return null;
  }
}

export async function getFonts(): Promise<TrendingFont[]> {
  const snapshotFonts = await readSnapshotFonts();
  return snapshotFonts || [];
}

export async function getFontById(id: string): Promise<TrendingFont | null> {
  const fonts = await getFonts();
  return fonts.find((f) => f.id === id || f.family.toLowerCase() === id.toLowerCase()) || null;
}

export function formatDownloads(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export function filterFonts(
  fonts: TrendingFont[],
  opts: {
    search?: string;
    category?: string;
    sort?: "trending" | "downloads" | "rating" | "updated" | "random";
    variable?: boolean;
  }
): TrendingFont[] {
  let result = [...fonts];

  if (opts.variable === true) {
    result = result.filter((f) => f.variable);
  }

  if (opts.search) {
    const q = opts.search.toLowerCase();
    result = result.filter(
      (f) =>
        f.family.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }

  if (opts.category && opts.category !== "all") {
    result = result.filter((f) => f.category === opts.category);
  }

  switch (opts.sort) {
    case "random":
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      break;
    case "downloads":
      result.sort((a, b) => b.stats.total.npmDownloadTotal - a.stats.total.npmDownloadTotal);
      break;
    case "updated":
      result.sort(
        (a, b) =>
          new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      );
      break;
    case "trending":
    default:
      result.sort((a, b) => b.trendingScore - a.trendingScore);
  }

  return result;
}
