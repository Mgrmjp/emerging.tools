import { MetadataRoute } from "next";
import { getThemes } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const themes = await getThemes();
  const latestThemeUpdate =
    themes
      .map((theme) => new Date(theme.lastUpdated).getTime())
      .filter((time) => Number.isFinite(time))
      .sort((a, b) => b - a)[0] ?? Date.now();

  const themeUrls = themes.map((theme) => ({
    url: `${SITE_URL}/themes/${theme.id}`,
    lastModified: new Date(theme.lastUpdated || latestThemeUpdate),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(latestThemeUpdate),
      changeFrequency: "daily",
      priority: 1,
    },
    ...themeUrls,
  ];
}
