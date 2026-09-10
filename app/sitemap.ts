// app/sitemap.ts

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Public, crawlable routes only. Authenticated views and /login are omitted:
 * they carry no content a search result should ever point at.
 */
const routes = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
] as const satisfies ReadonlyArray<{
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}>;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  // Static export, so this resolves once at build time rather than per crawl.
  const lastModified = new Date();

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
