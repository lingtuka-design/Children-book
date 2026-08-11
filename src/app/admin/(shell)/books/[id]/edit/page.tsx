import { prisma } from "@/lib/prisma";
import { EditBookClient } from "./EditBookClient";

export async function generateStaticParams() {
  const books = await prisma.book.findMany({ select: { id: true } });
  return books.map((b) => ({ id: b.id }));
}

export default function EditBookPage() {
  return <EditBookClient />;
}
