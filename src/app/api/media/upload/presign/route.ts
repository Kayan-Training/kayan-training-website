import { NextResponse } from "next/server";
import { z } from "zod";

import {
  S3_ALLOWED_MIME_TYPES,
  S3_MAX_UPLOAD_BYTES,
  createPresignedUpload,
} from "@/lib/storage/s3";

const bodySchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { filename, mimeType, size } = parsed.data;

  if (!S3_ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }

  if (size > S3_MAX_UPLOAD_BYTES) {
    const maxMb = Math.floor(S3_MAX_UPLOAD_BYTES / (1024 * 1024));
    return NextResponse.json(
      { error: `File exceeds ${maxMb}MB limit.` },
      { status: 400 },
    );
  }

  try {
    const result = await createPresignedUpload({ filename, mimeType });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create upload URL.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
