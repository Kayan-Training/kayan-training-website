"use client";

/**
 * Client-side media upload helper for dashboard editors.
 *
 * The helper centralizes the presign -> S3 PUT -> media record flow so rich
 * text editors and the media library save uploads through the same pipeline.
 */
export type UploadedMedia = {
  fileUrl: string;
  id: string;
  key: string;
  mimeType: string;
  originalName: string;
  size: number;
  url: string;
};

async function readJsonError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? fallback;
}

export async function uploadMediaFile(file: File): Promise<UploadedMedia> {
  const presignResponse = await fetch("/api/media/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, mimeType: file.type, size: file.size }),
  });

  if (!presignResponse.ok) {
    throw new Error(await readJsonError(presignResponse, "Failed to get upload URL."));
  }

  const { uploadUrl, key, fileUrl } = (await presignResponse.json()) as {
    fileUrl: string;
    key: string;
    uploadUrl: string;
  };

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Upload to storage failed.");
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
    throw new Error(
      await readJsonError(finalizeResponse, "Upload saved to storage but failed to persist media record."),
    );
  }

  const media = (await finalizeResponse.json()) as { id: string; url: string };

  return {
    fileUrl,
    id: media.id,
    key,
    mimeType: file.type,
    originalName: file.name,
    size: file.size,
    url: media.url,
  };
}
