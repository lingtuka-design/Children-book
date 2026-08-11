import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = false;

export async function GET() {
  const [
    totalBooks,
    publishedBooks,
    topFeatures,
    totalOrders,
    newOrders,
    inProgress,
    awaiting,
    completed,
    cancelled,
    recentOrders,
    recentBooks,
  ] = await Promise.all([
    prisma.book.count(),
    prisma.book.count({ where: { published: true } }),
    prisma.book.count({ where: { topFeature: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.order.count({ where: { status: "IN_PROGRESS" } }),
    prisma.order.count({ where: { status: "AWAITING_CUSTOMER" } }),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        status: true,
        price: true,
        currency: true,
        createdAt: true,
      },
    }),
    prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        slug: true,
        coverThumb: true,
        pageCount: true,
        published: true,
        topFeature: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    stats: {
      totalBooks,
      publishedBooks,
      topFeatures,
      totalOrders,
      newOrders,
      inProgress,
      awaiting,
      completed,
      cancelled,
    },
    recentOrders,
    recentBooks,
  });
}
