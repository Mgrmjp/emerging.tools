export interface ThemeColor {
  name: string;
  hex: string;
}

export interface Theme {
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
  colors: ThemeColor[];
  iconUrl: string | null;
  vscodeId: string;
  trendingScore: number;
}
