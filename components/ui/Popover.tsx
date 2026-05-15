"use client";

import { useEffect, useLayoutEffect, useRef, RefObject } from "react";
import { createPortal } from "react-dom";

interface PopoverProps {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  placement?: "bottom-start" | "bottom-end";
  children: React.ReactNode;
}

export function Popover({ anchorRef, open, onClose, placement = "bottom-start", children }: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current || !popoverRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const el = popoverRef.current;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    el.style.top = `${rect.bottom + scrollY + 4}px`;
    if (placement === "bottom-end") {
      el.style.left = `${rect.right + scrollX - el.offsetWidth}px`;
    } else {
      el.style.left = `${rect.left + scrollX}px`;
    }
  });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handler, true);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler, true);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [open, onClose, anchorRef]);

  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={{ position: "absolute", zIndex: 9999 }}
      className="min-w-[160px] bg-slate-900 border border-white/10 rounded-md shadow-xl py-1"
    >
      {children}
    </div>,
    document.body
  );
}
