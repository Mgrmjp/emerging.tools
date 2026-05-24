import { MetadataRoute } from "next";
import { getThemes } from "@/lib/data";
import { getFonts } from "@/lib/font-data";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [themes, fonts] = await Promise.all([getThemes(), getFonts()]);
  const latestThemeUpdate =
    themes
      .map((theme) => new Date(theme.lastUpdated).getTime())
      .filter((time) => Number.isFinite(time))
      .sort((a, b) => b - a)[0] ?? Date.now();
  const latestFontUpdate =
    fonts
      .map((font) => new Date(font.lastModified).getTime())
      .filter((time) => Number.isFinite(time))
      .sort((a, b) => b - a)[0] ?? Date.now();
  const latestUpdate = new Date(Math.max(latestThemeUpdate, latestFontUpdate));

  const themeUrls = themes.map((theme) => ({
    url: `${SITE_URL}/themes/${theme.id}`,
    lastModified: new Date(theme.lastUpdated || latestThemeUpdate),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const fontUrls = fonts.map((font) => ({
    url: `${SITE_URL}/fonts/${font.id}`,
    lastModified: new Date(font.lastModified || latestFontUpdate),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: latestUpdate,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/fonts`,
      lastModified: latestUpdate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...themeUrls,
    ...fontUrls,
  ];
}
