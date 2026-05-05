"use client";

import { CheckCircle2, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function UploadProgress({
  className,
  isActive,
  percent,
  status,
}: {
  className?: string;
  isActive: boolean;
  percent: number;
  status?: string;
}) {
  if (!isActive) return null;

  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className={cn("mt-2 rounded-md border border-border/60 bg-muted/20 p-2.5", className)}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          {clamped >= 100 ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <Loader2 className="size-3.5 animate-spin text-primary" />}
          <span>{clamped >= 100 ? "Upload complete" : "Uploading"}</span>
        </div>
        <span className="font-mono text-[11px] text-foreground">{clamped}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border/70">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {status ? <p className="mt-1.5 text-[11px] text-muted-foreground">{status}</p> : null}
    </div>
  );
}
