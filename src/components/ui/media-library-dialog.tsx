"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Grid2x2,
  Image,
  ImageOff,
  LayoutGrid,
  LayoutList,
  List,
  Play,
  Search,
  Video,
  X,
} from "lucide-react"; // adjust to your icon set
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export type MediaLibraryItem = {
  id: string;
  originalName: string;
  url: string;
  mimeType: string;
};

type MediaKind = "image" | "video";
type FilterTab = "all" | "image" | "video" | "selected";
type ViewMode = "grid" | "list";
type SortOrder = "newest" | "oldest" | "name";

// ─── Lazy image ──────────────────────────────────────────────────────────────

/**
 * Renders a shimmer skeleton until the image enters the viewport,
 * then loads it via IntersectionObserver. This is the core perf fix:
 * images are never fetched until they're actually visible.
 */
function LazyImage({
  src,
  alt,
  className,
  skeletonClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        img.src = src;
        observer.unobserve(img);
      },
      { rootMargin: "100px" },
    );

    observer.observe(img);
    return () => observer.disconnect();
  }, [src]);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden",
        skeletonClassName,
      )}
    >
      {/* Shimmer skeleton — visible until image loads */}
      <div
        className={cn(
          "absolute inset-0 bg-muted transition-opacity duration-300",
          loaded ? "opacity-0 pointer-events-none" : "opacity-100",
        )}
      >
        <div className="h-full w-full animate-pulse bg-gradient-to-r from-muted via-muted/60 to-muted" />
      </div>
      {/* Image — src set by observer, fades in on load */}
      <img
        ref={imgRef}
        alt={alt}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </div>
  );
}

// ─── Grid item ───────────────────────────────────────────────────────────────

function GridItem({
  item,
  selected,
  onToggle,
}: {
  item: MediaLibraryItem;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const isVideo = item.mimeType.startsWith("video/");

  return (
    <button
      type="button"
      aria-label={`${item.originalName}${selected ? " — selected" : ""}`}
      aria-pressed={selected}
      onClick={() => onToggle(item.id)}
      className={cn(
        "group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted",
        "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border/50 hover:border-border",
      )}
    >
      <LazyImage src={item.url} alt={item.originalName} />

      {/* Hover overlay */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-between p-2 transition-opacity duration-150",
          "bg-black/0 group-hover:bg-black/10",
          selected && "bg-black/10",
        )}
      >
        {/* Checkbox — top left */}
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-[5px] border-[1.5px] border-white/70",
            "bg-black/30 transition-all duration-150",
            "opacity-0 group-hover:opacity-100",
            selected && "opacity-100 border-primary bg-primary",
          )}
        >
          {selected && <Check className="size-3 text-primary-foreground" />}
        </div>

        {/* Bottom row: kind tag + video icon */}
        <div className="flex items-end justify-between">
          <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
            {isVideo ? "video" : "image"}
          </span>
          {isVideo && (
            <span className="rounded bg-black/60 p-1 text-white">
              <Play className="size-2.5" />
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── List item ───────────────────────────────────────────────────────────────

function ListItem({
  item,
  selected,
  onToggle,
}: {
  item: MediaLibraryItem;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const isVideo = item.mimeType.startsWith("video/");

  return (
    <button
      type="button"
      aria-label={`${item.originalName}${selected ? " — selected" : ""}`}
      aria-pressed={selected}
      onClick={() => onToggle(item.id)}
      className={cn(
        "group flex h-14 w-full items-center gap-3 rounded-lg border px-3 text-left",
        "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-transparent hover:border-border/60 hover:bg-muted/40",
      )}
    >
      {/* Thumbnail */}
      <div className="h-9 w-14 flex-shrink-0 overflow-hidden rounded-md border border-border/40">
        <LazyImage
          src={item.url}
          alt={item.originalName}
          className="h-9 w-14 object-cover"
          skeletonClassName="h-9 w-14"
        />
      </div>

      {/* Name + kind */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{item.originalName}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          {isVideo ? (
            <Video className="size-3" />
          ) : (
            <Image className="size-3" />
          )}
          {isVideo ? "Video" : "Image"}
        </p>
      </div>

      {/* Checkbox */}
      <div
        className={cn(
          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[5px]",
          "border border-border transition-all duration-150",
          selected && "border-primary bg-primary",
        )}
      >
        {selected && <Check className="size-3 text-primary-foreground" />}
      </div>
    </button>
  );
}

// ─── Sidebar filter tab ───────────────────────────────────────────────────────

function SidebarTab({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      )}
    >
      <Icon className="size-4 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[11px] tabular-nums",
          active
            ? "bg-background/60 text-foreground"
            : "bg-accent/60 text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

const PER_PAGE = 20;

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
  // Server pagination (optional)
  page: serverPage,
  totalPages: serverTotalPages,
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
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  pageLoading?: boolean;
  onConfirm: (selectedItems: MediaLibraryItem[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [didInit, setDidInit] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [view, setView] = useState<ViewMode>("grid");
  const [localPage, setLocalPage] = useState(1);

  const usesServerPagination = typeof onPageChange === "function";
  const currentPage = usesServerPagination ? (serverPage ?? 1) : localPage;

  // Reset on close
  useEffect(() => {
    if (!open) {
      setDidInit(false);
      setSelectedIds(new Set());
      setFilter("all");
      setSearch("");
      setLocalPage(1);
    }
  }, [open]);

  // Init selection from prop
  useEffect(() => {
    if (!open || didInit) return;
    const validIds = new Set(items.map((i) => i.id));
    setSelectedIds(
      new Set(initialSelectedIds.filter((id) => validIds.has(id))),
    );
    setDidInit(true);
  }, [open, didInit, items, initialSelectedIds]);

  // Selectable items (by acceptedKinds)
  const selectableItems = useMemo(
    () =>
      items.filter((item) => {
        const kind: MediaKind = item.mimeType.startsWith("video/")
          ? "video"
          : "image";
        return acceptedKinds.includes(kind);
      }),
    [items, acceptedKinds],
  );

  // Filtered + sorted
  const filteredItems = useMemo(() => {
    let result = selectableItems.filter((item) => {
      const kind: MediaKind = item.mimeType.startsWith("video/")
        ? "video"
        : "image";
      if (filter === "image" && kind !== "image") return false;
      if (filter === "video" && kind !== "video") return false;
      if (filter === "selected" && !selectedIds.has(item.id)) return false;
      if (
        search &&
        !item.originalName.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
    if (sort === "name")
      result = [...result].sort((a, b) =>
        a.originalName.localeCompare(b.originalName),
      );
    return result;
  }, [selectableItems, filter, search, sort, selectedIds]);

  // Pagination
  const computedTotalPages = usesServerPagination
    ? (serverTotalPages ?? 1)
    : Math.max(1, Math.ceil(filteredItems.length / PER_PAGE));

  const safePage = Math.min(currentPage, computedTotalPages);

  const pageItems = useMemo(() => {
    if (usesServerPagination) return filteredItems;
    const start = (safePage - 1) * PER_PAGE;
    return filteredItems.slice(start, start + PER_PAGE);
  }, [filteredItems, safePage, usesServerPagination]);

  // Counts for sidebar badges
  const counts = useMemo(
    () => ({
      all: selectableItems.length,
      image: selectableItems.filter((i) => !i.mimeType.startsWith("video/"))
        .length,
      video: selectableItems.filter((i) => i.mimeType.startsWith("video/"))
        .length,
      selected: selectedIds.size,
    }),
    [selectableItems, selectedIds],
  );

  const toggleSelection = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (multiple) {
          if (next.has(id)) next.delete(id);
          else next.add(id);
        } else {
          if (next.has(id)) next.clear();
          else {
            next.clear();
            next.add(id);
          }
        }
        return next;
      });
    },
    [multiple],
  );

  function confirmSelection() {
    const selected = selectableItems.filter((item) => selectedIds.has(item.id));
    onConfirm(selected);
    onOpenChange(false);
  }

  function goPage(p: number) {
    const clamped = Math.max(1, Math.min(computedTotalPages, p));
    if (usesServerPagination) onPageChange?.(clamped);
    else setLocalPage(clamped);
  }

  // Reset to page 1 when filter/search changes
  useEffect(() => {
    if (!usesServerPagination) setLocalPage(1);
  }, [filter, search, sort, usesServerPagination]);

  const n = selectedIds.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[580px] max-w-4xl flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 border-b px-5 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <LayoutGrid className="size-4 text-muted-foreground" />
            {title}
          </DialogTitle>

          {/* Toolbar */}
          <div className="flex items-center gap-2 pt-2 pb-1">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-sm"
                placeholder="Search media…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Button
              size="sm"
              variant={view === "grid" ? "secondary" : "ghost"}
              className="h-8 w-8 p-0"
              title="Grid view"
              onClick={() => setView("grid")}
            >
              <Grid2x2 className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant={view === "list" ? "secondary" : "ghost"}
              className="h-8 w-8 p-0"
              title="List view"
              onClick={() => setView("list")}
            >
              <List className="size-3.5" />
            </Button>

            <Select value={sort} onValueChange={(v) => setSort(v as SortOrder)}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="name">Name A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="flex w-44 flex-shrink-0 flex-col gap-0.5 border-r p-3">
            <SidebarTab
              active={filter === "all"}
              onClick={() => setFilter("all")}
              icon={LayoutGrid}
              label="All media"
              count={counts.all}
            />
            <SidebarTab
              active={filter === "image"}
              onClick={() => setFilter("image")}
              icon={Image}
              label="Images"
              count={counts.image}
            />
            <SidebarTab
              active={filter === "video"}
              onClick={() => setFilter("video")}
              icon={Video}
              label="Videos"
              count={counts.video}
            />
            <div className="my-2 border-t" />
            <SidebarTab
              active={filter === "selected"}
              onClick={() => setFilter("selected")}
              icon={CircleCheck}
              label="Selected"
              count={counts.selected}
            />
          </aside>

          {/* Grid/List */}
          <main className="flex-1 overflow-y-auto p-3">
            {loading || pageLoading ? (
              /* Loading skeletons */
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            ) : pageItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <ImageOff className="size-10 opacity-40" />
                <p className="text-sm">
                  {search ? "No results for your search" : emptyText}
                </p>
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {pageItems.map((item) => (
                  <GridItem
                    key={item.id}
                    item={item}
                    selected={selectedIds.has(item.id)}
                    onToggle={toggleSelection}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {pageItems.map((item) => (
                  <ListItem
                    key={item.id}
                    item={item}
                    selected={selectedIds.has(item.id)}
                    onToggle={toggleSelection}
                  />
                ))}
              </div>
            )}
          </main>
        </div>

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 border-t px-4 py-2.5">
          <div className="flex w-full items-center justify-between gap-3">
            {/* Selection info + clear */}
            <div className="flex items-center gap-2">
              {n > 0 ? (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    <Check className="size-3" />
                    {n} selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Clear
                  </Button>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">
                  No items selected
                </span>
              )}
            </div>

            {/* Pagination + confirm */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                disabled={safePage <= 1}
                onClick={() => goPage(safePage - 1)}
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="min-w-[72px] text-center text-xs text-muted-foreground tabular-nums">
                {safePage} / {computedTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                disabled={safePage >= computedTotalPages}
                onClick={() => goPage(safePage + 1)}
              >
                <ChevronRight className="size-3.5" />
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1.5"
                disabled={n === 0}
                onClick={confirmSelection}
              >
                Insert selected
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
