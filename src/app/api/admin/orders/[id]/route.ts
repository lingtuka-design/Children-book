import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminMutation } from "@/lib/auth";
import { orderStatusSchema } from "@/lib/validation";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { product: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ order });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const blocked = await requireAdminMutation(req);
  if (blocked) return blocked;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const status = orderStatusSchema.safeParse(body?.status);
  if (!status.success) {
    return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: status.data },
    select: { id: true, status: true, updatedAt: true },
  });

  return NextResponse.json({ order: updated });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const blocked = await requireAdminMutation(req);
  if (blocked) return blocked;

  const { id } = await ctx.params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
