import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getServerSession } from "@/lib/session";
import { deleteFromS3ByKey } from "@/lib/storage/s3";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const media = await db.media.findUnique({
    where: { id },
  });

  if (!media) {
    return NextResponse.json({ error: "Media not found." }, { status: 404 });
  }

  const isAdmin = session.user.role === "admin";
  const isOwner = media.uploadedById === session.user.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  await db.media.delete({
    where: { id },
  });

  // Delete from S3 best-effort; DB row removal is source of truth.
  await deleteFromS3ByKey(media.filename).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
