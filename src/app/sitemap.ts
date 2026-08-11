import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const books = await prisma.book.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
  });

  return [
    { url: SITE.url, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE.url}/books`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/order`, changeFrequency: "monthly", priority: 0.8 },
    ...books.map((b) => ({
      url: `${SITE.url}/book/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
