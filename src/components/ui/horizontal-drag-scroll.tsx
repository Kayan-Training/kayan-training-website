"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export function HorizontalDragScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const dragState = useRef({
    isDown: false,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
  });

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    dragState.current.isDown = true;
    dragState.current.startX = e.pageX;
    dragState.current.startScrollLeft = el.scrollLeft;
    dragState.current.moved = false;
    setDragging(true);
  }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || !dragState.current.isDown) return;
    const dx = e.pageX - dragState.current.startX;
    if (Math.abs(dx) > 4) {
      dragState.current.moved = true;
    }
    el.scrollLeft = dragState.current.startScrollLeft - dx;
  }

  function endDrag() {
    dragState.current.isDown = false;
    setDragging(false);
  }

  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (!dragState.current.moved) return;
    e.preventDefault();
    e.stopPropagation();
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const updateEdges = () => {
      const max = el.scrollWidth - el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(max - el.scrollLeft > 4);
    };

    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);

    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [children]);

  return (
    <div className="relative">
      <div
        ref={ref}
        className={cn(
          "no-scrollbar touch-pan-x select-none overflow-x-auto",
          dragging ? "cursor-grabbing" : "cursor-grab",
          className,
        )}
        onClickCapture={onClickCapture}
        onMouseDown={onMouseDown}
        onMouseLeave={endDrag}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
      >
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-surface-container-lowest to-transparent transition-opacity duration-200",
          canScrollLeft ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-surface-container-lowest to-transparent transition-opacity duration-200",
          canScrollRight ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
