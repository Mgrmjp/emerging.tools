import { Theme } from "../src/lib/types";
import { createSnapshot, writeSnapshot } from "../src/lib/snapshots";
import { createFontSnapshot, writeFontSnapshot } from "../src/lib/font-snapshots";
import { fetchTrendingFonts } from "../src/lib/fonts";

async function fetchThemes(): Promise<Theme[]> {
  const { fetchTrendingThemes } = await import("../src/lib/marketplace");
  return fetchTrendingThemes(100);
}

async function saveSnapshot(themes: Theme[]): Promise<string> {
  const snapshot = createSnapshot(themes);
  const { filePath } = await writeSnapshot(snapshot);
  return filePath;
}

async function syncFonts(): Promise<{ filePath: string; count: number }> {
  const result = await fetchTrendingFonts({ pageSize: 100 });
  const snapshot = createFontSnapshot(result.fonts, result.source);
  const { filePath } = await writeFontSnapshot(snapshot);
  return { filePath, count: result.fonts.length };
}

async function main() {
  console.log(`[sync-weekly] Starting weekly sync at ${new Date().toISOString()}`);
  
  try {
    const themes = await fetchThemes();
    const filePath = await saveSnapshot(themes);
    const fontSync = await syncFonts();
    
    console.log(`[sync-weekly] Saved ${themes.length} themes to ${filePath}`);
    console.log(`[sync-weekly] Saved ${fontSync.count} fonts to ${fontSync.filePath}`);
    console.log(`[sync-weekly] Sync completed successfully`);
    
    process.exit(0);
  } catch (error) {
    console.error("[sync-weekly] Sync failed:", error);
    process.exit(1);
  }
}

main();
