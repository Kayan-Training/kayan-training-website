import {
  HeadObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const S3_MAX_UPLOAD_BYTES = 150 * 1024 * 1024;
export const S3_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "application/pdf",
]);

type S3Config = {
  bucket: string;
  publicBaseUrl: string;
  region: string;
  s3: S3Client;
};

function ensureHttpsBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function getS3Config(): S3Config | null {
  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_S3_BUCKET;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const customPublicBase = process.env.AWS_S3_PUBLIC_BASE_URL;

  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }

  const publicBaseUrl =
    ensureHttpsBaseUrl(customPublicBase ?? "") ||
    `https://${bucket}.s3.${region}.amazonaws.com`;

  const s3 = new S3Client({
    credentials: { accessKeyId, secretAccessKey },
    region,
  });

  return { bucket, publicBaseUrl, region, s3 };
}

export async function createPresignedUpload(input: {
  filename: string;
  mimeType: string;
}) {
  const cfg = getS3Config();
  if (!cfg) {
    throw new Error("S3 is not configured.");
  }

  const key = `media/${Date.now()}-${sanitizeFilename(input.filename)}`;
  const cacheControl = input.mimeType.startsWith("image/")
    ? "public, max-age=31536000, immutable"
    : input.mimeType.startsWith("video/")
      ? "public, max-age=604800"
      : "public, max-age=86400";

  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    CacheControl: cacheControl,
    ContentType: input.mimeType,
    Key: key,
  });

  const uploadUrl = await getSignedUrl(cfg.s3, command, { expiresIn: 60 * 5 });
  const fileUrl = `${cfg.publicBaseUrl}/${key}`;
  return { fileUrl, key, uploadUrl };
}

export async function deleteFromS3ByKey(key: string): Promise<void> {
  const cfg = getS3Config();
  if (!cfg) {
    return;
  }
  await cfg.s3.send(
    new DeleteObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
    }),
  );
}

export async function s3ObjectExists(key: string): Promise<boolean> {
  const cfg = getS3Config();
  if (!cfg) {
    return false;
  }

  try {
    await cfg.s3.send(
      new HeadObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
