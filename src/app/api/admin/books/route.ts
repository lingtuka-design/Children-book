import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const books = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      coverThumb: true,
      pageCount: true,
      published: true,
      topFeature: true,
      featureOrder: true,
      displayOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ books });
}
