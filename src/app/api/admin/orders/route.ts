export const revalidate = false;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES } from "@/lib/site";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl?.searchParams;
    const status = searchParams?.get("status") ?? "ALL";
    const sort = searchParams?.get("sort") ?? "newest";
    const query = searchParams?.get("q")?.trim() ?? "";

  if (status !== "ALL" && !ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    return NextResponse.json({ error: "Unknown status filter." }, { status: 400 });
  }

  const where = {
    ...(status !== "ALL" ? { status } : {}),
    ...(query
      ? {
          OR: [
            { orderNumber: { contains: query } },
            { customerName: { contains: query } },
            { phone: { contains: query } },
          ],
        }
      : {}),
  };

  const orderBy: Record<string, string> | Record<string, string>[] =
    sort === "oldest"
      ? { createdAt: "asc" }
      : sort === "name"
        ? { customerName: "asc" }
        : sort === "status"
          ? [{ status: "asc" }, { createdAt: "desc" }]
          : { createdAt: "desc" };

  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        phone: true,
        pageCount: true,
        aspectRatio: true,
        price: true,
        currency: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const statusCounts: Record<string, number> = { ALL: counts.reduce((s, c) => s + c._count._all, 0) };
  for (const c of counts) statusCounts[c.status] = c._count._all;

  return NextResponse.json({ orders, statusCounts });
  } catch {
    return NextResponse.json({ orders: [], statusCounts: { ALL: 0 } });
  }
}
