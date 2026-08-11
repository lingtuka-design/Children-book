import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";

/**
 * Unique, human-referenceable order numbers, e.g. CB-260811-A4K2M9.
 * Retries on the (extremely unlikely) unique-constraint collision.
 */
export async function generateOrderNumber(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const suffix = randomBytes(4).toString("hex").toUpperCase();
    const number = `CB-${yy}${mm}${dd}-${suffix}`;
    const existing = await prisma.order.findUnique({
      where: { orderNumber: number },
      select: { id: true },
    });
    if (!existing) return number;
  }
  throw new Error("Could not generate a unique order number. Please try again.");
}
