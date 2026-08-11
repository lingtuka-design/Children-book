import { z } from "zod";
import {
  MAX_PHOTO_BYTES,
  ALLOWED_PHOTO_MIMES,
  MAX_STORY_CHARS,
  ORDER_STATUSES,
} from "./site";

const phonePattern = /^[+]?[0-9][0-9\s\-()]{7,17}$/;

export const customerInfoSchema = z.object({
  customerName: z
    .string({ message: "Please enter your name." })
    .trim()
    .min(2, "Please enter your full name.")
    .max(120, "Name is too long."),
  address: z
    .string({ message: "Please enter your delivery address." })
    .trim()
    .min(5, "Please enter a complete address.")
    .max(1000, "Address is too long."),
  phone: z
    .string({ message: "Please enter your phone number." })
    .trim()
    .min(7, "Please enter a valid phone number.")
    .max(20, "Phone number is too long.")
    .regex(phonePattern, "Please enter a valid phone number."),
  story: z
    .string()
    .trim()
    .max(MAX_STORY_CHARS, `Story must be ${MAX_STORY_CHARS} characters or fewer.`),
});

export type CustomerInfo = z.infer<typeof customerInfoSchema>;

export function validatePhotoFile(file: { name: string; mime?: string; size: number; buffer: Buffer }) {
  const mime = file.mime || "";
  const looksLikeImage =
    ALLOWED_PHOTO_MIMES.includes(mime) ||
    /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!looksLikeImage) {
    return "Please upload a JPG, PNG, or WebP image.";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "That photo is too large. Please upload an image smaller than 10 MB.";
  }
  if (file.size === 0) {
    return "That photo appears to be empty. Please choose another image.";
  }
  return null;
}

export const orderStatusSchema = z.enum(ORDER_STATUSES);

export const bookMetadataSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200, "Title is too long."),
  description: z.string().trim().max(3000, "Description is too long.").optional().nullable(),
  author: z.string().trim().max(120).optional().nullable(),
  illustrator: z.string().trim().max(120).optional().nullable(),
  year: z.string().trim().max(20).optional().nullable(),
  tags: z.string().trim().max(300).optional().nullable(),
});
