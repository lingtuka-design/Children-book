"use client";

import { useRef, useState } from "react";
import { ImagePlus, RefreshCw, X } from "lucide-react";

export interface PhotoFile {
  file: File;
  previewUrl: string;
}

/**
 * Single photo upload with live preview, replace, and remove.
 * Accepts JPG/PNG/WebP up to 10 MB (validated again server-side).
 */
export function PhotoUploader({
  label,
  required,
  value,
  onChange,
  error,
}: {
  label: string;
  required?: boolean;
  value: PhotoFile | null;
  onChange: (p: PhotoFile | null) => void;
  error?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const pick = (file: File | undefined | null) => {
    setLocalError(null);
    if (!file) return;
    if (!/\.(jpe?g|png|webp)$/i.test(file.name) && !file.type.startsWith("image/")) {
      setLocalError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setLocalError("That photo is larger than 10 MB. Please choose a smaller image.");
      return;
    }
    onChange({ file, previewUrl: URL.createObjectURL(file) });
  };

  return (
    <div>
      <p className="text-sm font-bold text-ink">
        {label}
        {required && <span className="text-coral-deep"> *</span>}
      </p>

      {value ? (
        <div className="mt-2.5 overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-card">
          <div className="relative aspect-[4/3] bg-cream-deep">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.previewUrl}
              alt={`${label} preview`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => {
                onChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-white"
              aria-label={`Remove ${label}`}
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-1.5 border-t border-ink/10 px-4 py-2.5 text-xs font-bold text-ink-soft transition-colors hover:bg-cream hover:text-ink focus-visible:outline-2 focus-visible:outline-coral"
          >
            <RefreshCw size={13} strokeWidth={2.4} aria-hidden />
            Replace photo
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`mt-2.5 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-9 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral ${
            error || localError
              ? "border-coral bg-coral-soft/50"
              : "border-ink/15 bg-paper/70 hover:border-coral hover:bg-coral-soft/40"
          }`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-coral-soft text-coral-deep">
            <ImagePlus size={20} strokeWidth={2.2} aria-hidden />
          </span>
          <span className="text-sm font-bold text-ink">
            {required ? "Choose a photo" : "Choose a photo (optional)"}
          </span>
          <span className="text-xs text-ink-faint">
            JPG, PNG or WebP · up to 10 MB
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        aria-hidden
        onChange={(e) => pick(e.target.files?.[0])}
      />

      {(error || localError) && (
        <p role="alert" className="mt-1.5 text-xs font-semibold text-coral-deep">
          {error ?? localError}
        </p>
      )}
    </div>
  );
}
