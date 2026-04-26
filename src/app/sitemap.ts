import { MetadataRoute } from "next";
import { getThemes } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const themes = await getThemes();

  const themeUrls = themes.map((theme) => ({
    url: `https://emerging.tools/themes/${theme.id}`,
    lastModified: new Date(theme.lastUpdated),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: "https://emerging.tools",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...themeUrls,
  ];
}