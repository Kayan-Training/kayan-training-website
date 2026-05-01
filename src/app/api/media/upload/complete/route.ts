import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { getServerSession } from "@/lib/session";

const bodySchema = z.object({
  filename: z.string().min(1),
  fileUrl: z.string().url(),
  key: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const session = await getServerSession();
  const uploadedById = session?.user.id;
  if (!uploadedById) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { filename, fileUrl, key, mimeType, size } = parsed.data;
  const media = await db.media.create({
    data: {
      filename: key,
      mimeType,
      originalName: filename,
      size,
      uploadedById,
      url: fileUrl,
    },
  });

  return NextResponse.json({ id: media.id, url: media.url });
}
