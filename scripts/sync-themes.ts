import { Theme } from "../src/lib/types";
import { createSnapshot, writeSnapshot } from "../src/lib/snapshots";

async function fetchThemes(): Promise<Theme[]> {
  const { fetchTrendingThemes } = await import("../src/lib/marketplace");
  return fetchTrendingThemes(100);
}

async function saveSnapshot(themes: Theme[]): Promise<string> {
  const snapshot = createSnapshot(themes);
  const { filePath } = await writeSnapshot(snapshot);
  return filePath;
}

async function main() {
  console.log(`[sync-themes] Starting theme sync at ${new Date().toISOString()}`);

  try {
    const themes = await fetchThemes();
    const filePath = await saveSnapshot(themes);

    console.log(`[sync-themes] Saved ${themes.length} themes to ${filePath}`);
    console.log("[sync-themes] Sync completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("[sync-themes] Sync failed:", error);
    process.exit(1);
  }
}

main();

