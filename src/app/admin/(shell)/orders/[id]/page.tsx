import { prisma } from "@/lib/prisma";
import { OrderDetailClient } from "./OrderDetailClient";

export async function generateStaticParams() {
  const orders = await prisma.order.findMany({ select: { id: true } });
  return orders.map((o) => ({ id: o.id }));
}

export default function AdminOrderDetailPage() {
  return <OrderDetailClient />;
}
