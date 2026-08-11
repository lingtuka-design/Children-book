import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Public order lookup by order number (used by the confirmation page). */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await ctx.params;
  const order = await prisma.order.findUnique({
    where: { orderNumber: orderNumber.toUpperCase() },
    select: {
      orderNumber: true,
      customerName: true,
      pageCount: true,
      aspectRatio: true,
      price: true,
      currency: true,
      status: true,
      createdAt: true,
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ order });
}
