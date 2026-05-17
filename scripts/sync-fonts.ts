import { createFontSnapshot, writeFontSnapshot } from "../src/lib/font-snapshots";
import { fetchTrendingFonts } from "../src/lib/fonts";

const PAGE_SIZE = 100;

async function main() {
  console.log(`[sync-fonts] Starting fonts sync at ${new Date().toISOString()}`);

  try {
    const result = await fetchTrendingFonts({ pageSize: PAGE_SIZE });
    const snapshot = createFontSnapshot(result.fonts, result.source);
    const { filePath } = await writeFontSnapshot(snapshot);

    console.log(
      `[sync-fonts] Saved ${result.fonts.length} fonts to ${filePath}`
    );
    console.log(
      `[sync-fonts] candidates=${result.source.candidateCount} stats=${result.source.statsResolvedCount} googleRanks=${result.source.hasGoogleRankSignals}`
    );
    console.log("[sync-fonts] Sync completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("[sync-fonts] Sync failed:", error);
    process.exit(1);
  }
}

main();

