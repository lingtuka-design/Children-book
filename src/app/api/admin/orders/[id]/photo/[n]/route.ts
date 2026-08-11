import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { orderDir } from "@/lib/storage";

/**
 * Serves a customer's uploaded photo to an authenticated admin only.
 * Customer photos are private and never exposed through public routes.
 */
export async function generateStaticParams() {
  return [{ id: "sample", n: "1" }];
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; n: string }> }
) {
  const { id, n } = await ctx.params;
  if (n !== "1" && n !== "2") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      childPhoto1: true,
      childPhoto2: true,
      orderNumber: true,
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const rel = n === "1" ? order.childPhoto1 : order.childPhoto2;
  const filePath = path.join(orderDir(order.orderNumber), path.basename(rel));
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType =
    ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

  const download = req.nextUrl.searchParams.get("download") === "1";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": download
        ? `attachment; filename="photo${n}${ext}"`
        : `inline; filename="photo${n}${ext}"`,
    },
  });
}
