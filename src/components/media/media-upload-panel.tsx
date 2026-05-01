"use client";

/**
 * Media upload tester for dashboard integration.
 */
import { useState } from "react";

type UploadResult = {
  key: string;
  fileUrl: string;
};

type MediaRecord = {
  id: string;
  mimeType: string;
  originalName: string;
  url: string;
};

export function MediaUploadPanel({ initialMedia = [] }: { initialMedia?: MediaRecord[] }) {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploaded, setUploaded] = useState<UploadResult | null>(null);
  const [media, setMedia] = useState<MediaRecord[]>(initialMedia);
  const [query, setQuery] = useState("");

  async function onDelete(mediaId: string) {
    const response = await fetch(`/api/media/${mediaId}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("Failed to delete media.");
      return;
    }
    setMedia((prev) => prev.filter((item) => item.id !== mediaId));
    setMessage("Media deleted.");
  }

  async function onCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Media URL copied.");
    } catch {
      setMessage("Could not copy URL.");
    }
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage("");
    setUploaded(null);

    try {
      const presignResponse = await fetch("/api/media/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, mimeType: file.type, size: file.size }),
      });

      if (!presignResponse.ok) {
        const payload = (await presignResponse.json().catch(() => null)) as { error?: string } | null;
        setMessage(payload?.error ?? "Failed to get upload URL.");
        return;
      }

      const { uploadUrl, key, fileUrl } = (await presignResponse.json()) as {
        uploadUrl: string;
        key: string;
        fileUrl: string;
      };

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        setMessage("Upload to storage failed.");
        return;
      }

      const finalizeResponse = await fetch("/api/media/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          fileUrl,
          key,
          mimeType: file.type,
          size: file.size,
        }),
      });

      if (!finalizeResponse.ok) {
        const payload = (await finalizeResponse.json().catch(() => null)) as { error?: string } | null;
        setMessage(payload?.error ?? "Upload saved to storage but failed to persist media record.");
        return;
      }

      setUploaded({ key, fileUrl });
      setMedia((prev) => [
        {
          id: `${Date.now()}-${key}`,
          mimeType: file.type,
          originalName: file.name,
          url: fileUrl,
        },
        ...prev,
      ]);
      setMessage("Upload completed.");
    } catch {
      setMessage("Unexpected upload error.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="space-y-4 border border-[color:oklch(0.32_0.012_207/0.15)] bg-surface-container p-6">
      <h2 className="text-xl font-semibold">Upload Media</h2>
      <input onChange={onFileChange} type="file" />
      {isUploading ? <p className="text-sm">Uploading...</p> : null}
      {message ? <p className="text-sm text-on-surface-variant">{message}</p> : null}
      {uploaded ? (
        <div className="space-y-2 text-sm">
          <p>Key: {uploaded.key}</p>
          <a className="underline" href={uploaded.fileUrl} rel="noreferrer" target="_blank">
            Open uploaded file
          </a>
        </div>
      ) : null}
      <div className="space-y-3">
        <input
          className="input-underline w-full bg-transparent py-2 text-sm"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter uploads..."
          value={query}
        />
        <div className="space-y-2">
          {media
            .filter((item) =>
              `${item.originalName} ${item.mimeType}`.toLowerCase().includes(query.trim().toLowerCase()),
            )
            .map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate">{item.originalName}</span>
                <div className="flex items-center gap-2">
                  <button className="underline" onClick={() => onCopy(item.url)} type="button">
                    Copy URL
                  </button>
                  <a className="underline" href={item.url} rel="noreferrer" target="_blank">
                    Open
                  </a>
                  <button className="text-red-300 underline" onClick={() => onDelete(item.id)} type="button">
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
