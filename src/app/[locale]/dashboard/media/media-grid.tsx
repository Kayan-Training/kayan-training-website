"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckSquare2, Eye, FileText, Play, Square } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { uploadMediaFile } from "@/lib/client/media-upload";
import { cn } from "@/lib/utils";
import { deleteMedia, upsertMediaTranslations } from "./_actions";

type MediaTranslation = {
  locale: string;
  title: string;
  altText: string;
  description: string;
};

export type MediaItem = {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  translations: MediaTranslation[];
};

type MetaForm = {
  titleEn: string;
  altEn: string;
  descEn: string;
  titleAr: string;
  altAr: string;
  descAr: string;
};

type UploadTask = {
  id: string;
  filename: string;
  percent: number;
  status: string;
  state: "queued" | "uploading" | "success" | "error";
};

const ACCEPTED_MEDIA_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "application/pdf",
]);
const MEDIA_INPUT_ACCEPT = Array.from(ACCEPTED_MEDIA_MIME_TYPES).join(",");
const videoPosterCache = new Map<string, string>();

function VideoFrameThumbnail({
  alt,
  className,
  src,
}: {
  alt: string;
  className?: string;
  src: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [poster, setPoster] = useState<string | null>(null);
  const [shouldCapture, setShouldCapture] = useState(false);

  useEffect(() => {
    const cached = videoPosterCache.get(src);
    if (cached) {
      setPoster(cached);
      return;
    }
    const target = rootRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldCapture(true);
        observer.disconnect();
      },
      { rootMargin: "180px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [src]);

  useEffect(() => {
    if (!shouldCapture) return;
    let cancelled = false;

    async function captureFrame() {
      try {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;
        video.src = src;

        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => resolve();
          video.onerror = () => reject(new Error("metadata"));
        });

        video.currentTime = Math.min(1, Math.max(0, video.duration * 0.1 || 0));
        await new Promise<void>((resolve, reject) => {
          video.onseeked = () => resolve();
          video.onerror = () => reject(new Error("seek"));
        });

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, video.videoWidth);
        canvas.height = Math.max(1, video.videoHeight);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/webp", 0.72),
        );
        if (!blob || cancelled) return;

        const objectUrlToCache = URL.createObjectURL(blob);
        // Cache poster URLs for this session so repeated renders avoid recapture.
        // Intentionally not revoked per-item; cache lifecycle is page-lifetime.
        videoPosterCache.set(src, objectUrlToCache);
        if (!cancelled) setPoster(objectUrlToCache);
      } catch {
        // Keep fallback UI if capture fails.
      }
    }

    void captureFrame();
    return () => {
      cancelled = true;
    };
  }, [shouldCapture, src]);

  if (!poster) {
    return (
      <div
        ref={rootRef}
        className={cn("flex h-full items-center justify-center bg-muted text-muted-foreground", className)}
      >
        <Play className="size-6" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} className={cn("h-full w-full object-contain", className)} src={poster} />
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const inputCls =
  "h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm text-foreground " +
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-ring/30 transition-colors";

const labelCls =
  "mb-1.5 block text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground";

function MetaDialog({
  item,
  locale,
  onClose,
}: {
  item: MediaItem;
  locale: string;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [activeLocale, setActiveLocale] = useState<"en" | "ar">("en");

  const trEn = item.translations.find((t) => t.locale === "en");
  const trAr = item.translations.find((t) => t.locale === "ar");

  const [form, setForm] = useState<MetaForm>({
    titleEn: trEn?.title ?? "",
    altEn: trEn?.altText ?? "",
    descEn: trEn?.description ?? "",
    titleAr: trAr?.title ?? "",
    altAr: trAr?.altText ?? "",
    descAr: trAr?.description ?? "",
  });

  function handleSave() {
    startTransition(async () => {
      const result = await upsertMediaTranslations(
        item.id,
        [
          {
            locale: "en",
            title: form.titleEn,
            altText: form.altEn,
            description: form.descEn,
          },
          {
            locale: "ar",
            title: form.titleAr,
            altText: form.altAr,
            description: form.descAr,
          },
        ],
        locale,
      );
      if (result.error) toast.error(result.error);
      else {
        toast.success("Metadata saved");
        onClose();
      }
    });
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="line-clamp-1 text-sm">
          {item.originalName}
        </DialogTitle>
      </DialogHeader>

      {item.mimeType.startsWith("image/") && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          <Image
            alt={item.originalName}
            className="object-contain"
            fill
            sizes="480px"
            src={item.url}
          />
        </div>
      )}

      {/* Locale toggle */}
      <div className="flex items-center gap-3">
        <span className={labelCls} style={{ margin: 0 }}>
          Language:
        </span>
        <div className="flex overflow-hidden rounded-md border border-border/70">
          {(["en", "ar"] as const).map((loc) => (
            <button
              className={cn(
                "px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                activeLocale === loc
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
              key={loc}
              type="button"
              onClick={() => setActiveLocale(loc)}
            >
              {loc.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {activeLocale === "en" ? (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Title (English)</label>
            <input
              className={inputCls}
              placeholder="Descriptive title"
              value={form.titleEn}
              onChange={(e) =>
                setForm((f) => ({ ...f, titleEn: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelCls}>Alt Text (English)</label>
            <input
              className={inputCls}
              placeholder="Describe the image for screen readers"
              value={form.altEn}
              onChange={(e) =>
                setForm((f) => ({ ...f, altEn: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelCls}>Description (English)</label>
            <input
              className={inputCls}
              placeholder="Optional caption or context"
              value={form.descEn}
              onChange={(e) =>
                setForm((f) => ({ ...f, descEn: e.target.value }))
              }
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Title (Arabic)</label>
            <input
              className={cn(inputCls, "text-right")}
              dir="rtl"
              placeholder="عنوان وصفي"
              value={form.titleAr}
              onChange={(e) =>
                setForm((f) => ({ ...f, titleAr: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelCls}>Alt Text (Arabic)</label>
            <input
              className={cn(inputCls, "text-right")}
              dir="rtl"
              placeholder="وصف الصورة لقارئات الشاشة"
              value={form.altAr}
              onChange={(e) =>
                setForm((f) => ({ ...f, altAr: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelCls}>Description (Arabic)</label>
            <input
              className={cn(inputCls, "text-right")}
              dir="rtl"
              placeholder="تعليق أو سياق اختياري"
              value={form.descAr}
              onChange={(e) =>
                setForm((f) => ({ ...f, descAr: e.target.value }))
              }
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button disabled={isPending} type="button" onClick={handleSave}>
          {isPending ? "Saving…" : "Save Metadata"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </DialogContent>
  );
}

export function MediaGrid({
  locale,
  media,
}: {
  locale: string;
  media: MediaItem[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [items, setItems] = useState<MediaItem[]>(media);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [enteringIds, setEnteringIds] = useState<string[]>([]);
  const prevMediaIdsRef = useRef<string[]>(media.map((item) => item.id));
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [typeFilter, setTypeFilter] = useState<
    "all" | "image" | "video" | "other" | "missing_metadata"
  >("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "nameAsc">("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(48);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const nextIds = media.map((item) => item.id);
    const prevIds = prevMediaIdsRef.current;
    const newIds = nextIds.filter((id) => !prevIds.includes(id));
    if (newIds.length > 0) {
      setEnteringIds((prev) => [...newIds, ...prev]);
      const timeout = window.setTimeout(() => {
        setEnteringIds((prev) => prev.filter((id) => !newIds.includes(id)));
      }, 900);
      prevMediaIdsRef.current = nextIds;
      setItems(media);
      return () => window.clearTimeout(timeout);
    }
    prevMediaIdsRef.current = nextIds;
    setItems(media);
    return undefined;
  }, [media]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((m) => {
      const matchesQuery = !q || m.originalName.toLowerCase().includes(q);
      const type = m.mimeType.startsWith("image/")
        ? "image"
        : m.mimeType.startsWith("video/")
          ? "video"
          : "other";
      const trEn = m.translations.find((t) => t.locale === "en");
      const hasMetadata = !!(trEn?.title || trEn?.altText);
      const matchesType =
        typeFilter === "all" ||
        typeFilter === type ||
        (typeFilter === "missing_metadata" && !hasMetadata);
      return matchesQuery && matchesType;
    });
    const sorted = [...list];
    if (sortBy === "oldest") sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    else if (sortBy === "nameAsc") sorted.sort((a, b) => a.originalName.localeCompare(b.originalName));
    else sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return sorted;
  }, [items, query, typeFilter, sortBy]);
  const renderedItems = useMemo(
    () => filtered.slice(0, Math.min(filtered.length, visibleCount)),
    [filtered, visibleCount],
  );

  const filterCounts = useMemo(() => {
    let image = 0;
    let video = 0;
    let other = 0;
    let missingMetadata = 0;
    for (const item of items) {
      if (item.mimeType.startsWith("image/")) image++;
      else if (item.mimeType.startsWith("video/")) video++;
      else other++;
      const trEn = item.translations.find((t) => t.locale === "en");
      if (!(trEn?.title || trEn?.altText)) missingMetadata++;
    }
    return {
      all: items.length,
      image,
      missing_metadata: missingMetadata,
      other,
      video,
    };
  }, [items]);
  const metadataKpis = useMemo(() => {
    let complete = 0;
    for (const item of items) {
      const trEn = item.translations.find((t) => t.locale === "en");
      if (trEn?.title && trEn?.altText) complete++;
    }
    const missing = Math.max(0, items.length - complete);
    const percent = items.length === 0 ? 100 : Math.round((complete / items.length) * 100);
    return { complete, missing, percent };
  }, [items]);

  useEffect(() => {
    setVisibleCount(48);
  }, [query, sortBy, typeFilter, items.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisibleCount((prev) => {
          if (prev >= filtered.length) return prev;
          return Math.min(filtered.length, prev + 36);
        });
      },
      { rootMargin: "220px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filtered.length]);

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteMedia(id, locale);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Media deleted");
      router.refresh();
    });
  }

  function toggleItemSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function selectVisible() {
    setSelectedIds((prev) => new Set([...prev, ...filtered.map((item) => item.id)]));
  }

  function bulkDeleteSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    startTransition(async () => {
      let failed = 0;
      for (const id of ids) {
        const result = await deleteMedia(id, locale);
        if (result.error) failed++;
      }
      setItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
      if (failed > 0) {
        toast.error(`Deleted ${ids.length - failed} items. ${failed} failed.`);
      } else {
        toast.success(`Deleted ${ids.length} item${ids.length === 1 ? "" : "s"}.`);
      }
      router.refresh();
    });
  }

  function updateUploadTask(id: string, patch: Partial<UploadTask>) {
    setUploadTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...patch } : task)));
  }

  function scheduleUploadTaskDismiss(id: string) {
    const timeoutMs = 1000 + Math.floor(Math.random() * 2001);
    window.setTimeout(() => {
      setUploadTasks((prev) => prev.filter((task) => task.id !== id));
    }, timeoutMs);
  }

  async function uploadSingleFile(taskId: string, file: File) {
    updateUploadTask(taskId, { state: "uploading", status: "Preparing upload..." });
    try {
      await uploadMediaFile(file, {
        onProgress: (percent) => updateUploadTask(taskId, { percent }),
        onStatus: (status) => updateUploadTask(taskId, { status }),
      });
      updateUploadTask(taskId, { state: "success", percent: 100, status: "Upload complete." });
      router.refresh();
      scheduleUploadTaskDismiss(taskId);
    } catch (error) {
      updateUploadTask(taskId, {
        state: "error",
        status: error instanceof Error ? error.message : "Upload failed.",
      });
      scheduleUploadTaskDismiss(taskId);
    }
  }

  async function handleUploadChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const files = selectedFiles.filter((file) => ACCEPTED_MEDIA_MIME_TYPES.has(file.type));
    const rejected = selectedFiles.filter((file) => !ACCEPTED_MEDIA_MIME_TYPES.has(file.type));
    if (rejected.length > 0) {
      toast.error(`Unsupported type: ${rejected.map((file) => file.name).join(", ")}`);
    }
    if (files.length === 0) return;

    const queuedTasks: UploadTask[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      filename: file.name,
      percent: 0,
      state: "queued",
      status: "Queued",
    }));
    setUploadTasks((prev) => [...queuedTasks, ...prev]);
    setIsUploading(true);

    const maxConcurrency = 5;
    let nextIndex = 0;
    async function runWorker() {
      while (true) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        if (currentIndex >= files.length) return;
        await uploadSingleFile(queuedTasks[currentIndex].id, files[currentIndex]);
      }
    }

    try {
      const workers = Array.from({ length: Math.min(maxConcurrency, files.length) }, () => runWorker());
      await Promise.all(workers);
      toast.success(`Uploaded ${files.length} file${files.length === 1 ? "" : "s"}.`);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <>
      <div className="grid gap-4">
        <div className="rounded-xl border border-border/70 bg-card p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Upload Queue
          </p>
          <div className="mb-3">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="media-upload-input">
              Upload file
            </label>
            <Input
              id="media-upload-input"
              type="file"
              multiple
              accept={MEDIA_INPUT_ACCEPT}
              disabled={isUploading}
              onChange={handleUploadChange}
            />
            {uploadTasks.length > 0 ? (
              <div className="mt-2 space-y-2 rounded-md border border-border/60 bg-muted/20 p-2.5">
                {uploadTasks.map((task) => (
                  <div className="rounded-md border border-border/50 bg-background/80 p-2" key={task.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <p className="line-clamp-1 text-[11px] font-medium text-foreground" title={task.filename}>
                        {task.filename}
                      </p>
                      <span className="font-mono text-[11px] text-muted-foreground">{task.percent}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-border/70">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-300 ease-out",
                          task.state === "error"
                            ? "bg-destructive"
                            : task.state === "success"
                              ? "bg-emerald-500"
                              : "bg-primary",
                        )}
                        style={{ width: `${Math.max(0, Math.min(100, task.percent))}%` }}
                      />
                    </div>
                    <p
                      className={cn(
                        "mt-1.5 text-[11px]",
                        task.state === "error"
                          ? "text-destructive"
                          : task.state === "success"
                            ? "text-emerald-600"
                            : "text-muted-foreground",
                      )}
                    >
                      {task.status}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Asset Browser
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              className="h-10 min-w-[260px] flex-[1.6_1_320px]"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by filename..."
              value={query}
            />
            <div className="w-[150px] shrink-0">
              <Select
                value={typeFilter}
                onValueChange={(v) =>
                  setTypeFilter(
                    (v as "all" | "image" | "video" | "other" | "missing_metadata") ??
                      "all",
                  )
                }
              >
                <SelectTrigger className="!h-10 w-full text-xs">
                  <span>{typeFilter === "all" ? "All types" : typeFilter}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="image">image</SelectItem>
                  <SelectItem value="video">video</SelectItem>
                  <SelectItem value="other">other</SelectItem>
                  <SelectItem value="missing_metadata">missing metadata</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[170px] shrink-0">
              <Select value={sortBy} onValueChange={(v) => setSortBy((v as "newest" | "oldest" | "nameAsc") ?? "newest")}>
                <SelectTrigger className="!h-10 w-full text-xs">
                  <span>{sortBy === "oldest" ? "Oldest first" : sortBy === "nameAsc" ? "Name (A-Z)" : "Newest first"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="nameAsc">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="h-10 shrink-0 text-xs"
              type="button"
              variant="outline"
              onClick={() => {
                setQuery("");
                setTypeFilter("all");
                setSortBy("newest");
              }}
            >
              Reset
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(
              [
                ["all", "All", filterCounts.all],
                ["image", "Images", filterCounts.image],
                ["video", "Videos", filterCounts.video],
                ["other", "Other", filterCounts.other],
                ["missing_metadata", "Missing metadata", filterCounts.missing_metadata],
              ] as const
            ).map(([id, label, count]) => (
              <button
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors",
                  typeFilter === id
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border/70 text-muted-foreground hover:bg-muted",
                )}
                key={id}
                type="button"
                onClick={() => setTypeFilter(id)}
              >
                {label} ({count})
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {renderedItems.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{filtered.length}</span>{" "}
            files
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div className="rounded-md border border-border/70 bg-background px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Metadata complete
              </p>
              <p className="text-sm font-semibold text-foreground tabular-nums">
                {metadataKpis.complete}
              </p>
            </div>
            <div className="rounded-md border border-border/70 bg-background px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Missing metadata
              </p>
              <p className="text-sm font-semibold text-amber-700 tabular-nums">
                {metadataKpis.missing}
              </p>
            </div>
            <div className="rounded-md border border-border/70 bg-background px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quality score
              </p>
              <p className="text-sm font-semibold text-foreground tabular-nums">
                {metadataKpis.percent}%
              </p>
            </div>
          </div>
        </div>
        {selectedIds.size > 0 && (
          <div className="sticky top-2 z-10 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <p className="text-xs font-semibold text-primary">
              {selectedIds.size} selected
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button className="h-7 text-xs" size="sm" variant="outline" onClick={selectVisible}>
                Select visible
              </Button>
              <Button className="h-7 text-xs" size="sm" variant="outline" onClick={clearSelection}>
                Clear
              </Button>
              <AlertDialog>
                <AlertDialogTrigger disabled={isPending}>
                  <Button className="h-7 text-xs" size="sm" variant="destructive">
                    Delete selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete selected files?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {selectedIds.size} selected file{selectedIds.size === 1 ? "" : "s"} will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={bulkDeleteSelected} variant={"destructive"}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {renderedItems.map((item) => {
            const trEn = item.translations.find((t) => t.locale === "en");
            const hasMetadata = !!(trEn?.title || trEn?.altText);
            const selected = selectedIds.has(item.id);
            return (
              <article
                className={cn(
                  "overflow-hidden rounded-xl border border-border/70 bg-card transition-colors",
                  selected && "border-primary/40 bg-primary/5",
                  enteringIds.includes(item.id) && "animate-in fade-in-0 zoom-in-95 duration-500",
                )}
                key={item.id}
              >
                <div className="relative aspect-4/3 bg-black/80">
                  {item.mimeType.startsWith("image/") ? (
                    <Image
                      alt={trEn?.altText || item.originalName}
                      className="object-contain"
                      fill
                      sizes="240px"
                      src={item.url}
                    />
                  ) : item.mimeType.startsWith("video/") ? (
                    <VideoFrameThumbnail alt={item.originalName} src={item.url} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      <div className="flex flex-col items-center gap-1.5">
                        <FileText className="size-4" />
                        <span>{item.mimeType.split("/")[1]?.toUpperCase() ?? "FILE"}</span>
                      </div>
                    </div>
                  )}
                  {!hasMetadata && (
                    <div className="absolute bottom-1 right-1 rounded bg-amber-500/90 px-1 py-0.5 text-[9px] font-bold text-white">
                      No metadata
                    </div>
                  )}
                  <button
                    aria-label={selected ? "Unselect asset" : "Select asset"}
                    className={cn(
                      "absolute left-1 top-1 flex size-6 items-center justify-center rounded-md border bg-black/55 text-white transition-colors",
                      selected ? "border-primary bg-primary" : "border-white/40 hover:bg-black/70",
                    )}
                    type="button"
                    onClick={() => toggleItemSelection(item.id)}
                  >
                    {selected ? <CheckSquare2 className="size-3.5" /> : <Square className="size-3.5" />}
                  </button>
                </div>
                <div className="p-2">
                  <p
                    className="line-clamp-1 text-xs font-medium"
                    title={trEn?.title || item.originalName}
                  >
                    {trEn?.title || item.originalName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatBytes(item.size)}
                  </p>
                  <div className="mt-2 flex gap-1">
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Preview"
                      type="button"
                      onClick={() => setPreviewItem(item)}
                    >
                      <Eye className="size-3.5" />
                    </button>
                    <button
                      className="flex h-7 flex-1 items-center justify-center rounded-md border border-border/70 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      type="button"
                      onClick={() => setEditingItem(item)}
                    >
                      Edit
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger disabled={isPending}>
                        <Button variant={"destructive"}>
                          <HugeiconsIcon
                            icon={Delete02Icon}
                            className="text-destructive"
                          />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete file?</AlertDialogTitle>
                          <AlertDialogDescription>
                            &ldquo;{item.originalName}&rdquo; will be
                            permanently deleted. Events or posts referencing
                            this file will lose their image.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id)}
                            variant={"destructive"}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <div ref={sentinelRef} className="h-8" />
        {renderedItems.length < filtered.length && (
          <div className="flex justify-center pt-1">
            <Button
              className="h-8 text-xs"
              size="sm"
              type="button"
              variant="outline"
              onClick={() =>
                setVisibleCount((prev) => Math.min(filtered.length, prev + 48))
              }
            >
              Load more assets
            </Button>
          </div>
        )}
      </div>

      <Dialog
        open={!!editingItem}
        onOpenChange={(open) => {
          if (!open) setEditingItem(null);
        }}
      >
        {editingItem && (
          <MetaDialog
            item={editingItem}
            locale={locale}
            onClose={() => setEditingItem(null)}
          />
        )}
      </Dialog>

      <Dialog
        open={!!previewItem}
        onOpenChange={(open) => {
          if (!open) setPreviewItem(null);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="line-clamp-1 text-sm">{previewItem?.originalName}</DialogTitle>
          </DialogHeader>
          {previewItem ? (
            <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/20">
              {previewItem.mimeType.startsWith("image/") ? (
                <div className="relative aspect-video w-full">
                  <Image
                    alt={previewItem.originalName}
                    className="object-contain"
                    fill
                    sizes="1200px"
                    src={previewItem.url}
                  />
                </div>
              ) : previewItem.mimeType.startsWith("video/") ? (
                <video
                  className="max-h-[70vh] w-full bg-black"
                  controls
                  preload="metadata"
                  src={previewItem.url}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 py-16 text-center text-sm text-muted-foreground">
                  <FileText className="size-7" />
                  <p>Preview unavailable for this file type.</p>
                  <a
                    className="underline hover:text-foreground"
                    href={previewItem.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open file in new tab
                  </a>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
