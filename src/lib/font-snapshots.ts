import fs from "fs/promises";
import path from "path";
import { TrendingFont } from "./font-types";
import { getDateString } from "./snapshots";

export interface FontSnapshot {
  date: string;
  fonts: TrendingFont[];
  generatedAt: string;
  source: {
    provider: "fontsource";
    candidateCount: number;
    statsResolvedCount: number;
    hasGoogleRankSignals: boolean;
  };
}

const DATA_DIR = path.join(process.cwd(), "data");

export function createFontSnapshot(
  fonts: TrendingFont[],
  source: FontSnapshot["source"],
  date = new Date()
): FontSnapshot {
  return {
    date: getDateString(date),
    fonts,
    generatedAt: date.toISOString(),
    source,
  };
}

export async function writeFontSnapshot(snapshot: FontSnapshot): Promise<{
  filePath: string;
  latestPath: string;
}> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const filePath = path.join(DATA_DIR, `fonts-weekly-${snapshot.date}.json`);
  const latestPath = path.join(DATA_DIR, "fonts-latest.json");
  const payload = JSON.stringify(snapshot, null, 2);

  await fs.writeFile(filePath, payload);
  await fs.writeFile(latestPath, payload);

  return { filePath, latestPath };
}

