import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminMutation } from "@/lib/auth";

/**
 * Marks/removes a Top Feature and manages feature ordering.
 * Body: { topFeature: boolean, featureOrder?: number }
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const blocked = await requireAdminMutation(req);
  if (blocked) return blocked;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  const topFeature = Boolean(body?.topFeature);
  let featureOrder = book.featureOrder;

  if (topFeature && !book.topFeature) {
    // New feature: take the next slot.
    const max = await prisma.book.aggregate({
      where: { topFeature: true },
      _max: { featureOrder: true },
    });
    featureOrder = (max._max.featureOrder ?? 0) + 1;
  } else if (!topFeature) {
    featureOrder = 0;
    // Tighten the gaps left behind.
    const features = await prisma.book.findMany({
      where: { topFeature: true, featureOrder: { gt: book.featureOrder } },
      orderBy: { featureOrder: "asc" },
      select: { id: true, featureOrder: true },
    });
    for (const f of features) {
      await prisma.book.update({
        where: { id: f.id },
        data: { featureOrder: f.featureOrder - 1 },
      });
    }
  } else if (typeof body?.featureOrder === "number") {
    featureOrder = Math.max(1, Math.floor(body.featureOrder));
  }

  const updated = await prisma.book.update({
    where: { id },
    data: { topFeature, featureOrder },
    select: { id: true, topFeature: true, featureOrder: true },
  });

  return NextResponse.json({ book: updated });
}
