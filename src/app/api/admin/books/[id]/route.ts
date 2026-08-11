import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookMetadataSchema } from "@/lib/validation";
import { slugify } from "@/lib/site";
import { deleteBookFiles } from "@/lib/process-book";
import { requireAdminMutation } from "@/lib/auth";

export async function generateStaticParams() {
  return [{ id: "sample" }];
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const book = await prisma.book.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      author: true,
      illustrator: true,
      year: true,
      tags: true,
      cover: true,
      pageCount: true,
      published: true,
      topFeature: true,
    },
  });
  if (!book) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }
  return NextResponse.json({ book });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const blocked = await requireAdminMutation(req);
  if (blocked) return blocked;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = bookMetadataSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form." },
      { status: 400 }
    );
  }

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  const data = parsed.data;
  const updates: Record<string, unknown> = {
    title: data.title,
    description: data.description || null,
    author: data.author || null,
    illustrator: data.illustrator || null,
    year: data.year || null,
    tags: data.tags || null,
  };

  // Keep the slug in sync with the title (unless it would collide).
  const newSlug = slugify(data.title) || book.slug;
  if (newSlug !== book.slug) {
    const collision = await prisma.book.findFirst({
      where: { slug: newSlug, id: { not: id } },
      select: { id: true },
    });
    if (!collision) updates.slug = newSlug;
  }

  const updated = await prisma.book.update({
    where: { id },
    data: updates,
    select: { id: true, title: true, slug: true },
  });

  return NextResponse.json({ book: updated });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const blocked = await requireAdminMutation(req);
  if (blocked) return blocked;

  const { id } = await ctx.params;
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.bookPage.deleteMany({ where: { bookId: id } }),
    prisma.book.delete({ where: { id } }),
  ]);
  deleteBookFiles(id);

  return NextResponse.json({ ok: true });
}
