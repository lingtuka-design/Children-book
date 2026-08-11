"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  X,
} from "lucide-react";

export interface FlipPage {
  src: string;
  thumb?: string;
}

interface BookDims {
  pageW: number;
  pageH: number;
  bookW: number;
  gap: number;
}

const SPINE_GAP = 6;

/**
 * Interactive page-flipping reader.
 *
 * Desktop: two-page spread with a realistic page-turn (3D rotateY around the
 * spine) and a cover-closed opening view. Mobile: single-page mode with the
 * same flip animation. Supports keyboard, touch swipe, fullscreen, and
 * progressive page loading (thumbnails first, full pages behind).
 */
export function Flipbook({
  pages,
  title,
  cover,
  onClose,
}: {
  pages: FlipPage[];
  title: string;
  /** Front cover shown on the closed-book opening view (falls back to page 1). */
  cover?: string;
  onClose?: () => void;
}) {
  const n = pages.length;
  const [mode, setMode] = useState<"spread" | "single">("spread");
  const [view, setView] = useState(-1); // spread mode: -1 = cover-closed, k = spread k; single: page index
  const [flipping, setFlipping] = useState<null | "next" | "prev">(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [aspect, setAspect] = useState(0.75);
  const [dims, setDims] = useState<BookDims>({ pageW: 300, pageH: 400, bookW: 606, gap: SPINE_GAP });

  const wrapRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flippingRef = useRef<null | "next" | "prev">(null);

  const cancelFlip = useCallback(() => {
    if (commitTimer.current) {
      clearTimeout(commitTimer.current);
      commitTimer.current = null;
    }
    flippingRef.current = null;
    setFlipping(null);
  }, []);

  // Clear any pending flip timer on unmount.
  useEffect(() => {
    return () => {
      if (commitTimer.current) clearTimeout(commitTimer.current);
    };
  }, []);

  // Detect mode from viewport.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = (spread: boolean) => {
      setMode(spread ? "spread" : "single");
      setView(spread ? -1 : 0);
      cancelFlip();
    };
    apply(mq.matches);
    const onChange = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [cancelFlip]);

  // Measure available space.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const rect = wrap.getBoundingClientRect();
      const pad = mode === "spread" ? 48 : 32;
      const availW = Math.max(200, rect.width - pad);
      const availH = Math.max(200, rect.height - pad);
      if (mode === "spread") {
        let pageW = (availW - SPINE_GAP) / 2;
        let pageH = pageW / aspect;
        if (pageH > availH) {
          pageH = availH;
          pageW = pageH * aspect;
        }
        setDims({ pageW, pageH, bookW: pageW * 2 + SPINE_GAP, gap: SPINE_GAP });
      } else {
        let pageH = availH;
        let pageW = pageH * aspect;
        if (pageW > availW) {
          pageW = availW;
          pageH = pageW / aspect;
        }
        setDims({ pageW, pageH, bookW: pageW, gap: 0 });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [aspect, mode]);

  // Learn the real aspect ratio from the first page.
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setAspect(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = pages[0]?.src ?? "";
  }, [pages]);

  // Body scroll lock while the reader is open.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const preload = useCallback((indexes: number[]) => {
    for (const i of indexes) {
      if (i < 0 || i >= n) continue;
      const img = new Image();
      img.src = pages[i].src;
      if (pages[i].thumb) {
        const t = new Image();
        t.src = pages[i].thumb;
      }
    }
  }, [pages, n]);

  // Preload neighbors whenever the view changes.
  useEffect(() => {
    if (cover) {
      const img = new Image();
      img.src = cover;
    }
    if (mode === "single") {
      preload([view - 1, view, view + 1]);
    } else {
      const left = view === -1 ? -1 : 2 * view + 1;
      const right = view === -1 ? 0 : 2 * view + 2;
      preload([left - 2, left - 1, left, right, right + 1, right + 2, right + 3]);
    }
  }, [view, mode, preload, cover]);

  const commit = useCallback(() => {
    if (commitTimer.current) {
      clearTimeout(commitTimer.current);
      commitTimer.current = null;
    }
    if (!flippingRef.current) return;
    const dir = flippingRef.current;
    flippingRef.current = null;
    setFlipping(null);
    setView((v) => v + (dir === "next" ? 1 : -1));
  }, []);

  const startFlip = useCallback(
    (dir: "next" | "prev") => {
      if (flippingRef.current || commitTimer.current) return;
      const atEnd =
        mode === "single"
          ? dir === "next"
            ? view >= n - 1
            : view <= 0
          : dir === "next"
            ? view >= Math.ceil((n - 1) / 2) - 1
            : view <= -1;
      if (atEnd) return;

      // Preload the pages the flip will reveal.
      if (mode === "single") {
        preload(dir === "next" ? [view + 1] : [view - 1]);
      } else {
        preload(
          dir === "next"
            ? [2 * (view + 1) + 1, 2 * (view + 1) + 2]
            : [2 * (view - 1) + 1, 2 * (view - 1) + 2, view === -1 ? 0 : -1]
        );
      }

      flippingRef.current = dir;
      setFlipping(dir);
      commitTimer.current = setTimeout(commit, 950);
    },
    [view, n, mode, preload, commit]
  );

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (e.propertyName === "transform" && flipping) {
      commit();
    }
  };

  const toggleFullscreen = useCallback(() => {
    const el = wrapRef.current?.closest("[data-reader-root]") as HTMLElement | null;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
          e.preventDefault();
          startFlip("next");
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          startFlip("prev");
          break;
        case "Home":
          e.preventDefault();
          cancelFlip();
          setView(mode === "single" ? 0 : -1);
          break;
        case "End":
          e.preventDefault();
          cancelFlip();
          setView(mode === "single" ? n - 1 : Math.ceil((n - 1) / 2) - 1);
          break;
        case "Escape":
          onClose?.();
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [startFlip, mode, n, onClose, toggleFullscreen, cancelFlip]);

  // Touch swipe.
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) startFlip("next");
      else startFlip("prev");
    }
  };

  // -------------------------------------------------------------------------
  // Derived page indexes for the current view
  // -------------------------------------------------------------------------
  const spreadTotal = Math.max(1, Math.ceil((n - 1) / 2)); // number of spread views (0-based: -1..S-1)
  const atFirst =
    mode === "single" ? view <= 0 : view <= -1;
  const atLast =
    mode === "single"
      ? view >= n - 1
      : view >= spreadTotal - 1;

  const leftIndex = (v: number) =>
    mode === "single" ? -1 : v === -1 ? -1 : 2 * v + 1;
  const rightIndex = (v: number) =>
    mode === "single" ? -1 : v === -1 ? 0 : 2 * v + 2;

  // The closed-book view shows the front cover (uploaded cover, else page 1).
  const coverPage: FlipPage | null = cover ? { src: cover } : pages[0] ?? null;
  const closedRight = (v: number) => (v === -1 ? coverPage : pages[rightIndex(v)] ?? null);

  const baseLeft = mode === "single" ? view : leftIndex(view);
  const baseRight = mode === "single" ? null : closedRight(view);

  // During a flip, the sheet and underlays show the *target* state.
  const targetView = flipping ? view + (flipping === "next" ? 1 : -1) : view;
  const sheetSide = mode === "single" ? "whole" : flipping === "prev" ? "left" : "right";

  const sheetFront =
    mode === "single"
      ? pages[view]
      : sheetSide === "right"
        ? closedRight(view)
        : pages[leftIndex(view)] ?? null;
  const sheetBack =
    mode === "single"
      ? null
      : flipping === "next"
        ? pages[leftIndex(view + 1)] ?? null
        : closedRight(view - 1);
  const underlayRight =
    mode === "single"
      ? pages[view + 1] ?? null
      : pages[rightIndex(view + 1)] ?? null;
  const underlayLeft =
    mode === "single"
      ? pages[view - 1] ?? null
      : pages[leftIndex(view - 1)] ?? null;

  const sheetAngle =
    flipping === "next" ? -180 : flipping === "prev" ? 180 : 0;
  const sheetOrigin =
    mode === "single"
      ? flipping === "prev"
        ? "right"
        : "left"
      : sheetSide === "left"
        ? "right"
        : "left";

  const indicator = mode === "single"
    ? `Page ${view + 1} of ${n}`
    : view === -1
      ? "Cover"
      : `Pages ${2 * view + 1}–${Math.min(2 * view + 2, n)} of ${n}`;

  const canGoPrev = flipping === null && !atFirst;
  const canGoNext = flipping === null && !atLast;

  const jumpStart = () => {
    cancelFlip();
    setView(mode === "single" ? 0 : -1);
  };
  const jumpEnd = () => {
    cancelFlip();
    setView(mode === "single" ? n - 1 : spreadTotal - 1);
  };

  const halfStyle = { width: dims.pageW, height: dims.pageH };
  const spineLeft = dims.pageW;

  return (
    <div
      data-reader-root
      role="dialog"
      aria-modal="true"
      aria-label={`Reading: ${title}`}
      className="fixed inset-0 z-50 flex flex-col bg-[#2b2536]"
    >
      {/* Top bar */}
      <div className="flex h-14 shrink-0 items-center justify-between px-4 text-white/90">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
            aria-label="Close reader"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
          <p className="truncate font-display text-sm font-semibold sm:text-base">
            {title}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
          aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {fullscreen ? <Minimize size={17} strokeWidth={2.2} /> : <Maximize size={17} strokeWidth={2.2} />}
        </button>
      </div>

      {/* Book area */}
      <div
        ref={wrapRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden px-2 py-2"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="paper-texture absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 60% at 50% 45%, rgb(255 255 255 / 0.55), transparent 70%), radial-gradient(ellipse 60% 50% at 50% 100%, rgb(45 42 61 / 0.35), transparent 75%)",
          }}
        />

        <div
          className="perspective-2000 relative"
          style={{ width: dims.bookW, height: dims.pageH }}
        >
          <div className="relative h-full w-full" ref={bookRef}>
            {/* Base layer — current view */}
            {mode === "single" ? (
              <div className="absolute inset-0" style={halfStyle}>
                {baseLeft >= 0 ? (
                  <PageImg page={pages[baseLeft]} alt={`Page ${baseLeft + 1}`} />
                ) : (
                  <div className="paper-texture h-full w-full rounded-md" />
                )}
              </div>
            ) : (
              <>
                <div className="absolute left-0 top-0" style={halfStyle}>
                  {baseLeft >= 0 ? (
                    <PageImg page={pages[baseLeft]} alt={`Page ${baseLeft + 1}`} />
                  ) : (
                    <div className="paper-texture h-full w-full rounded-l-md" />
                  )}
                </div>
                <div className="absolute right-0 top-0" style={halfStyle}>
                  {baseRight ? (
                    <PageImg page={baseRight} alt="Cover" />
                  ) : (
                    <div className="paper-texture h-full w-full rounded-r-md" />
                  )}
                </div>
              </>
            )}

            {/* Underlays revealed during a flip */}
            <div
              className="absolute left-0 top-0"
              style={{ ...halfStyle, visibility: flipping === "prev" ? "visible" : "hidden" }}
            >
              {underlayLeft ? (
                <PageImg page={underlayLeft} alt={`Page ${targetView >= 0 ? 2 * targetView + 1 : 1}`} />
              ) : (
                <div className="paper-texture h-full w-full rounded-l-md" />
              )}
            </div>
            {mode === "spread" && (
              <div
                className="absolute right-0 top-0"
                style={{ ...halfStyle, visibility: flipping === "next" ? "visible" : "hidden" }}
              >
                {underlayRight ? (
                  <PageImg page={underlayRight} alt={`Page ${2 * targetView + 2}`} />
                ) : (
                  <div className="paper-texture h-full w-full rounded-r-md" />
                )}
              </div>
            )}

            {/* Spine shadow (spread mode) */}
            {mode === "spread" && (
              <div
                className="pointer-events-none absolute inset-y-0 z-10"
                style={{
                  left: spineLeft - 8,
                  width: 16,
                  background:
                    "linear-gradient(to right, rgb(45 42 61 / 0.22), transparent 70%)",
                }}
              />
            )}

            {/* Flip sheet */}
            <div
              ref={sheetRef}
              onTransitionEnd={handleTransitionEnd}
              className={`flip-sheet absolute top-0 z-20 ${flipping ? "flip-transition" : "no-transition"}`}
              style={{
                width: mode === "single" ? dims.bookW : dims.pageW,
                height: dims.pageH,
                left: mode === "single" ? 0 : sheetSide === "right" ? spineLeft : 0,
                transform: `rotateY(${sheetAngle}deg)`,
                transformOrigin: `${sheetOrigin} center`,
              }}
              aria-hidden={flipping ? undefined : true}
            >
              <div className="flip-face">
                {sheetFront ? (
                  <PageImg page={sheetFront} alt="" />
                ) : (
                  <div className="paper-texture h-full w-full" />
                )}
              </div>
              <div
                className="flip-face"
                style={{ transform: "rotateY(180deg)" }}
              >
                {sheetBack ? (
                  <PageImg page={sheetBack} alt="" />
                ) : (
                  <div className="paper-texture h-full w-full" />
                )}
              </div>
              {/* Moving shadow across the page while it turns */}
              <div
                className={`pointer-events-none absolute inset-0 ${
                  flipping === "next" ? "shadow-fwd" : flipping === "prev" ? "shadow-back" : ""
                }`}
                style={{
                  background: sheetSide === "left" || (mode === "single" && flipping === "prev")
                    ? "linear-gradient(to left, rgb(45 42 61 / 0.55), transparent 45%)"
                    : "linear-gradient(to right, rgb(45 42 61 / 0.55), transparent 45%)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Click edges */}
        {canGoPrev && (
          <button
            type="button"
            onClick={() => startFlip("prev")}
            aria-label="Previous page"
            className="absolute inset-y-0 left-0 z-30 hidden w-24 cursor-w-resize items-center justify-start pl-2 lg:flex"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/25 hover:text-white">
              <ChevronLeft size={22} strokeWidth={2.4} />
            </span>
          </button>
        )}
        {canGoNext && (
          <button
            type="button"
            onClick={() => startFlip("next")}
            aria-label="Next page"
            className="absolute inset-y-0 right-0 z-30 hidden w-24 cursor-e-resize items-center justify-end pr-2 lg:flex"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/25 hover:text-white">
              <ChevronRight size={22} strokeWidth={2.4} />
            </span>
          </button>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex h-16 shrink-0 items-center justify-center gap-2 px-4">
        <div className="flex items-center gap-1.5 rounded-full bg-white/10 p-1.5">
          <IconButton
            label="First page"
            disabled={!canGoPrev || view === (mode === "single" ? 0 : -1)}
            onClick={jumpStart}
          >
            <ChevronFirst size={18} strokeWidth={2.4} />
          </IconButton>
          <IconButton label="Previous page" disabled={!canGoPrev} onClick={() => startFlip("prev")}>
            <ChevronLeft size={18} strokeWidth={2.4} />
          </IconButton>
          <span className="min-w-28 select-none px-3 text-center text-xs font-bold text-white/85">
            {indicator}
          </span>
          <IconButton label="Next page" disabled={!canGoNext} onClick={() => startFlip("next")}>
            <ChevronRight size={18} strokeWidth={2.4} />
          </IconButton>
          <IconButton label="Last page" disabled={!canGoNext || view === (mode === "single" ? n - 1 : spreadTotal - 1)} onClick={jumpEnd}>
            <ChevronLast size={18} strokeWidth={2.4} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/** Progressive image: shows the thumbnail instantly, swaps in the full page once loaded. */
function PageImg({ page, alt }: { page: FlipPage; alt: string }) {
  const [full, setFull] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f5eedf]">
      {page.thumb && !full && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={page.thumb}
          alt=""
          className="h-full w-full object-cover opacity-70 blur-[2px]"
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={page.src}
        src={page.src}
        alt={alt}
        draggable={false}
        onLoad={() => setFull(true)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${full ? "opacity-100" : "opacity-0"}`}
      />
      {!full && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-ink/15 border-t-ink/60" aria-hidden />
        </div>
      )}
    </div>
  );
}
