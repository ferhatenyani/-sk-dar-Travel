import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/vitrine";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/a-propos`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/services`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/galerie`, changeFrequency: "weekly", priority: 0.8 },
  ];
}
