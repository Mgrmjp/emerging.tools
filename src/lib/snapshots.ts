import fs from "fs/promises";
import path from "path";
import { Theme } from "./types";

export interface ThemeSnapshot {
  date: string;
  themes: Theme[];
  generatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");

export function getDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createSnapshot(themes: Theme[], date = new Date()): ThemeSnapshot {
  return {
    date: getDateString(date),
    themes,
    generatedAt: date.toISOString(),
  };
}

export async function writeSnapshot(snapshot: ThemeSnapshot): Promise<{
  filePath: string;
  latestPath: string;
}> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const filePath = path.join(DATA_DIR, `weekly-${snapshot.date}.json`);
  const latestPath = path.join(DATA_DIR, "latest.json");

  const payload = JSON.stringify(snapshot, null, 2);
  await fs.writeFile(filePath, payload);
  await fs.writeFile(latestPath, payload);

  return { filePath, latestPath };
}
