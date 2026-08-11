"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Loader2,
  Lock,
  MapPin,
  Phone,
  Sparkles,
  User,
} from "lucide-react";
import { formatPrice } from "@/lib/site";
import { PhotoUploader, type PhotoFile } from "./PhotoUploader";

interface Product {
  id: string;
  name: string;
  pageCount: number;
  aspectRatio: string;
  price: number;
  currency: string;
}

const DEFAULT_PRODUCT = {
  id: "",
  name: "Custom Children's Book",
  pageCount: 24,
  aspectRatio: "4:3",
  price: 1500,
  currency: "Rs.",
};

export function OrderForm() {
  const router = useRouter();
  const [product, setProduct] = useState<Product>(DEFAULT_PRODUCT);
  const [productReady, setProductReady] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [story, setStory] = useState("");
  const [photo1, setPhoto1] = useState<PhotoFile | null>(null);
  const [photo2, setPhoto2] = useState<PhotoFile | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/product")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.product) setProduct(data.product);
      })
      .finally(() => setProductReady(true));
  }, []);

  const storyRemaining = 500 - story.length;

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Please enter your name.";
    if (address.trim().length < 5) e.address = "Please enter your delivery address.";
    const digits = phone.replace(/[^\d]/g, "");
    if (digits.length < 7 || digits.length > 15) {
      e.phone = "Please enter a valid phone number.";
    }
    if (!photo1) e.photo1 = "Please upload the first photo.";
    if (!photo2) e.photo2 = "Please upload the second photo.";
    if (story.length > 500) e.story = "Please keep the story within 500 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    if (!product.id) {
      setSubmitError("The book configuration isn't available right now. Please refresh and try again.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("productId", product.id);
      fd.append("customerName", name);
      fd.append("address", address);
      fd.append("phone", phone);
      fd.append("story", story);
      fd.append("photo1", photo1!.file);
      fd.append("photo2", photo2!.file);

      const res = await fetch("/api/orders", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSubmitError(
          data?.error ??
            "We couldn't submit your order. Please check your information and try again."
        );
        return;
      }
      router.push(`/order/success?ref=${encodeURIComponent(data.orderNumber)}`);
    } catch {
      setSubmitError(
        "We couldn't submit your order. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (field: string) =>
    `w-full rounded-xl border bg-paper px-4 py-3 text-[15px] text-ink shadow-sm transition-colors placeholder:text-ink-faint focus:outline-none focus:ring-2 ${
      errors[field]
        ? "border-coral ring-coral/30"
        : "border-ink/15 focus:border-teal focus:ring-teal/25"
    }`;

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <div className="space-y-10">
        {/* Product summary */}
        <section aria-label="Product">
          <div className="rounded-3xl bg-gradient-to-br from-teal-soft to-sun-soft p-6 shadow-card">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-teal-deep shadow-soft">
                <BookOpen size={22} strokeWidth={2.2} aria-hidden />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">
                  {productReady ? product.name : DEFAULT_PRODUCT.name}
                </h2>
                <p className="text-sm font-semibold text-ink-soft">
                  {productReady ? product.pageCount : 24} pages ·{" "}
                  {productReady ? product.aspectRatio : "4:3"} ·{" "}
                  {formatPrice(
                    productReady ? product.price : 1500,
                    productReady ? product.currency : "Rs."
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Customer information */}
        <section aria-labelledby="details-heading">
          <h2 id="details-heading" className="font-display text-lg font-semibold text-ink">
            Your details
          </h2>
          <div className="mt-4 space-y-5">
            <div>
              <label htmlFor="name" className="flex items-center gap-1.5 text-sm font-bold text-ink">
                <User size={14} strokeWidth={2.4} aria-hidden />
                Name <span className="text-coral-deep">*</span>
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                className={`mt-2 ${inputCls("name")}`}
              />
              {errors.name && (
                <p id="name-error" role="alert" className="mt-1.5 text-xs font-semibold text-coral-deep">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="flex items-center gap-1.5 text-sm font-bold text-ink">
                <MapPin size={14} strokeWidth={2.4} aria-hidden />
                Delivery address <span className="text-coral-deep">*</span>
              </label>
              <textarea
                id="address"
                rows={3}
                autoComplete="street-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House, street, city, postal code…"
                aria-invalid={Boolean(errors.address)}
                aria-describedby={errors.address ? "address-error" : undefined}
                className={`mt-2 ${inputCls("address")}`}
              />
              {errors.address && (
                <p id="address-error" role="alert" className="mt-1.5 text-xs font-semibold text-coral-deep">
                  {errors.address}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="flex items-center gap-1.5 text-sm font-bold text-ink">
                <Phone size={14} strokeWidth={2.4} aria-hidden />
                Phone number <span className="text-coral-deep">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0300 1234567"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                className={`mt-2 ${inputCls("phone")}`}
              />
              {errors.phone && (
                <p id="phone-error" role="alert" className="mt-1.5 text-xs font-semibold text-coral-deep">
                  {errors.phone}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Children's photos */}
        <section aria-labelledby="photos-heading">
          <h2 id="photos-heading" className="font-display text-lg font-semibold text-ink">
            Children&apos;s photos
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            These photographs will be used to personalize your child&apos;s
            book, so the story&apos;s hero looks just like your little one.
          </p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <PhotoUploader
              label="Child Photo 1"
              required
              value={photo1}
              onChange={setPhoto1}
              error={errors.photo1}
            />
            <PhotoUploader
              label="Child Photo 2"
              required
              value={photo2}
              onChange={setPhoto2}
              error={errors.photo2}
            />
          </div>
        </section>

        {/* Story */}
        <section aria-labelledby="story-heading">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="story-heading" className="font-display text-lg font-semibold text-ink">
              Tell us your story
            </h2>
            <span
              className={`text-xs font-bold tabular-nums ${
                storyRemaining < 0 ? "text-coral-deep" : "text-ink-faint"
              }`}
              aria-live="polite"
            >
              {story.length} / 500
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            What kind of adventure should your child go on? You can share
            favourite animals, hobbies, friends, or anything special to your family.
          </p>
          <textarea
            id="story"
            rows={6}
            maxLength={501}
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Describe the story you would like us to create for your child..."
            aria-invalid={Boolean(errors.story)}
            aria-describedby={errors.story ? "story-error" : undefined}
            className={`mt-3 ${inputCls("story")}`}
          />
          {errors.story && (
            <p id="story-error" role="alert" className="mt-1.5 text-xs font-semibold text-coral-deep">
              {errors.story}
            </p>
          )}
        </section>
      </div>

      {/* Order summary */}
      <aside aria-label="Order summary" className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl border border-ink/5 bg-paper p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold text-ink">
            Your Custom Book
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-ink-soft">
            <li className="flex items-center justify-between gap-3">
              <span>Personalized children&apos;s book</span>
              <CheckCircle2 size={16} className="shrink-0 text-teal" aria-hidden />
            </li>
            <li className="flex items-center justify-between">
              <span>Pages</span>
              <span className="font-bold text-ink">{productReady ? product.pageCount : 24}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Aspect ratio</span>
              <span className="font-bold text-ink">{productReady ? product.aspectRatio : "4:3"}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Children&apos;s photos</span>
              <span className="font-bold text-ink">2</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Story</span>
              <span className="font-bold text-ink">{story.trim() ? "Included" : "To be added"}</span>
            </li>
          </ul>

          <div className="mt-5 border-t border-dashed border-ink/15 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-ink">Price</span>
              <span className="font-display text-3xl font-semibold text-ink">
                {formatPrice(
                  productReady ? product.price : 1500,
                  productReady ? product.currency : "Rs."
                )}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-coral px-6 py-3.5 text-base font-bold text-white shadow-lift transition-all hover:-translate-y-0.5 hover:bg-coral-deep focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral disabled:pointer-events-none disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden />
                Placing order…
              </>
            ) : (
              <>
                <Sparkles size={17} strokeWidth={2.4} aria-hidden />
                Place Order
              </>
            )}
          </button>

          {submitError && (
            <p role="alert" className="mt-4 rounded-xl bg-coral-soft px-4 py-3 text-xs font-semibold leading-relaxed text-coral-deep">
              {submitError}
            </p>
          )}

          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-faint">
            <Lock size={13} className="mt-0.5 shrink-0" aria-hidden />
            No account needed. Your photos and details are only used to create
            your book and are never shared.
          </p>
        </div>
      </aside>
    </form>
  );
}
