"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
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

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const inputCls =
  "h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm text-foreground " +
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-ring/30 transition-colors";

const labelCls = "mb-1.5 block text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground";

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
          { locale: "en", title: form.titleEn, altText: form.altEn, description: form.descEn },
          { locale: "ar", title: form.titleAr, altText: form.altAr, description: form.descAr },
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
        <DialogTitle className="line-clamp-1 text-sm">{item.originalName}</DialogTitle>
      </DialogHeader>

      {item.mimeType.startsWith("image/") && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          <Image alt={item.originalName} className="object-contain" fill sizes="480px" src={item.url} />
        </div>
      )}

      {/* Locale toggle */}
      <div className="flex items-center gap-3">
        <span className={labelCls} style={{ margin: 0 }}>Language:</span>
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
              onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Alt Text (English)</label>
            <input
              className={inputCls}
              placeholder="Describe the image for screen readers"
              value={form.altEn}
              onChange={(e) => setForm((f) => ({ ...f, altEn: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Description (English)</label>
            <input
              className={inputCls}
              placeholder="Optional caption or context"
              value={form.descEn}
              onChange={(e) => setForm((f) => ({ ...f, descEn: e.target.value }))}
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
              onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Alt Text (Arabic)</label>
            <input
              className={cn(inputCls, "text-right")}
              dir="rtl"
              placeholder="وصف الصورة لقارئات الشاشة"
              value={form.altAr}
              onChange={(e) => setForm((f) => ({ ...f, altAr: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Description (Arabic)</label>
            <input
              className={cn(inputCls, "text-right")}
              dir="rtl"
              placeholder="تعليق أو سياق اختياري"
              value={form.descAr}
              onChange={(e) => setForm((f) => ({ ...f, descAr: e.target.value }))}
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

export function MediaGrid({ locale, media }: { locale: string; media: MediaItem[] }) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

  const filtered = media.filter(
    (m) => !query.trim() || m.originalName.toLowerCase().includes(query.toLowerCase()),
  );

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteMedia(id, locale);
      if (result.error) toast.error(result.error);
      else toast.success("Media deleted");
    });
  }

  return (
    <>
      <div className="grid gap-4">
        <div className="rounded-xl border border-border/70 bg-card p-4">
          <Input
            className="h-10 max-w-sm"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by filename..."
            value={query}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
            <span className="font-medium text-foreground">{media.length}</span> files
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {filtered.map((item) => {
            const trEn = item.translations.find((t) => t.locale === "en");
            const hasMetadata = !!(trEn?.title || trEn?.altText);
            return (
              <article className="overflow-hidden rounded-xl border border-border/70 bg-card" key={item.id}>
                <div className="relative aspect-4/3 bg-muted">
                  {item.mimeType.startsWith("image/") ? (
                    <Image
                      alt={trEn?.altText || item.originalName}
                      className="object-cover"
                      fill
                      sizes="240px"
                      src={item.url}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      {item.mimeType.split("/")[1]?.toUpperCase() ?? "FILE"}
                    </div>
                  )}
                  {!hasMetadata && (
                    <div className="absolute bottom-1 right-1 rounded bg-amber-500/90 px-1 py-0.5 text-[9px] font-bold text-white">
                      No metadata
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="line-clamp-1 text-xs font-medium" title={trEn?.title || item.originalName}>
                    {trEn?.title || item.originalName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{formatBytes(item.size)}</p>
                  <div className="mt-2 flex gap-1">
                    <button
                      className="flex h-7 flex-1 items-center justify-center rounded-md border border-border/70 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      type="button"
                      onClick={() => setEditingItem(item)}
                    >
                      Edit
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        className={`${buttonVariants({ size: "sm", variant: "destructive" })} h-7 px-2 text-[11px]`}
                        disabled={isPending}
                      >
                        Del
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete file?</AlertDialogTitle>
                          <AlertDialogDescription>
                            &ldquo;{item.originalName}&rdquo; will be permanently deleted. Events or posts
                            referencing this file will lose their image.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(item.id)}>Delete</AlertDialogAction>
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

      <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null); }}>
        {editingItem && (
          <MetaDialog item={editingItem} locale={locale} onClose={() => setEditingItem(null)} />
        )}
      </Dialog>
    </>
  );
}
