"use client";

import { ImageIcon, Loader2, Video, X } from "lucide-react";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type MediaItem = { id: string; originalName: string; url: string; mimeType?: string };

type FetchMediaFn = () => Promise<MediaItem[]>;

const inputCls =
  "h-9 min-w-0 flex-1 rounded-md border border-input bg-input/20 px-3 text-sm text-foreground " +
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-ring/30 transition-colors";

export function ImagePickerField({
  value,
  onChange,
  fetchMedia,
  dir,
}: {
  value: string;
  onChange: (url: string) => void;
  fetchMedia: FetchMediaFn;
  dir?: "ltr" | "rtl";
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function openPicker() {
    setLoading(true);
    try {
      const result = await fetchMedia();
      setItems(result);
    } finally {
      setLoading(false);
    }
    setOpen(true);
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
        {value && (
          <div className="relative h-32 w-full bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Preview" className="h-full w-full object-cover" src={value} />
            <button
              aria-label="Remove image"
              className="absolute right-2 top-2 rounded-md bg-black/60 p-1 text-white hover:bg-black/80"
              title="Remove image"
              type="button"
              onClick={() => onChange("")}
            >
              <X className="size-3" />
            </button>
          </div>
        )}
        <div className="flex gap-2 p-2">
          <input
            className={cn(inputCls, dir === "rtl" && "text-right")}
            dir={dir}
            placeholder="Paste URL or browse library…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <button
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border/70 bg-muted/30 px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            disabled={loading}
            type="button"
            onClick={openPicker}
          >
            {loading ? <Loader2 className="size-3 animate-spin" /> : <ImageIcon className="size-3" />}
            Browse
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Media Library</DialogTitle>
          </DialogHeader>
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No images uploaded yet. Upload via the Media section.
            </p>
          ) : (
            <div className="grid max-h-[70vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => {
                const isVideo = item.mimeType?.startsWith("video/") ?? false;
                const isSelectable = !isVideo;
                return (
                <button
                  className={cn(
                    "group relative aspect-[4/3] overflow-hidden rounded-lg border border-border/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                    isSelectable ? "hover:border-primary" : "cursor-not-allowed opacity-70",
                  )}
                  disabled={!isSelectable}
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!isSelectable) return;
                    onChange(item.url);
                    setOpen(false);
                  }}
                >
                  {isVideo ? (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <Video className="size-6 text-muted-foreground" />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={item.originalName}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      src={item.url}
                    />
                  )}
                  <span
                    className={cn(
                      "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white",
                      isVideo ? "bg-blue-600/80" : "bg-black/60",
                    )}
                  >
                    {isVideo ? "video" : "image"}
                  </span>
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
