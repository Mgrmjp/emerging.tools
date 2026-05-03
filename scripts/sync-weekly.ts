import fs from "fs";
import path from "path";

interface Theme {
  id: string;
  name: string;
  publisher: string;
  publisherId: string;
  description: string;
  installs: number;
  rating: number;
  ratingCount: number;
  lastUpdated: string;
  repository: string;
  type: "dark" | "light";
  categories: string[];
  colors: { name: string; hex: string }[];
  iconUrl: string | null;
  vscodeId: string;
  trendingScore: number;
}

interface WeeklySnapshot {
  date: string;
  themes: Theme[];
}

function getDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function fetchThemes(): Promise<Theme[]> {
  const { fetchTrendingThemes } = await import("../src/lib/marketplace");
  return fetchTrendingThemes(100);
}

async function saveSnapshot(themes: Theme[]): Promise<string> {
  const dateStr = getDateString();
  const snapshot: WeeklySnapshot = {
    date: dateStr,
    themes,
  };

  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, `weekly-${dateStr}.json`);
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));

  // Also update latest.json for easy access
  const latestPath = path.join(dir, "latest.json");
  fs.writeFileSync(latestPath, JSON.stringify(snapshot, null, 2));

  return filePath;
}

async function main() {
  console.log(`[sync-weekly] Starting weekly sync at ${new Date().toISOString()}`);
  
  try {
    const themes = await fetchThemes();
    const filePath = await saveSnapshot(themes);
    
    console.log(`[sync-weekly] Saved ${themes.length} themes to ${filePath}`);
    console.log(`[sync-weekly] Sync completed successfully`);
    
    process.exit(0);
  } catch (error) {
    console.error("[sync-weekly] Sync failed:", error);
    process.exit(1);
  }
}

main();