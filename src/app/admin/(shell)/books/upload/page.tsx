import type { Metadata } from "next";
import UploadWizard from "@/components/admin/UploadWizard";

export const metadata: Metadata = {
  title: "Upload New Book",
  robots: { index: false },
};

export default function UploadBookPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Upload New Book</h1>
        <p className="mt-0.5 text-sm text-ink-soft">
          Drop in a PDF or a set of JPG pages — the ebook is built for you
          automatically.
        </p>
      </div>
      <UploadWizard />
    </div>
  );
}
