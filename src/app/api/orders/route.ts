import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { customerInfoSchema, validatePhotoFile } from "@/lib/validation";
import { generateOrderNumber } from "@/lib/order-number";
import { ensureDir, orderDir, writeFile } from "@/lib/storage";
import { extForMime, readImageInfo } from "@/lib/images";

/**
 * Guest order submission (no account required).
 * Multipart form: productId, customerName, address, phone, story,
 * photo1, photo2 (JPG/PNG/WebP files).
 */
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "We couldn't submit your order. Please check your information and try again." },
      { status: 400 }
    );
  }

  const productId = String(form.get("productId") ?? "").trim();
  const product = await prisma.product.findFirst({
    where: { id: productId, active: true },
  });
  if (!product) {
    return NextResponse.json(
      { error: "This book configuration is no longer available. Please refresh the page and try again." },
      { status: 400 }
    );
  }

  const info = customerInfoSchema.safeParse({
    customerName: form.get("customerName"),
    address: form.get("address"),
    phone: form.get("phone"),
    story: form.get("story") ?? "",
  });
  if (!info.success) {
    return NextResponse.json(
      { error: info.error.issues[0]?.message ?? "Please check your information and try again." },
      { status: 400 }
    );
  }

  const photo1 = form.get("photo1");
  const photo2 = form.get("photo2");
  if (!(photo1 instanceof File) || !(photo2 instanceof File)) {
    return NextResponse.json(
      { error: "Please upload both children's photos." },
      { status: 400 }
    );
  }

  const p1 = { name: photo1.name, mime: photo1.type, size: photo1.size, buffer: Buffer.from(await photo1.arrayBuffer()) };
  const p2 = { name: photo2.name, mime: photo2.type, size: photo2.size, buffer: Buffer.from(await photo2.arrayBuffer()) };
  const e1 = validatePhotoFile(p1);
  if (e1) return NextResponse.json({ error: `Child Photo 1: ${e1}` }, { status: 400 });
  const e2 = validatePhotoFile(p2);
  if (e2) return NextResponse.json({ error: `Child Photo 2: ${e2}` }, { status: 400 });

  // Reject non-image payloads regardless of declared MIME type.
  try {
    await readImageInfo(p1.buffer);
    await readImageInfo(p2.buffer);
  } catch {
    return NextResponse.json(
      { error: "One of the photos couldn't be read as an image. Please upload a valid JPG, PNG, or WebP file." },
      { status: 400 }
    );
  }

  const orderNumber = await generateOrderNumber();
  const dir = orderDir(orderNumber);
  ensureDir(dir);

  const photoPath1 = `orders/${orderNumber}/photo1.${extForMime(p1.mime || "image/jpeg")}`;
  const photoPath2 = `orders/${orderNumber}/photo2.${extForMime(p2.mime || "image/jpeg")}`;
  writeFile(path.join(dir, path.basename(photoPath1)), p1.buffer);
  writeFile(path.join(dir, path.basename(photoPath2)), p2.buffer);

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerName: info.data.customerName,
      address: info.data.address,
      phone: info.data.phone,
      story: info.data.story,
      childPhoto1: photoPath1,
      childPhoto2: photoPath2,
      pageCount: product.pageCount,
      aspectRatio: product.aspectRatio,
      price: product.price,
      currency: product.currency,
      status: "NEW",
      productId: product.id,
    },
    select: { orderNumber: true },
  });

  try {
    fs.statSync(dir);
  } catch {
    // Orders created but files missing would be a real problem — roll back.
    await prisma.order.delete({ where: { orderNumber: order.orderNumber } });
    return NextResponse.json(
      { error: "We couldn't save your photos. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ orderNumber: order.orderNumber }, { status: 201 });
}
