import type { MetadataRoute } from "next";

import { getPublishedDestinations, getPublishedOffers } from "@/lib/public-data";
import { siteUrl } from "@/lib/vitrine";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [offers, destinations] = await Promise.all([
    getPublishedOffers(),
    getPublishedDestinations(),
  ]);

  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/a-propos`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/services`, changeFrequency: "weekly", priority: 0.9 },
    ...offers.map((o) => ({
      url: `${base}/services/${o.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${base}/galerie`, changeFrequency: "weekly", priority: 0.8 },
    ...destinations.map((d) => ({
      url: `${base}/destinations/${d.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
