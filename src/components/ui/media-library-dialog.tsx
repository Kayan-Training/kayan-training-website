"use client";

import { ChevronLeft, ChevronRight, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type MediaLibraryItem = {
  id: string;
  originalName: string;
  url: string;
  mimeType: string;
};

type MediaKind = "image" | "video";

export function MediaLibraryDialog({
  open,
  onOpenChange,
  title = "Media Library",
  items,
  loading = false,
  emptyText = "No media uploaded yet.",
  multiple = false,
  acceptedKinds = ["image", "video"],
  initialSelectedIds = [],
  perPage = 20,
  page,
  totalPages,
  onPageChange,
  pageLoading = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  items: MediaLibraryItem[];
  loading?: boolean;
  emptyText?: string;
  multiple?: boolean;
  acceptedKinds?: MediaKind[];
  initialSelectedIds?: string[];
  perPage?: number;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  pageLoading?: boolean;
  onConfirm: (selectedItems: MediaLibraryItem[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [localPage, setLocalPage] = useState(1);
  const [didInitSelection, setDidInitSelection] = useState(false);
  const acceptedKindsKey = useMemo(
    () => [...acceptedKinds].sort().join("|"),
    [acceptedKinds],
  );

  const selectableItems = useMemo(
    () =>
      items.filter((item) => {
        const kind: MediaKind = item.mimeType.startsWith("video/")
          ? "video"
          : "image";
        return acceptedKinds.includes(kind);
      }),
    [acceptedKindsKey, items],
  );

  const usesServerPagination = typeof onPageChange === "function";
  const computedTotalPages = Math.max(
    1,
    usesServerPagination
      ? (totalPages ?? 1)
      : Math.ceil(selectableItems.length / perPage),
  );
  const currentPage = Math.min(
    usesServerPagination ? (page ?? 1) : localPage,
    computedTotalPages,
  );
  const start = (currentPage - 1) * perPage;
  const pageItems = usesServerPagination
    ? selectableItems
    : selectableItems.slice(start, start + perPage);

  useEffect(() => {
    if (!open || didInitSelection) return;
    const validIds = new Set(selectableItems.map((item) => item.id));
    const nextSelected = initialSelectedIds.filter((id) => validIds.has(id));
    setSelectedIds((prev) => {
      if (
        prev.length === nextSelected.length &&
        prev.every((id, idx) => id === nextSelected[idx])
      ) {
        return prev;
      }
      return nextSelected;
    });
    setDidInitSelection(true);
    if (!usesServerPagination) {
      setLocalPage((prev) => (prev === 1 ? prev : 1));
    }
  }, [
    didInitSelection,
    initialSelectedIds,
    open,
    selectableItems,
    usesServerPagination,
  ]);

  useEffect(() => {
    if (open) return;
    setDidInitSelection(false);
    setSelectedIds([]);
  }, [open]);

  function toggleSelection(itemId: string) {
    setSelectedIds((prev) => {
      if (multiple) {
        return prev.includes(itemId)
          ? prev.filter((id) => id !== itemId)
          : [...prev, itemId];
      }
      return prev.includes(itemId) ? [] : [itemId];
    });
  }

  function confirmSelection() {
    const selectedSet = new Set(selectedIds);
    const selected = selectableItems.filter((item) => selectedSet.has(item.id));
    onConfirm(selected);
    onOpenChange(false);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {loading || pageLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Loading media…
          </p>
        ) : selectableItems.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {emptyText}
          </p>
        ) : (
          <div className="grid max-h-[65vh] grid-cols-2 gap-3 overflow-y-auto pe-1 sm:grid-cols-3 lg:grid-cols-4">
            {pageItems.map((item) => {
              const isVideo = item.mimeType.startsWith("video/");
              const selected = selectedIds.includes(item.id);
              return (
                <button
                  className={cn(
                    "group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted transition-colors",
                    selected
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border/50 hover:border-primary",
                  )}
                  key={item.id}
                  type="button"
                  onClick={() => toggleSelection(item.id)}
                >
                  {isVideo ? (
                    <video
                      className="h-full w-full object-cover"
                      muted
                      preload="metadata"
                      src={item.url}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={item.originalName}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      decoding="async"
                      loading="lazy"
                      src={item.url}
                    />
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {isVideo ? "video" : "image"}
                  </span>
                  {selected ? (
                    <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                      Selected
                    </span>
                  ) : null}
                  {isVideo ? (
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/60 p-1 text-white">
                      <Video className="size-3" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter className="mt-2 flex items-center justify-between gap-2 border-t pt-3 sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {selectedIds.length} selected
          </div>
          <div className="flex items-center gap-2">
            <Button
              disabled={currentPage <= 1}
              size="sm"
              type="button"
              variant="outline"
              onClick={() =>
                usesServerPagination
                  ? onPageChange?.(Math.max(1, currentPage - 1))
                  : setLocalPage((p) => Math.max(1, p - 1))
              }
            >
              <ChevronLeft className="size-3.5" />
              Prev
            </Button>
            <span className="min-w-20 text-center text-xs text-muted-foreground">
              Page {currentPage} / {computedTotalPages}
            </span>
            <Button
              disabled={currentPage >= computedTotalPages}
              size="sm"
              type="button"
              variant="outline"
              onClick={() =>
                usesServerPagination
                  ? onPageChange?.(Math.min(computedTotalPages, currentPage + 1))
                  : setLocalPage((p) => Math.min(computedTotalPages, p + 1))
              }
            >
              Next
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              disabled={selectedIds.length === 0}
              size="sm"
              type="button"
              onClick={confirmSelection}
            >
              {pageLoading ? "Loading…" : "Insert Selected"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
