import fs from "fs/promises";
import path from "path";
import { Theme } from "./types";
import { SAMPLE_THEMES } from "./sample-data";

const MAX_INSTALLS = 150_000;
const MIN_INSTALLS = 1_000;
const MIN_YEAR = 2020;
const SNAPSHOT_PATH = path.join(process.cwd(), "data", "latest.json");

interface ThemeSnapshot {
  date: string;
  themes: Theme[];
  generatedAt?: string;
}

async function readSnapshotThemes(): Promise<Theme[] | null> {
  try {
    const file = await fs.readFile(SNAPSHOT_PATH, "utf8");
    const snapshot = JSON.parse(file) as ThemeSnapshot;
    return snapshot.themes;
  } catch {
    return null;
  }
}

function filterSupportedThemes(themes: Theme[]): Theme[] {
  return themes.filter(
    (t) =>
      t.installs >= MIN_INSTALLS &&
      t.installs <= MAX_INSTALLS &&
      new Date(t.lastUpdated).getFullYear() >= MIN_YEAR
  );
}

export async function getThemes(): Promise<Theme[]> {
  const snapshotThemes = await readSnapshotThemes();
  const themes = snapshotThemes && snapshotThemes.length > 0
    ? snapshotThemes
    : SAMPLE_THEMES;
  return filterSupportedThemes(themes);
}

export async function getThemeById(id: string): Promise<Theme | null> {
  const themes = await getThemes();
  return themes.find((t) => t.id === id || t.vscodeId === id) || null;
}

export function formatInstalls(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export function filterThemes(
  themes: Theme[],
  opts: {
    search?: string;
    type?: "dark" | "light" | "all";
    sort?: "trending" | "installs" | "rating" | "updated" | "random";
    maxInstalls?: number;
  }
): Theme[] {
  let result = [...themes];

  if (opts.maxInstalls) {
    result = result.filter((t) => t.installs <= opts.maxInstalls!);
  }

  if (opts.search) {
    const q = opts.search.toLowerCase();
    result = result.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.publisher.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }

  if (opts.type && opts.type !== "all") {
    result = result.filter((t) => t.type === opts.type);
  }

  switch (opts.sort) {
    case "random":
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      break;
    case "installs":
      result.sort((a, b) => b.installs - a.installs);
      break;
    case "rating":
      result.sort((a, b) => b.rating - a.rating);
      break;
    case "updated":
      result.sort(
        (a, b) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      );
      break;
    case "trending":
    default:
      result.sort((a, b) => b.trendingScore - a.trendingScore);
  }

  return result;
}
