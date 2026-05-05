"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Eye, FileText, Play } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
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
import { UploadProgress } from "@/components/ui/upload-progress";
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

function VideoFrameThumbnail({
  alt,
  className,
  src,
}: {
  alt: string;
  className?: string;
  src: string;
}) {
  const [poster, setPoster] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrlToRevoke: string | null = null;

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

        objectUrlToRevoke = URL.createObjectURL(blob);
        if (!cancelled) setPoster(objectUrlToRevoke);
      } catch {
        // Keep fallback UI if capture fails.
      }
    }

    void captureFrame();
    return () => {
      cancelled = true;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [src]);

  if (!poster) {
    return (
      <div className={cn("flex h-full items-center justify-center bg-muted text-muted-foreground", className)}>
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  const filtered = items.filter(
    (m) =>
      !query.trim() ||
      m.originalName.toLowerCase().includes(query.toLowerCase()),
  );

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

  async function handleUploadChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("");

    try {
      const uploaded = await uploadMediaFile(file, {
        onProgress: (percent) => setUploadProgress(percent),
        onStatus: (status) => setUploadStatus(status),
      });

      const newItem: MediaItem = {
        id: uploaded.id,
        url: uploaded.url,
        originalName: uploaded.originalName,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        createdAt: new Date(),
        translations: [],
      };
      setItems((prev) => [newItem, ...prev]);
      toast.success("Media uploaded");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <>
      <div className="grid gap-4">
        <div className="rounded-xl border border-border/70 bg-card p-4">
          <div className="mb-3">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="media-upload-input">
              Upload file
            </label>
            <Input
              id="media-upload-input"
              type="file"
              disabled={isUploading}
              onChange={handleUploadChange}
            />
            <UploadProgress isActive={isUploading} percent={uploadProgress} status={uploadStatus} />
          </div>
          <Input
            className="h-10 max-w-sm"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by filename..."
            value={query}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {filtered.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{items.length}</span>{" "}
            files
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {filtered.map((item) => {
            const trEn = item.translations.find((t) => t.locale === "en");
            const hasMetadata = !!(trEn?.title || trEn?.altText);
            return (
              <article
                className="overflow-hidden rounded-xl border border-border/70 bg-card"
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
