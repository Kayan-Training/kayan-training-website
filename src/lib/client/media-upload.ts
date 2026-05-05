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

export type UploadMediaOptions = {
  onProgress?: (percent: number) => void;
  onStatus?: (status: string) => void;
};

async function readJsonError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? fallback;
}

function putFileWithProgress(url: string, file: File, onProgress?: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) {
        return;
      }
      onProgress(Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100))));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error("Upload to storage failed."));
      }
    };
    xhr.onerror = () => reject(new Error("Upload to storage failed."));
    xhr.send(file);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function pickSupportedRecorderMimeType(candidates: string[]): string | null {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return null;
  }
  for (const mimeType of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return null;
}

async function loadVideoForCompression(file: File): Promise<HTMLVideoElement> {
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;

  const objectUrl = URL.createObjectURL(file);
  video.src = objectUrl;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Could not read video for compression."));
  });

  return video;
}

async function optimizeVideoBeforeUpload(file: File, onStatus?: (status: string) => void): Promise<File> {
  if (!file.type.startsWith("video/")) {
    return file;
  }

  const mimeType = pickSupportedRecorderMimeType([
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ]);

  if (!mimeType) {
    onStatus?.("Video compression not supported in this browser. Uploading original video.");
    return file;
  }

  onStatus?.("Compressing video before upload...");

  let video: HTMLVideoElement | null = null;
  let recordedBlob: Blob | null = null;
  try {
    video = await loadVideoForCompression(file);
    const stream = (video as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream();

    // 1.6 Mbps target is a pragmatic tradeoff for dashboard uploads.
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 1_600_000,
    });

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    const finished = new Promise<void>((resolve, reject) => {
      recorder.onerror = () => reject(new Error("Video compression failed."));
      recorder.onstop = () => resolve();
    });

    recorder.start(400);
    await video.play();
    await new Promise<void>((resolve) => {
      video!.onended = () => resolve();
    });
    recorder.stop();
    await finished;

    recordedBlob = new Blob(chunks, { type: "video/webm" });
    if (!recordedBlob.size || recordedBlob.size >= file.size) {
      onStatus?.("Original video kept (compression did not reduce size).");
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([recordedBlob], `${baseName}.webm`, { type: "video/webm" });
  } catch {
    onStatus?.("Video compression failed. Uploading original video.");
    return file;
  } finally {
    if (video?.src.startsWith("blob:")) {
      URL.revokeObjectURL(video.src);
    }
  }
}

async function optimizeImageBeforeUpload(file: File, onStatus?: (status: string) => void): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }
  if (file.type === "image/svg+xml") {
    return file;
  }

  onStatus?.("Optimizing image before upload...");

  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read image for optimization."));
      img.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return file;
    }
    ctx.drawImage(image, 0, 0);

    // Try AVIF first, then WebP. Keep original if conversion fails or doesn't reduce size.
    const avifBlob = await canvasToBlob(canvas, "image/avif", 0.75);
    if (avifBlob && avifBlob.size > 0 && avifBlob.size < file.size) {
      return new File([avifBlob], file.name.replace(/\.[^.]+$/, ".avif"), {
        type: "image/avif",
      });
    }

    const webpBlob = await canvasToBlob(canvas, "image/webp", 0.82);
    if (webpBlob && webpBlob.size > 0 && webpBlob.size < file.size) {
      return new File([webpBlob], file.name.replace(/\.[^.]+$/, ".webp"), {
        type: "image/webp",
      });
    }

    return file;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export async function uploadMediaFile(file: File, options?: UploadMediaOptions): Promise<UploadedMedia> {
  const imageOptimized = await optimizeImageBeforeUpload(file, options?.onStatus);
  const uploadFile = await optimizeVideoBeforeUpload(imageOptimized, options?.onStatus);
  if (uploadFile !== file) {
    const kind = file.type.startsWith("video/") ? "Video" : "Image";
    options?.onStatus?.(
      `${kind} optimized: ${(file.size / 1024).toFixed(1)}KB -> ${(uploadFile.size / 1024).toFixed(1)}KB`,
    );
  }
  options?.onProgress?.(0);
  const presignResponse = await fetch("/api/media/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: uploadFile.name, mimeType: uploadFile.type, size: uploadFile.size }),
  });

  if (!presignResponse.ok) {
    throw new Error(await readJsonError(presignResponse, "Failed to get upload URL."));
  }

  const { uploadUrl, key, fileUrl } = (await presignResponse.json()) as {
    fileUrl: string;
    key: string;
    uploadUrl: string;
  };

  options?.onStatus?.("Uploading to storage...");
  await putFileWithProgress(uploadUrl, uploadFile, options?.onProgress);

  options?.onStatus?.("Finalizing media record...");
  const finalizeResponse = await fetch("/api/media/upload/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      fileUrl,
      key,
      mimeType: uploadFile.type,
      size: uploadFile.size,
    }),
  });

  if (!finalizeResponse.ok) {
    throw new Error(
      await readJsonError(finalizeResponse, "Upload saved to storage but failed to persist media record."),
    );
  }

  const media = (await finalizeResponse.json()) as { id: string; url: string };
  options?.onProgress?.(100);

  return {
    fileUrl,
    id: media.id,
    key,
    mimeType: uploadFile.type,
    originalName: file.name,
    size: uploadFile.size,
    url: media.url,
  };
}
