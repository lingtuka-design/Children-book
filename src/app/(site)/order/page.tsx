import type { Metadata } from "next";
import { OrderForm } from "@/components/public/OrderForm";

export const metadata: Metadata = {
  title: "Order a Custom Children's Book",
  description:
    "Order a personalized 24-page children's book with your child's face, a 4:3 layout, and your own story — Rs. 1,500. No account required.",
};

export default function OrderPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Order Your Custom Book
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          A fully personalized children&apos;s book starring your child.
          Upload two photos, describe the story you have in mind, and we&apos;ll
          bring it to life.
        </p>
      </div>

      <div className="mt-10">
        <OrderForm />
      </div>
    </div>
  );
}
