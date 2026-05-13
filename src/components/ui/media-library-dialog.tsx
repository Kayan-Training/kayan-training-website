"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Filter,
  Grid2x2,
  Image,
  ImageOff,
  LayoutGrid,
  List,
  Play,
  Search,
  Video,
} from "lucide-react";
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

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

const PER_PAGE = 20;

const LazyImage = memo(function LazyImage({
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
      { rootMargin: "120px" },
    );
    observer.observe(img);
    return () => observer.disconnect();
  }, [src]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden", skeletonClassName)}>
      <div
        className={cn(
          "absolute inset-0 bg-muted transition-opacity duration-300",
          loaded ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <div className="h-full w-full animate-pulse bg-gradient-to-r from-muted via-muted/60 to-muted" />
      </div>
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
});

const GridItem = memo(function GridItem({
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
      aria-label={`${item.originalName}${selected ? " — selected" : ""}`}
      aria-pressed={selected}
      className={cn(
        "group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border/50 hover:border-border",
      )}
      type="button"
      onClick={() => onToggle(item.id)}
    >
      <LazyImage alt={item.originalName} src={item.url} />
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-between p-2 transition-opacity duration-150",
          "bg-black/0 group-hover:bg-black/10",
          selected && "bg-black/10",
        )}
      >
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-[5px] border-[1.5px] border-white/70 bg-black/30 transition-all duration-150",
            "opacity-0 group-hover:opacity-100",
            selected && "border-primary bg-primary opacity-100",
          )}
        >
          {selected && <Check className="size-3 text-primary-foreground" />}
        </div>
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
});

const ListItem = memo(function ListItem({
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
      aria-label={`${item.originalName}${selected ? " — selected" : ""}`}
      aria-pressed={selected}
      className={cn(
        "group flex h-14 w-full items-center gap-3 rounded-lg border px-3 text-left transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-transparent hover:border-border/60 hover:bg-muted/40",
      )}
      type="button"
      onClick={() => onToggle(item.id)}
    >
      <div className="h-9 w-14 shrink-0 overflow-hidden rounded-md border border-border/40">
        <LazyImage
          alt={item.originalName}
          className="h-9 w-14 object-cover"
          skeletonClassName="h-9 w-14"
          src={item.url}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground" title={item.originalName}>
          {item.originalName}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          {isVideo ? <Video className="size-3" /> : <Image className="size-3" />}
          {isVideo ? "Video" : "Image"}
        </p>
      </div>
      <div
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border border-border transition-all duration-150",
          selected && "border-primary bg-primary",
        )}
      >
        {selected && <Check className="size-3 text-primary-foreground" />}
      </div>
    </button>
  );
});

function SidebarTab({
  active,
  count,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-accent font-medium text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      )}
      type="button"
      onClick={onClick}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[11px] tabular-nums",
          active ? "bg-background/60 text-foreground" : "bg-accent/60 text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}

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
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [didInit, setDidInit] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [view, setView] = useState<ViewMode>("grid");
  const [localPage, setLocalPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const usesServerPagination = typeof onPageChange === "function";
  const currentPage = usesServerPagination ? (serverPage ?? 1) : localPage;
  const selectableItems = useMemo(
    () =>
      items.filter((item) => {
        const kind: MediaKind = item.mimeType.startsWith("video/") ? "video" : "image";
        return acceptedKinds.includes(kind);
      }),
    [items, acceptedKinds],
  );

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 180);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!open) {
      setDidInit(false);
      setSelectedIds(new Set());
      setFilter("all");
      setSearchInput("");
      setSearch("");
      setLocalPage(1);
      setSort("newest");
      setView("grid");
    }
  }, [open]);

  useEffect(() => {
    if (!open || didInit) return;
    const validIds = new Set(items.map((i) => i.id));
    setSelectedIds(new Set(initialSelectedIds.filter((id) => validIds.has(id))));
    setDidInit(true);
  }, [open, didInit, items, initialSelectedIds]);

  const selectedIdsForFilter = filter === "selected" ? selectedIds : null;

  const { filteredItems, selectableItemsById } = useMemo(() => {
    const byId = new Map(selectableItems.map((item) => [item.id, item]));
    const searchLower = deferredSearch.toLowerCase();
    const baseFiltered = selectableItems.filter((item) => {
      const kind: MediaKind = item.mimeType.startsWith("video/") ? "video" : "image";
      if (filter === "image" && kind !== "image") return false;
      if (filter === "video" && kind !== "video") return false;
      if (
        deferredSearch &&
        !item.originalName.toLowerCase().includes(searchLower)
      )
        return false;
      return true;
    });
    let result =
      filter === "selected"
        ? baseFiltered.filter((item) => selectedIds.has(item.id))
        : baseFiltered;
    if (sort === "name") {
      result = [...result].sort((a, b) => a.originalName.localeCompare(b.originalName));
    }
    return { filteredItems: result, selectableItemsById: byId };
  }, [selectableItems, filter, selectedIdsForFilter, deferredSearch, sort]);

  const computedTotalPages = usesServerPagination
    ? (serverTotalPages ?? 1)
    : Math.max(1, Math.ceil(filteredItems.length / PER_PAGE));
  const safePage = Math.min(currentPage, computedTotalPages);
  const pageItems = useMemo(() => {
    if (usesServerPagination) return filteredItems;
    const start = (safePage - 1) * PER_PAGE;
    return filteredItems.slice(start, start + PER_PAGE);
  }, [filteredItems, safePage, usesServerPagination]);

  const counts = useMemo(() => {
    let imageCount = 0;
    let videoCount = 0;
    for (const item of selectableItems) {
      if (item.mimeType.startsWith("video/")) videoCount++;
      else imageCount++;
    }
    return {
      all: selectableItems.length,
      image: imageCount,
      video: videoCount,
      selected: selectedIds.size,
    };
  }, [selectableItems, selectedIds.size]);

  const toggleSelection = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (multiple) {
          if (next.has(id)) next.delete(id);
          else next.add(id);
        } else if (next.has(id)) {
          next.clear();
        } else {
          next.clear();
          next.add(id);
        }
        return next;
      });
    },
    [multiple],
  );

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const selectVisible = useCallback(() => {
    setSelectedIds((prev) => {
      if (!multiple) {
        const first = pageItems[0];
        return first ? new Set([first.id]) : prev;
      }
      return new Set([...prev, ...pageItems.map((item) => item.id)]);
    });
  }, [multiple, pageItems]);

  const selectAllFiltered = useCallback(() => {
    if (!multiple) {
      const first = filteredItems[0];
      setSelectedIds(first ? new Set([first.id]) : new Set());
      return;
    }
    setSelectedIds(new Set(filteredItems.map((item) => item.id)));
  }, [filteredItems, multiple]);

  const invertSelection = useCallback(() => {
    if (!multiple) return;
    setSelectedIds((prev) => {
      const next = new Set<string>();
      for (const item of filteredItems) {
        if (!prev.has(item.id)) next.add(item.id);
      }
      return next;
    });
  }, [filteredItems, multiple]);

  const applyFilterKind = useCallback((kind: FilterTab) => setFilter(kind), []);

  function confirmSelection() {
    const selected = Array.from(selectedIds)
      .map((id) => selectableItemsById.get(id))
      .filter((item): item is MediaLibraryItem => Boolean(item));
    onConfirm(selected);
    onOpenChange(false);
  }

  function goPage(nextPage: number) {
    const clamped = Math.max(1, Math.min(computedTotalPages, nextPage));
    if (usesServerPagination) onPageChange?.(clamped);
    else setLocalPage(clamped);
  }

  useEffect(() => {
    if (!usesServerPagination) setLocalPage(1);
  }, [filter, search, sort, usesServerPagination]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a" && multiple) {
        event.preventDefault();
        selectAllFiltered();
      }
      if ((event.key === "Enter" || event.key === "NumpadEnter") && !multiple && selectedIds.size > 0) {
        confirmSelection();
      }
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, multiple, selectAllFiltered, selectedIds.size]);

  const n = selectedIds.size;
  const quickOpsVisible = selectableItems.length >= 24 || multiple;
  const activeFilterLabel =
    filter === "all"
      ? "All assets"
      : filter === "image"
        ? "Images"
        : filter === "video"
          ? "Videos"
          : "Selected";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(90vh,680px)] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-4 py-3 sm:px-5">
          <DialogTitle className="flex items-center gap-2 text-base">
            <LayoutGrid className="size-4 text-muted-foreground" />
            {title}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 pb-1 pt-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-sm"
                placeholder="Search assets..."
                value={searchInput}
                onChange={(event) => {
                  const value = event.target.value;
                  startTransition(() => setSearchInput(value));
                }}
              />
            </div>
            <Button
              aria-label="Switch to grid view"
              className="h-8 w-8 p-0"
              size="sm"
              title="Grid view"
              variant={view === "grid" ? "secondary" : "ghost"}
              onClick={() => startTransition(() => setView("grid"))}
            >
              <Grid2x2 className="size-3.5" />
            </Button>
            <Button
              aria-label="Switch to list view"
              className="h-8 w-8 p-0"
              size="sm"
              title="List view"
              variant={view === "list" ? "secondary" : "ghost"}
              onClick={() => startTransition(() => setView("list"))}
            >
              <List className="size-3.5" />
            </Button>
            <Select
              value={sort}
              onValueChange={(value) =>
                startTransition(() => setSort(value as SortOrder))
              }
            >
              <SelectTrigger className="h-8 w-[136px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem disabled={usesServerPagination} value="newest">
                  Newest first
                </SelectItem>
                <SelectItem disabled={usesServerPagination} value="oldest">
                  Oldest first
                </SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="h-8 px-2 text-xs"
              size="sm"
              variant="outline"
              onClick={() =>
                startTransition(() => {
                  setSearchInput("");
                  setFilter("all");
                  setSort("newest");
                })
              }
            >
              Reset
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 md:hidden">
            {([
              ["all", "All assets", counts.all],
              ["image", "Images", counts.image],
              ["video", "Videos", counts.video],
              ["selected", "Selection", counts.selected],
            ] as const).map(([key, label, count]) => (
              <button
                aria-pressed={filter === key}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                  filter === key
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
                )}
                key={key}
                type="button"
                onClick={() => startTransition(() => setFilter(key))}
              >
                {label} ({count})
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {usesServerPagination
              ? "Server mode: newest/oldest sorting is backend-controlled."
              : "Tip: Enter toggles item; Ctrl/Cmd+A selects all filtered in multi-select."}
          </p>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside className="hidden w-44 shrink-0 flex-col gap-0.5 border-r p-3 md:flex">
            <SidebarTab
              active={filter === "all"}
              count={counts.all}
              icon={LayoutGrid}
              label="All assets"
              onClick={() => startTransition(() => setFilter("all"))}
            />
            <SidebarTab
              active={filter === "image"}
              count={counts.image}
              icon={Image}
              label="Images"
              onClick={() => startTransition(() => setFilter("image"))}
            />
            <SidebarTab
              active={filter === "video"}
              count={counts.video}
              icon={Video}
              label="Videos"
              onClick={() => startTransition(() => setFilter("video"))}
            />
            <div className="my-2 border-t" />
            <SidebarTab
              active={filter === "selected"}
              count={counts.selected}
              icon={CircleCheck}
              label="Selection"
              onClick={() => startTransition(() => setFilter("selected"))}
            />
          </aside>

          <main className="flex-1 overflow-y-auto p-3">
            <div aria-live="polite" className="sr-only">
              {n} item{n === 1 ? "" : "s"} selected
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-1">
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10.5px] font-semibold text-zinc-600">
                <Filter className="size-3" />
                Filter: {activeFilterLabel}
              </span>
              {search ? (
                <span className="inline-flex rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10.5px] text-zinc-500">
                  Search: “{search}”
                </span>
              ) : null}
            </div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                Shown {pageItems.length} / Total {filteredItems.length}
              </p>
              {quickOpsVisible && (
                <div className="flex flex-wrap gap-1">
                  <Button className="h-7 px-2 text-[11px]" size="sm" variant="outline" onClick={selectVisible}>
                    Select visible
                  </Button>
                  {multiple && (
                    <>
                      <Button className="h-7 px-2 text-[11px]" size="sm" variant="outline" onClick={selectAllFiltered}>
                        Select filtered
                      </Button>
                      <Button className="h-7 px-2 text-[11px]" size="sm" variant="outline" onClick={invertSelection}>
                        Invert
                      </Button>
                    </>
                  )}
                  <Button className="h-7 px-2 text-[11px]" size="sm" variant="outline" onClick={() => applyFilterKind("image")}>
                    Only images
                  </Button>
                  <Button className="h-7 px-2 text-[11px]" size="sm" variant="outline" onClick={() => applyFilterKind("video")}>
                    Only videos
                  </Button>
                </div>
              )}
            </div>

            {n > 0 && (
              <div className="sticky top-0 z-10 mb-2 flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  <Check className="size-3.5" />
                  {n} selected
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    className="h-7 px-2 text-xs"
                    size="sm"
                    variant="ghost"
                    onClick={() => setFilter("selected")}
                  >
                    View selected
                  </Button>
                  <Button className="h-7 px-2 text-xs" size="sm" variant="ghost" onClick={clearSelection}>
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {loading || pageLoading ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div key={idx} className="aspect-[4/3] animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : pageItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <ImageOff className="size-10 opacity-40" />
                <p className="text-sm">
                  {search ? `No results for "${search}".` : emptyText}
                </p>
                <div className="flex gap-2">
                  {search && (
                    <Button className="h-8 text-xs" size="sm" variant="outline" onClick={() => setSearchInput("")}>
                      Clear search
                    </Button>
                  )}
                  <Button
                    className="h-8 text-xs"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFilter("all");
                      setSearchInput("");
                    }}
                  >
                    Show all assets
                  </Button>
                </div>
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {pageItems.map((item) => (
                  <GridItem
                    item={item}
                    key={item.id}
                    selected={selectedIds.has(item.id)}
                    onToggle={toggleSelection}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {pageItems.map((item) => (
                  <ListItem
                    item={item}
                    key={item.id}
                    selected={selectedIds.has(item.id)}
                    onToggle={toggleSelection}
                  />
                ))}
              </div>
            )}
          </main>
        </div>

        <DialogFooter className="shrink-0 border-t px-3 py-2.5 sm:px-4">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {n > 0 ? (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    <Check className="size-3" />
                    {n} selected
                  </span>
                  <Button className="h-7 text-xs text-muted-foreground" size="sm" variant="ghost" onClick={clearSelection}>
                    Clear
                  </Button>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">No items selected</span>
              )}
            </div>

            <div className="flex items-center justify-end gap-1.5">
              <Button
                aria-label="Go to previous page"
                className="h-8 px-2"
                disabled={safePage <= 1}
                size="sm"
                variant="outline"
                onClick={() => goPage(safePage - 1)}
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="min-w-[72px] text-center text-xs tabular-nums text-muted-foreground">
                {safePage} / {computedTotalPages}
              </span>
              <Button
                aria-label="Go to next page"
                className="h-8 px-2"
                disabled={safePage >= computedTotalPages}
                size="sm"
                variant="outline"
                onClick={() => goPage(safePage + 1)}
              >
                <ChevronRight className="size-3.5" />
              </Button>
              {!multiple && n > 0 ? (
                <Button className="h-8 gap-1.5" size="sm" onClick={confirmSelection}>
                  Select and close
                  <ChevronRight className="size-3.5" />
                </Button>
              ) : (
                <Button className="h-8 gap-1.5" disabled={n === 0} size="sm" onClick={confirmSelection}>
                  Insert selected
                  <ChevronRight className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
        {isPending && <div className="h-0.5 w-full animate-pulse bg-primary/20" />}
      </DialogContent>
    </Dialog>
  );
}
