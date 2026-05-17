import {
  FontDownloadStats,
  FontRankSignals,
  FontUsageStats,
  TrendingFont,
} from "./font-types";

const FONTSOURCE_FONTLIST_URL =
  "https://raw.githubusercontent.com/fontsource/font-files/main/FONTLIST.json";
const GOOGLE_FONT_METADATA_URL =
  "https://raw.githubusercontent.com/fontsource/google-font-metadata/main/data/google-fonts-v2.json";
const GOOGLE_WEBFONTS_URL = "https://www.googleapis.com/webfonts/v1/webfonts";
const FONTSOURCE_STATS_URL = "https://api.fontsource.org/v1/stats";

const DEFAULT_RECENT_CANDIDATE_LIMIT = 450;
const DEFAULT_GOOGLE_RANK_CANDIDATE_LIMIT = 250;
const STATS_CONCURRENCY = 20;
const STATS_RETRIES = 2;

interface FontMetadata {
  family: string;
  id: string;
  subsets?: string[];
  weights?: number[];
  styles?: string[];
  lastModified?: string;
  version?: string;
  category?: string;
}

type FontMetadataIndex = Record<string, FontMetadata>;
type FontLastModifiedIndex = Record<string, string>;

interface GoogleWebfontsResponse {
  items?: Array<{
    family: string;
  }>;
}

interface RawFontUsageStats {
  total?: Partial<FontDownloadStats>;
  static?: Partial<FontDownloadStats>;
  variable?: Partial<FontDownloadStats>;
}

export interface FetchTrendingFontsOptions {
  pageSize?: number;
  recentCandidateLimit?: number;
  googleRankCandidateLimit?: number;
  googleApiKey?: string;
}

export interface FetchTrendingFontsResult {
  fonts: TrendingFont[];
  source: {
    provider: "fontsource";
    candidateCount: number;
    statsResolvedCount: number;
    hasGoogleRankSignals: boolean;
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for ${url}`);
  }
  return (await res.json()) as T;
}

function normalizeDownloadStats(
  stats?: Partial<FontDownloadStats>
): FontDownloadStats {
  return {
    npmDownloadTotal: stats?.npmDownloadTotal ?? 0,
    npmDownloadMonthly: stats?.npmDownloadMonthly ?? 0,
    jsDelivrHitsTotal: stats?.jsDelivrHitsTotal ?? 0,
    jsDelivrHitsMonthly: stats?.jsDelivrHitsMonthly ?? 0,
  };
}

function normalizeUsageStats(raw: RawFontUsageStats): FontUsageStats {
  return {
    total: normalizeDownloadStats(raw.total),
    static: normalizeDownloadStats(raw.static),
    variable: raw.variable ? normalizeDownloadStats(raw.variable) : undefined,
  };
}

function makeFamilyToIdIndex(metadata: FontMetadataIndex): Map<string, string> {
  const out = new Map<string, string>();
  for (const entry of Object.values(metadata)) {
    if (!entry.family || !entry.id) continue;
    out.set(entry.family.toLowerCase(), entry.id);
  }
  return out;
}

async function fetchGoogleRankMap(
  sort: "trending" | "popularity" | "date",
  apiKey: string
): Promise<Map<string, number>> {
  const url = new URL(GOOGLE_WEBFONTS_URL);
  url.searchParams.set("sort", sort);
  url.searchParams.set("key", apiKey);

  const data = await fetchJson<GoogleWebfontsResponse>(url.toString());
  const ranks = new Map<string, number>();
  for (let i = 0; i < (data.items?.length ?? 0); i++) {
    const family = data.items?.[i]?.family;
    if (!family) continue;
    ranks.set(family.toLowerCase(), i + 1);
  }
  return ranks;
}

function getLastModified(
  id: string,
  fontListDates: FontLastModifiedIndex,
  metadata: FontMetadataIndex
): string {
  return fontListDates[id] ?? metadata[id]?.lastModified ?? "1970-01-01";
}

function pickCandidateIds(
  fontListDates: FontLastModifiedIndex,
  metadata: FontMetadataIndex,
  rankMaps: {
    trending: Map<string, number>;
    popularity: Map<string, number>;
    date: Map<string, number>;
  },
  recentLimit: number,
  rankLimit: number
): string[] {
  const metadataIds = Object.keys(metadata);
  metadataIds.sort((a, b) =>
    getLastModified(b, fontListDates, metadata).localeCompare(
      getLastModified(a, fontListDates, metadata)
    )
  );

  const selected = new Set<string>(metadataIds.slice(0, recentLimit));
  const familyToId = makeFamilyToIdIndex(metadata);

  const addRankedFamilies = (rankMap: Map<string, number>) => {
    let count = 0;
    for (const family of rankMap.keys()) {
      if (count >= rankLimit) break;
      const id = familyToId.get(family);
      if (!id) continue;
      selected.add(id);
      count += 1;
    }
  };

  addRankedFamilies(rankMaps.trending);
  addRankedFamilies(rankMaps.popularity);
  addRankedFamilies(rankMaps.date);

  return [...selected];
}

async function fetchFontUsageStats(id: string): Promise<FontUsageStats | null> {
  const url = `${FONTSOURCE_STATS_URL}/${id}`;

  for (let attempt = 0; attempt <= STATS_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { cache: "no-store" });

      if (res.status === 404) return null;
      if (res.status === 429 && attempt < STATS_RETRIES) {
        await sleep(250 * (attempt + 1));
        continue;
      }

      if (!res.ok) {
        if (attempt < STATS_RETRIES) {
          await sleep(250 * (attempt + 1));
          continue;
        }
        return null;
      }

      const data = (await res.json()) as RawFontUsageStats;
      return normalizeUsageStats(data);
    } catch {
      if (attempt < STATS_RETRIES) {
        await sleep(250 * (attempt + 1));
        continue;
      }
      return null;
    }
  }

  return null;
}

async function fetchUsageStatsInBatches(
  ids: string[],
  concurrency = STATS_CONCURRENCY
): Promise<Map<string, FontUsageStats>> {
  const pending = [...ids];
  const out = new Map<string, FontUsageStats>();
  const workers = Array.from(
    { length: Math.min(Math.max(concurrency, 1), pending.length) },
    async () => {
      while (pending.length > 0) {
        const id = pending.pop();
        if (!id) break;
        const stats = await fetchFontUsageStats(id);
        if (stats) out.set(id, stats);
      }
    }
  );

  await Promise.all(workers);
  return out;
}

function fallbackFamilyName(id: string): string {
  return id
    .split("-")
    .map((part) => {
      if (part.length <= 2) return part.toUpperCase();
      return part[0].toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function rankBoost(rank: number | undefined, total: number, weight: number): number {
  if (!rank || total <= 0) return 0;
  const percentile = 1 - (rank - 1) / total;
  return Math.max(percentile, 0) * weight;
}

function freshnessBoost(lastModified: string): number {
  const parsed = Date.parse(lastModified);
  if (Number.isNaN(parsed)) return 0;

  const ageDays = (Date.now() - parsed) / (1000 * 60 * 60 * 24);
  if (ageDays <= 0) return 2;
  return Math.max(0, 2 - ageDays / 180);
}

function computeScore(
  stats: FontUsageStats,
  lastModified: string,
  ranks: FontRankSignals,
  rankSizes: { trending: number; popularity: number; date: number },
  variable: boolean
): number {
  const monthlySignal =
    stats.total.npmDownloadMonthly + stats.total.jsDelivrHitsMonthly * 0.15;
  const volumeScore = Math.log10(monthlySignal + 10) * 4;

  const rankScore =
    rankBoost(ranks.googleTrendingRank, rankSizes.trending, 3.2) +
    rankBoost(ranks.googlePopularityRank, rankSizes.popularity, 2.0) +
    rankBoost(ranks.googleDateRank, rankSizes.date, 1.0);

  const score =
    volumeScore +
    freshnessBoost(lastModified) +
    rankScore +
    (variable ? 0.3 : 0);

  return Math.round(score * 100) / 100;
}

export async function fetchTrendingFonts(
  opts: FetchTrendingFontsOptions = {}
): Promise<FetchTrendingFontsResult> {
  const pageSize = opts.pageSize ?? 100;
  const recentLimit = opts.recentCandidateLimit ?? DEFAULT_RECENT_CANDIDATE_LIMIT;
  const rankLimit =
    opts.googleRankCandidateLimit ?? DEFAULT_GOOGLE_RANK_CANDIDATE_LIMIT;
  const googleApiKey = opts.googleApiKey ?? process.env.GOOGLE_FONTS_API_KEY;

  const [fontListDates, metadata] = await Promise.all([
    fetchJson<FontLastModifiedIndex>(FONTSOURCE_FONTLIST_URL).catch(() => ({})),
    fetchJson<FontMetadataIndex>(GOOGLE_FONT_METADATA_URL),
  ]);

  let googleTrendingRanks = new Map<string, number>();
  let googlePopularityRanks = new Map<string, number>();
  let googleDateRanks = new Map<string, number>();

  if (googleApiKey) {
    try {
      [googleTrendingRanks, googlePopularityRanks, googleDateRanks] =
        await Promise.all([
          fetchGoogleRankMap("trending", googleApiKey),
          fetchGoogleRankMap("popularity", googleApiKey),
          fetchGoogleRankMap("date", googleApiKey),
        ]);
    } catch (error) {
      console.warn("[fonts] Google rank signals unavailable:", String(error));
    }
  }

  const candidateIds = pickCandidateIds(
    fontListDates,
    metadata,
    {
      trending: googleTrendingRanks,
      popularity: googlePopularityRanks,
      date: googleDateRanks,
    },
    recentLimit,
    rankLimit
  );

  const statsById = await fetchUsageStatsInBatches(candidateIds);
  const rankSizes = {
    trending: googleTrendingRanks.size,
    popularity: googlePopularityRanks.size,
    date: googleDateRanks.size,
  };

  const fonts: TrendingFont[] = [];
  for (const id of candidateIds) {
    const stats = statsById.get(id);
    if (!stats) continue;

    const meta = metadata[id];
    const family = meta?.family ?? fallbackFamilyName(id);
    const ranks: FontRankSignals = {
      googleTrendingRank: googleTrendingRanks.get(family.toLowerCase()),
      googlePopularityRank: googlePopularityRanks.get(family.toLowerCase()),
      googleDateRank: googleDateRanks.get(family.toLowerCase()),
    };

    const lastModified = getLastModified(id, fontListDates, metadata);
    const variable =
      (meta?.weights ?? []).includes(100) && (meta?.weights ?? []).includes(900);

    fonts.push({
      id,
      family,
      category: meta?.category ?? "unknown",
      type: "google",
      variable,
      subsets: meta?.subsets ?? [],
      weights: meta?.weights ?? [],
      styles: meta?.styles ?? [],
      lastModified,
      version: meta?.version ?? "",
      stats,
      ranks,
      trendingScore: computeScore(stats, lastModified, ranks, rankSizes, variable),
      installUrl: `https://fontsource.org/fonts/${id}`,
    });
  }

  fonts.sort((a, b) => b.trendingScore - a.trendingScore);

  return {
    fonts: fonts.slice(0, pageSize),
    source: {
      provider: "fontsource",
      candidateCount: candidateIds.length,
      statsResolvedCount: statsById.size,
      hasGoogleRankSignals:
        googleTrendingRanks.size > 0 ||
        googlePopularityRanks.size > 0 ||
        googleDateRanks.size > 0,
    },
  };
}

