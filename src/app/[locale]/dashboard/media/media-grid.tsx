"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteMedia } from "./_actions";

export type MediaItem = {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaGrid({ locale, media }: { locale: string; media: MediaItem[] }) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = media.filter(
    (m) => !query.trim() || m.originalName.toLowerCase().includes(query.toLowerCase()),
  );

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteMedia(id, locale);
      if (result.error) toast.error(result.error);
      else toast.success("Media deleted");
    });
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-border/70 bg-card p-4">
        <Input
          className="h-10 max-w-sm"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by filename..."
          value={query}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
          <span className="font-medium text-foreground">{media.length}</span> files
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {filtered.map((item) => (
          <article className="overflow-hidden rounded-xl border border-border/70 bg-card" key={item.id}>
            <div className="relative aspect-[4/3] bg-muted">
              {item.mimeType.startsWith("image/") ? (
                <Image alt={item.originalName} className="object-cover" fill sizes="240px" src={item.url} />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  {item.mimeType.split("/")[1]?.toUpperCase() ?? "FILE"}
                </div>
              )}
            </div>
            <div className="p-2">
              <p className="line-clamp-1 text-xs font-medium" title={item.originalName}>
                {item.originalName}
              </p>
              <p className="text-[11px] text-muted-foreground">{formatBytes(item.size)}</p>
              <AlertDialog>
                <AlertDialogTrigger className={`${buttonVariants({ size: "sm", variant: "destructive" })} mt-2 h-7 w-full text-xs`} disabled={isPending}>
                  Delete
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete file?</AlertDialogTitle>
                    <AlertDialogDescription>
                      "{item.originalName}" will be permanently deleted. Events or posts referencing this file
                      will lose their image.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(item.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
