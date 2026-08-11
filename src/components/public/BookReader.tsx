"use client";

import { Children, cloneElement, isValidElement, useState } from "react";
import { Flipbook, type FlipPage } from "./Flipbook";

/**
 * Opens the interactive reader as a full-screen overlay.
 * The trigger is supplied by the caller (e.g. the "Read Book" button).
 */
export function BookReader({
  pages,
  title,
  cover,
  trigger,
}: {
  pages: FlipPage[];
  title: string;
  cover?: string;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);

  const triggerWithClick = isValidElement(trigger)
    ? cloneElement(trigger, {
        onClick: () => setOpen(true),
      } as Record<string, unknown>)
    : trigger;

  return (
    <>
      {Children.only(triggerWithClick)}
      {open && (
        <Flipbook
          pages={pages}
          title={title}
          cover={cover}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
