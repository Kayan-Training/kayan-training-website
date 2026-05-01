/**
 * S3 presigned upload URL route.
 */
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { z } from "zod";

const MAX_SIZE = 50 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "video/mp4",
  "application/pdf",
]);

const bodySchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
});

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { filename, mimeType, size } = parsed.data;

  if (!allowedMimeTypes.has(mimeType)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }

  if (size > MAX_SIZE) {
    return NextResponse.json({ error: "File exceeds 50MB limit." }, { status: 400 });
  }

  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_S3_BUCKET;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    return NextResponse.json({ error: "S3 is not configured." }, { status: 500 });
  }

  const key = `media/${Date.now()}-${sanitizeFilename(filename)}`;

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
  const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return NextResponse.json({
    uploadUrl,
    key,
    fileUrl,
  });
}
