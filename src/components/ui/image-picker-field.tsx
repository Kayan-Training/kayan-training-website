"use client";

import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import { MediaLibraryDialog } from "@/components/ui/media-library-dialog";
import { UploadProgress } from "@/components/ui/upload-progress";
import { uploadMediaFile } from "@/lib/client/media-upload";
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
  previewFit = "cover",
}: {
  value: string;
  onChange: (url: string) => void;
  fetchMedia: FetchMediaFn;
  dir?: "ltr" | "rtl";
  previewFit?: "cover" | "contain";
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function uploadAndSelect(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported in this field.");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setUploadStatus("");
    try {
      const uploaded = await uploadMediaFile(file, {
        onProgress: (percent) => setUploadProgress(percent),
        onStatus: (status) => setUploadStatus(status),
      });
      onChange(uploaded.url);
      toast.success("Image uploaded.");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAndSelect(file);
    e.target.value = "";
  }

  return (
    <>
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-border/70 bg-card transition-colors",
          dragOver && "border-primary ring-2 ring-primary/20",
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={async (e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) {
            await uploadAndSelect(file);
          }
        }}
      >
        {value && (
          <div className="relative h-32 w-full bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Preview"
              className={cn(
                "h-full w-full",
                previewFit === "contain" ? "object-contain p-2" : "object-cover",
              )}
              src={value}
            />
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
          <button
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border/70 bg-muted/30 px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            disabled={uploading}
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Upload className="size-3" />
            )}
            Upload
          </button>
        </div>
        <input
          accept="image/*"
          className="sr-only"
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
        />
        <p className="px-3 pb-2 text-[10px] text-muted-foreground">
          Drag and drop an image here, or use Upload.
        </p>
        <div className="px-2 pb-2">
          <UploadProgress
            isActive={uploading}
            percent={uploadProgress}
            status={uploadStatus}
          />
        </div>
      </div>

      <MediaLibraryDialog
        acceptedKinds={["image"]}
        emptyText="No images uploaded yet. Upload via the Media section."
        initialSelectedIds={
          value ? items.filter((item) => item.url === value).map((item) => item.id) : []
        }
        items={items.map((item) => ({ ...item, mimeType: item.mimeType ?? "image/*" }))}
        loading={loading}
        multiple={false}
        open={open}
        title="Media Library"
        onConfirm={(selected) => {
          const first = selected[0];
          if (!first) return;
          onChange(first.url);
        }}
        onOpenChange={setOpen}
      />
    </>
  );
}
