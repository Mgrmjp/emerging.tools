export interface FontDownloadStats {
  npmDownloadTotal: number;
  npmDownloadMonthly: number;
  jsDelivrHitsTotal: number;
  jsDelivrHitsMonthly: number;
}

export interface FontUsageStats {
  total: FontDownloadStats;
  static: FontDownloadStats;
  variable?: FontDownloadStats;
}

export interface FontRankSignals {
  googleTrendingRank?: number;
  googlePopularityRank?: number;
  googleDateRank?: number;
}

export interface TrendingFont {
  id: string;
  family: string;
  category: string;
  type: "google" | "icons" | "other";
  variable: boolean;
  subsets: string[];
  weights: number[];
  styles: string[];
  lastModified: string;
  version: string;
  stats: FontUsageStats;
  ranks: FontRankSignals;
  trendingScore: number;
  installUrl: string;
}

