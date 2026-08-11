import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminMutation } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const blocked = await requireAdminMutation(req);
  if (blocked) return blocked;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const published = Boolean(body?.published);

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  const updated = await prisma.book.update({
    where: { id },
    data: { published },
    select: { id: true, published: true },
  });

  return NextResponse.json({ book: updated });
}
