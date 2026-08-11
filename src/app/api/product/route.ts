import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Active product config for the order form (v1: 24 pages / 4:3 / Rs. 1,500). */
export const revalidate = false;

export async function GET() {
  const product = await prisma.product.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
  if (!product) {
    return NextResponse.json(
      { error: "No products are currently available." },
      { status: 404 }
    );
  }
  return NextResponse.json({ product });
}
