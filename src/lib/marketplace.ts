import { inflateRawSync } from "zlib";
import { Theme, ThemeColor } from "./types";

const MARKETPLACE_API =
  "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery";
const MIN_INSTALLS = 1_000;
const MAX_INSTALLS = 150_000;
const THEME_CATEGORY = "Themes";

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
  _manifest?: Record<string, unknown>;
  _palette?: ThemeColor[];
}

interface ThemeContribution {
  label?: string;
  uiTheme?: string;
  path?: string;
}

interface TokenColorRule {
  scope?: string | string[];
  settings?: { foreground?: string };
}

interface ThemeDefinition {
  colors?: Record<string, string>;
  tokenColors?: TokenColorRule[] | string;
  include?: string;
}

function buildQuery(
  sortBy: number,
  sortOrder: number,
  pageSize: number,
  pageNumber = 1
) {
  return {
    filters: [
      {
        criteria: [
          { filterType: 8, value: "Microsoft.VisualStudio.Code" },
          { filterType: 5, value: THEME_CATEGORY },
          { filterType: 12, value: "4096" },
        ],
        direction: sortOrder,
        pageSize,
        pageNumber,
        sortBy,
      },
    ],
    // Request manifest to check for theme contributions
    assetTypes: ["Microsoft.VisualStudio.Code.Manifest"],
    flags: 0x192,
  };
}

const DEFAULT_THEME_COLORS: ThemeColor[] = [
  { name: "editor.background", hex: "#1e1e2e" },
  { name: "editor.foreground", hex: "#cdd6f4" },
  { name: "keyword", hex: "#3cf73c" },
  { name: "string", hex: "#f7d73c" },
  { name: "comment", hex: "#5a5a66" },
  { name: "variable", hex: "#f73c3c" },
  { name: "function", hex: "#3c9cf7" },
  { name: "number", hex: "#f7d73c" },
];

function getThemeContributions(
  manifest?: Record<string, unknown>
): ThemeContribution[] {
  return (
    ((manifest?.contributes as Record<string, unknown> | undefined)
      ?.themes as ThemeContribution[] | undefined) ?? []
  );
}

function pickBestHex(
  tokenMap: Record<string, string>,
  exactScopes: string[],
  containsScopes: string[] = []
): string | null {
  for (const exactScope of exactScopes) {
    for (const [scope, hex] of Object.entries(tokenMap)) {
      if (scope.toLowerCase() === exactScope) {
        return hex;
      }
    }
  }

  for (const exactScope of exactScopes) {
    for (const [scope, hex] of Object.entries(tokenMap)) {
      if (scope.toLowerCase().startsWith(`${exactScope}.`)) {
        return hex;
      }
    }
  }

  for (const containsScope of containsScopes) {
    for (const [scope, hex] of Object.entries(tokenMap)) {
      if (scope.toLowerCase().includes(containsScope)) {
        return hex;
      }
    }
  }

  return null;
}

function normalizeThemePath(themePath: string): string {
  const clean = themePath.replace(/^\.\//, "");
  return clean.startsWith("extension/") ? clean : `extension/${clean}`;
}

function resolveRelativeThemePath(basePath: string, relativePath: string): string {
  const baseParts = normalizeThemePath(basePath).split("/");
  baseParts.pop();

  for (const part of relativePath.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      baseParts.pop();
      continue;
    }
    baseParts.push(part);
  }

  return baseParts.join("/");
}

function readZipEntry(zipData: Uint8Array, entryName: string): string | null {
  const data = Buffer.from(zipData);
  const eocdSignature = 0x06054b50;
  const centralDirectorySignature = 0x02014b50;
  const localFileSignature = 0x04034b50;

  let eocdOffset = -1;
  for (let i = data.length - 22; i >= Math.max(0, data.length - 65557); i--) {
    if (data.readUInt32LE(i) === eocdSignature) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) return null;

  const centralDirectoryOffset = data.readUInt32LE(eocdOffset + 16);
  const totalEntries = data.readUInt16LE(eocdOffset + 10);
  let offset = centralDirectoryOffset;

  for (let i = 0; i < totalEntries; i++) {
    if (data.readUInt32LE(offset) !== centralDirectorySignature) return null;

    const compressionMethod = data.readUInt16LE(offset + 10);
    const compressedSize = data.readUInt32LE(offset + 20);
    const fileNameLength = data.readUInt16LE(offset + 28);
    const extraLength = data.readUInt16LE(offset + 30);
    const commentLength = data.readUInt16LE(offset + 32);
    const localHeaderOffset = data.readUInt32LE(offset + 42);
    const fileName = data
      .subarray(offset + 46, offset + 46 + fileNameLength)
      .toString("utf8");

    if (fileName === entryName) {
      if (data.readUInt32LE(localHeaderOffset) !== localFileSignature) {
        return null;
      }

      const localFileNameLength = data.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = data.readUInt16LE(localHeaderOffset + 28);
      const contentOffset =
        localHeaderOffset + 30 + localFileNameLength + localExtraLength;
      const compressed = data.subarray(
        contentOffset,
        contentOffset + compressedSize
      );

      if (compressionMethod === 0) {
        return compressed.toString("utf8");
      }

      if (compressionMethod === 8) {
        return inflateRawSync(compressed).toString("utf8");
      }

      return null;
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return null;
}

function parseThemeDefinition(
  zipData: Uint8Array,
  themePath: string,
  visited = new Set<string>()
): ThemeDefinition | null {
  const normalizedPath = normalizeThemePath(themePath);
  if (visited.has(normalizedPath)) return null;
  visited.add(normalizedPath);

  const raw = readZipEntry(zipData, normalizedPath);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ThemeDefinition;
    const mergedColors: Record<string, string> = {};
    const mergedTokens: TokenColorRule[] = [];

    if (parsed.include) {
      const parent = parseThemeDefinition(
        zipData,
        resolveRelativeThemePath(normalizedPath, parsed.include),
        visited
      );
      if (parent?.colors) Object.assign(mergedColors, parent.colors);
      if (Array.isArray(parent?.tokenColors)) mergedTokens.push(...parent.tokenColors);
    }

    if (typeof parsed.tokenColors === "string") {
      const tokenFile = readZipEntry(
        zipData,
        resolveRelativeThemePath(normalizedPath, parsed.tokenColors)
      );
      if (tokenFile) {
        try {
          const parsedTokens = JSON.parse(tokenFile) as TokenColorRule[];
          if (Array.isArray(parsedTokens)) mergedTokens.push(...parsedTokens);
        } catch {
          // Ignore token color formats we do not parse yet.
        }
      }
    } else if (Array.isArray(parsed.tokenColors)) {
      mergedTokens.push(...parsed.tokenColors);
    }

    if (parsed.colors) Object.assign(mergedColors, parsed.colors);

    return {
      colors: mergedColors,
      tokenColors: mergedTokens,
    };
  } catch {
    return null;
  }
}

function buildPalette(themeDef: ThemeDefinition | null): ThemeColor[] {
  if (!themeDef) return DEFAULT_THEME_COLORS;

  const colors = themeDef.colors ?? {};
  const tokenMap: Record<string, string> = {};

  for (const token of Array.isArray(themeDef.tokenColors) ? themeDef.tokenColors : []) {
    const foreground = token.settings?.foreground;
    if (!foreground) continue;

    const scopes = Array.isArray(token.scope) ? token.scope : [token.scope];
    for (const scope of scopes) {
      if (scope && !tokenMap[scope]) {
        tokenMap[scope] = foreground;
      }
    }
  }

  const palette: ThemeColor[] = [
    {
      name: "editor.background",
      hex: colors["editor.background"] ?? colors["terminal.background"] ?? DEFAULT_THEME_COLORS[0].hex,
    },
    {
      name: "editor.foreground",
      hex: colors["editor.foreground"] ?? colors.foreground ?? colors["terminal.foreground"] ?? DEFAULT_THEME_COLORS[1].hex,
    },
    {
      name: "keyword",
      hex:
        pickBestHex(tokenMap, ["keyword", "storage"], ["keyword", "storage"]) ??
        colors["editorCursor.foreground"] ??
        DEFAULT_THEME_COLORS[2].hex,
    },
    {
      name: "string",
      hex:
        pickBestHex(tokenMap, ["string"], ["quoted", "string"]) ??
        colors["terminal.ansiYellow"] ??
        DEFAULT_THEME_COLORS[3].hex,
    },
    {
      name: "comment",
      hex:
        pickBestHex(
          tokenMap,
          ["comment", "punctuation.definition.comment"],
          ["comment"]
        ) ??
        colors["descriptionForeground"] ??
        DEFAULT_THEME_COLORS[4].hex,
    },
    {
      name: "variable",
      hex:
        pickBestHex(
          tokenMap,
          ["variable", "entity.other.attribute-name"],
          ["variable", "attribute"]
        ) ??
        colors["terminal.ansiRed"] ??
        DEFAULT_THEME_COLORS[5].hex,
    },
    {
      name: "function",
      hex:
        pickBestHex(
          tokenMap,
          ["entity.name.function", "support.function"],
          ["function", "method"]
        ) ??
        colors["terminal.ansiBlue"] ??
        DEFAULT_THEME_COLORS[6].hex,
    },
    {
      name: "number",
      hex:
        pickBestHex(
          tokenMap,
          ["constant.numeric", "constant.language"],
          ["numeric", "number", "constant"]
        ) ??
        colors["terminal.ansiMagenta"] ??
        DEFAULT_THEME_COLORS[7].hex,
    },
  ];

  return palette;
}

async function fetchExtensionFile(
  assetUri: string,
  filePath: string
): Promise<string | null> {
  try {
    const url = `${assetUri}/${filePath}`;
    const res = await fetch(url, { next: { revalidate: 21600 } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function parseThemeDefinitionFromFiles(
  raw: string,
  themePath: string,
  assetUri: string,
  visited: Set<string>
): Promise<ThemeDefinition | null> {
  const normalizedPath = normalizeThemePath(themePath);
  if (visited.has(normalizedPath)) return null;
  visited.add(normalizedPath);

  try {
    const parsed = JSON.parse(raw) as ThemeDefinition;
    const mergedColors: Record<string, string> = {};
    const mergedTokens: TokenColorRule[] = [];

    if (parsed.include) {
      const includePath = resolveRelativeThemePath(
        normalizedPath,
        parsed.include
      );
      const includeRaw = await fetchExtensionFile(assetUri, includePath);
      if (includeRaw) {
        const included = await parseThemeDefinitionFromFiles(
          includeRaw,
          includePath,
          assetUri,
          visited
        );
        if (included?.colors) Object.assign(mergedColors, included.colors);
        if (Array.isArray(included?.tokenColors))
          mergedTokens.push(...included.tokenColors);
      }
    }

    if (typeof parsed.tokenColors === "string") {
      const tokenPath = resolveRelativeThemePath(
        normalizedPath,
        parsed.tokenColors
      );
      const tokenRaw = await fetchExtensionFile(assetUri, tokenPath);
      if (tokenRaw) {
        try {
          const parsedTokens = JSON.parse(tokenRaw) as TokenColorRule[];
          if (Array.isArray(parsedTokens)) mergedTokens.push(...parsedTokens);
        } catch {
          // Ignore token color formats we do not parse yet.
        }
      }
    } else if (Array.isArray(parsed.tokenColors)) {
      mergedTokens.push(...parsed.tokenColors);
    }

    if (parsed.colors) Object.assign(mergedColors, parsed.colors);

    return {
      colors: mergedColors,
      tokenColors: mergedTokens,
    };
  } catch {
    return null;
  }
}

async function fetchPalette(ext: MarketplaceExtension): Promise<ThemeColor[]> {
  const themePath = getThemeContributions(ext._manifest)[0]?.path;
  if (!themePath) return DEFAULT_THEME_COLORS;

  const assetUri = ext.versions[0].assetUri;

  // Try fetching the theme JSON directly (lightweight, ~1-50KB per file)
  // instead of the full VSIX (~1-10MB per file)
  const raw = await fetchExtensionFile(assetUri, normalizeThemePath(themePath));
  if (raw) {
    try {
      const themeDef = await parseThemeDefinitionFromFiles(
        raw,
        themePath,
        assetUri,
        new Set()
      );
      if (themeDef) return buildPalette(themeDef);
    } catch {
      // Fall through to VSIX download
    }
  }

  // Fallback: download full VSIX
  try {
    const vsixUrl = `${assetUri}/Microsoft.VisualStudio.Services.VSIXPackage`;
    const res = await fetch(vsixUrl, {
      next: { revalidate: 21600 },
    });
    if (!res.ok) return DEFAULT_THEME_COLORS;

    const zipData = new Uint8Array(await res.arrayBuffer());
    const themeDef = parseThemeDefinition(zipData, themePath);
    return buildPalette(themeDef);
  } catch {
    return DEFAULT_THEME_COLORS;
  }
}

function getStats(ext: MarketplaceExtension): Record<string, number> {
  return Object.fromEntries(
    (ext.statistics || []).map((s) => [s.statisticName, s.value])
  ) as Record<string, number>;
}

function mapExtension(ext: MarketplaceExtension, trendingScore: number): Theme {
  const stats = getStats(ext);
  const latest = ext.versions[0];
  const typeTag = ext.tags?.find(
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
    categories: (ext.tags || []).filter(
      (t) => !t.startsWith("theme-") && !t.startsWith("__")
    ),
    colors: ext._palette ?? DEFAULT_THEME_COLORS,
    iconUrl: iconFile?.source || null,
    vscodeId: `${ext.publisher.publisherName}.${ext.extensionName}`,
    trendingScore,
  };
}

async function fetchManifest(ext: MarketplaceExtension): Promise<Record<string, unknown> | null> {
  try {
    const manifestFile = ext.versions[0].files.find(
      (f) => f.assetType === "Microsoft.VisualStudio.Code.Manifest"
    );
    if (!manifestFile) return null;
    const res = await fetch(manifestFile.source);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function scoreTheme(ext: MarketplaceExtension): number {
  const stats = getStats(ext);
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
  pageNumber = 1
): Promise<MarketplaceExtension[]> {
  const body = buildQuery(sortBy, sortOrder, pageSize, pageNumber);

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

async function attachManifestsInBatches(
  extensions: MarketplaceExtension[],
  batchSize: number
): Promise<void> {
  for (let i = 0; i < extensions.length; i += batchSize) {
    const batch = extensions.slice(i, i + batchSize);
    const manifests = await Promise.all(batch.map((ext) => fetchManifest(ext)));
    for (let j = 0; j < batch.length; j++) {
      batch[j]._manifest = manifests[j] ?? undefined;
    }
  }
}

async function attachPalettesInBatches(
  extensions: MarketplaceExtension[],
  batchSize: number
): Promise<void> {
  for (let i = 0; i < extensions.length; i += batchSize) {
    const batch = extensions.slice(i, i + batchSize);
    const palettes = await Promise.all(batch.map((ext) => fetchPalette(ext)));
    for (let j = 0; j < batch.length; j++) {
      batch[j]._palette = palettes[j];
    }
  }
}

export async function fetchTrendingThemes(pageSize = 100): Promise<Theme[]> {
  const SORT_BY_INSTALLS = 4;
  const SORT_BY_DATE = 1;
  const SORT_BY_RATING = 2;
  const SORT_DESC = 0;

  const all: MarketplaceExtension[] = [];
  const seen = new Set<string>();
  const maxPages = 12;
  const minCandidates = pageSize * 4;

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber++) {
    const [byInstalls, byDate, byRating] = await Promise.all([
      fetchPage(SORT_BY_INSTALLS, SORT_DESC, pageSize, pageNumber),
      fetchPage(SORT_BY_DATE, SORT_DESC, pageSize, pageNumber),
      fetchPage(SORT_BY_RATING, SORT_DESC, Math.floor(pageSize / 2), pageNumber),
    ]);

    const pageResults = [...byInstalls, ...byDate, ...byRating];
    if (pageResults.length === 0) break;

    for (const ext of [...byInstalls, ...byDate, ...byRating]) {
      if (!seen.has(ext.extensionId)) {
        seen.add(ext.extensionId);
        all.push(ext);
      }
    }

    const candidateCount = all.filter((ext) => {
      const installs = getStats(ext).install || 0;
      return installs >= MIN_INSTALLS && installs <= MAX_INSTALLS;
    }).length;

    if (candidateCount >= minCandidates) {
      break;
    }
  }

  await attachManifestsInBatches(all, 10);

  const ranked = all
    .filter((ext) => {
      const installs = getStats(ext).install || 0;
      if (installs < MIN_INSTALLS || installs > MAX_INSTALLS) return false;
      return Boolean(
        ext._manifest &&
          (ext._manifest.contributes as Record<string, unknown> | undefined)
            ?.themes
      );
    })
    .sort((a, b) => scoreTheme(b) - scoreTheme(a))
    .slice(0, pageSize);

  await attachPalettesInBatches(ranked, 5);

  return ranked
    .map((ext) => mapExtension(ext, Math.round(scoreTheme(ext) * 100) / 100))
    .filter(
      (theme) => theme.installs >= MIN_INSTALLS && theme.installs <= MAX_INSTALLS
    )
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
    assetTypes: ["Microsoft.VisualStudio.Code.Manifest"],
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

  ext._manifest = (await fetchManifest(ext)) ?? undefined;
  ext._palette = await fetchPalette(ext);

  const theme = mapExtension(ext, Math.round(scoreTheme(ext) * 100) / 100);
  return theme.installs >= MIN_INSTALLS ? theme : null;
}
