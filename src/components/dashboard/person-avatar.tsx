"use client";

/** Decode cached, size-appropriate thumbnails instead of full-resolution profile uploads. */
import Image from "next/image";
import { useState } from "react";

export function PersonAvatar({
  src,
  name,
  size,
}: {
  src?: string;
  name: string;
  size: 32 | 40;
}) {
  const [failedSrc, setFailedSrc] = useState<string>();
  return (
    <span
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground outline outline-1 outline-border"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")}
      {src && failedSrc !== src ? (
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          quality={72}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : null}
    </span>
  );
}
