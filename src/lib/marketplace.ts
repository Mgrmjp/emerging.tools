import { Theme, ThemeColor } from "./types";

const MARKETPLACE_API =
  "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery";

const MARKETPLACE_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json;api-version=6.1-preview.1",
};

interface MarketplaceExtension {
  extensionId: string;
  extensionName: string;
  displayName: string;
  shortDescription: string;
  publisher: {
    publisherName: string;
    displayName: string;
    publisherId: string;
  };
  versions: Array<{
    version: string;
    lastUpdated: string;
    assetUri: string;
    properties: Array<{ key: string; value: string }>;
    files: Array<{ assetType: string; source: string }>;
  }>;
  statistics: Array<{
    statisticName: string;
    value: number;
  }>;
  tags: string[];
}

function buildQuery(
  sortBy: number,
  sortOrder: number,
  pageSize: number,
  cursor?: number
) {
  return {
    filters: [
      {
        criteria: [
          { filterType: 8, value: "Microsoft.VisualStudio.Code" },
          { filterType: 10, value: "4096" },
        ],
        direction: sortOrder,
        pageSize,
        cursor,
        sortBy,
      },
    ],
    assetTypes: [],
    flags: 0x192,
  };
}

function extractColors(ext: MarketplaceExtension): ThemeColor[] {
  const contribution = ext.versions?.[0]?.properties?.find(
    (p) => p.key === "Microsoft.VisualStudio.Code.ExtensionContributions"
  );
  if (!contribution) return [];
  try {
    const parsed = JSON.parse(contribution.value);
    const themeContribs = parsed?.contributes?.themes;
    if (!themeContribs?.length) return [];
    const colors: ThemeColor[] = [];
    const tc = themeContribs[0];
    if (tc.colors) {
      for (const [name, hex] of Object.entries(tc.colors)) {
        colors.push({ name, hex: hex as string });
      }
    }
    if (colors.length === 0 && tc.tokenColors) {
      const tokenMap: Record<string, string> = {};
      for (const token of tc.tokenColors) {
        if (token.settings?.foreground) {
          const scope = Array.isArray(token.scope) ? token.scope[0] : token.scope;
          if (scope && !tokenMap[scope]) {
            tokenMap[scope] = token.settings.foreground;
          }
        }
      }
      const priorities = [
        "keyword",
        "string",
        "comment",
        "variable",
        "function",
        "number",
        "type",
        "constant",
      ];
      for (const p of priorities) {
        for (const [scope, hex] of Object.entries(tokenMap)) {
          if (scope.toLowerCase().includes(p) && colors.length < 8) {
            colors.push({ name: p, hex });
            break;
          }
        }
      }
    }
    if (colors.length === 0) {
      const bg = tc.colors?.["editor.background"] || "#1e1e2e";
      const fg = tc.colors?.["editor.foreground"] || "#cdd6f4";
      colors.push({ name: "editor.background", hex: bg });
      colors.push({ name: "editor.foreground", hex: fg });
    }
    return colors.slice(0, 8);
  } catch {
    return [];
  }
}

function mapExtension(ext: MarketplaceExtension, trendingScore: number): Theme {
  const stats = Object.fromEntries(
    ext.statistics.map((s) => [s.statisticName, s.value])
  );
  const latest = ext.versions[0];
  const typeTag = ext.tags.find(
    (t) => t === "theme-dark" || t === "theme-light"
  );
  const iconFile = latest?.files?.find(
    (f) => f.assetType === "Microsoft.VisualStudio.Services.Icons.Default"
  );

  return {
    id: ext.extensionId,
    name: ext.displayName || ext.extensionName,
    publisher: ext.publisher.displayName || ext.publisher.publisherName,
    publisherId: ext.publisher.publisherName,
    description: ext.shortDescription || "",
    installs: stats["install"] || 0,
    rating: stats["averagerating"] || 0,
    ratingCount: stats["ratingcount"] || 0,
    lastUpdated: latest?.lastUpdated || "",
    repository:
      latest?.properties?.find(
        (p) => p.key === "Microsoft.VisualStudio.Services.Links.Source"
      )?.value || "",
    type: typeTag === "theme-light" ? "light" : "dark",
    categories: ext.tags.filter(
      (t) => !t.startsWith("theme-") && !t.startsWith("__")
    ),
    colors: extractColors(ext),
    iconUrl: iconFile?.source || null,
    vscodeId: `${ext.publisher.publisherName}.${ext.extensionName}`,
    trendingScore,
  };
}

function scoreTheme(ext: MarketplaceExtension): number {
  const stats = Object.fromEntries(
    ext.statistics.map((s) => [s.statisticName, s.value])
  );
  const daily = stats["trendingdaily"] || 0;
  const weekly = stats["trendingweekly"] || 0;
  const monthly = stats["trendingmonthly"] || 0;
  const installs = stats["install"] || 0;
  const rating = stats["averagerating"] || 0;

  const velocity = daily * 3 + weekly * 1.5 + monthly * 0.5;
  const ratingBonus = Math.min(rating, 5) * 2;
  const freshnessBonus = installs < 10_000 ? 15 : installs < 50_000 ? 8 : 0;

  return velocity * 0.7 + ratingBonus * 0.2 + freshnessBonus * 0.1;
}

async function fetchPage(
  sortBy: number,
  sortOrder: number,
  pageSize: number,
  cursor?: number
): Promise<MarketplaceExtension[]> {
  const body = buildQuery(sortBy, sortOrder, pageSize, cursor);

  const res = await fetch(MARKETPLACE_API, {
    method: "POST",
    headers: MARKETPLACE_HEADERS,
    body: JSON.stringify(body),
    next: { revalidate: 21600 },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.results?.[0]?.extensions || [];
}

export async function fetchTrendingThemes(pageSize = 100): Promise<Theme[]> {
  const SORT_BY_INSTALLS = 4;
  const SORT_BY_DATE = 1;
  const SORT_BY_RATING = 2;
  const SORT_DESC = 0;

  const [byInstalls, byDate, byRating] = await Promise.all([
    fetchPage(SORT_BY_INSTALLS, SORT_DESC, pageSize),
    fetchPage(SORT_BY_DATE, SORT_DESC, pageSize),
    fetchPage(SORT_BY_RATING, SORT_DESC, Math.floor(pageSize / 2)),
  ]);

  const seen = new Set<string>();
  const all: MarketplaceExtension[] = [];
  for (const ext of [...byInstalls, ...byDate, ...byRating]) {
    const key = ext.extensionId;
    if (!seen.has(key)) {
      seen.add(key);
      all.push(ext);
    }
  }

  return all
    .map((ext) => mapExtension(ext, Math.round(scoreTheme(ext) * 100) / 100))
    .sort((a, b) => b.trendingScore - a.trendingScore);
}

export async function fetchThemeById(id: string): Promise<Theme | null> {
  const body = {
    filters: [
      {
        criteria: [
          { filterType: 8, value: "Microsoft.VisualStudio.Code" },
          { filterType: 10, value: id },
          { filterType: 12, value: "4096" },
        ],
        pageSize: 1,
      },
    ],
    assetTypes: [],
    flags: 0x192,
  };

  const res = await fetch(MARKETPLACE_API, {
    method: "POST",
    headers: MARKETPLACE_HEADERS,
    body: JSON.stringify(body),
    next: { revalidate: 21600 },
  });

  if (!res.ok) return null;
  const data = await res.json();
  const ext: MarketplaceExtension | undefined =
    data.results?.[0]?.extensions?.[0];
  if (!ext) return null;

  return mapExtension(ext, Math.round(scoreTheme(ext) * 100) / 100);
}
