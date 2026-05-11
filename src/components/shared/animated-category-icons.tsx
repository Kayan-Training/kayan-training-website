import Image from "next/image";
import type {
  AnimatedCategoryIconItem,
  IconDirection,
} from "@/lib/content/category-icons";
import { cn } from "@/lib/utils";

function AnimatedIcon({
  src,
  alt,
  label,
  direction,
  duration,
  offset,
  size = 48,
}: {
  src: string;
  alt: string;
  label: string;
  direction: IconDirection;
  duration?: string;
  offset?: string;
  size?: number;
}) {
  const isVertical = direction === "up" || direction === "down";
  const animationClass = {
    up: "animate-icon-loop-up",
    down: "animate-icon-loop-down",
    left: "animate-icon-loop-left",
    right: "animate-icon-loop-right",
  }[direction];

  return (
    <div
      className="relative overflow-hidden"
      title={label}
      aria-label={alt}
      style={{ height: `${size}px`, width: `${size}px` }}
    >
      <div
        className={cn(
          "absolute will-change-transform motion-reduce:animate-none",
          isVertical ? "inset-0 flex flex-col" : "left-0 top-0 flex h-full",
          animationClass,
        )}
        style={{
          direction: "ltr",
          animationDuration: duration ?? "5.5s",
          animationDelay: offset ?? "0s",
          animationIterationCount: "infinite",
          animationTimingFunction: "linear",
          height: isVertical ? `${size * 2}px` : `${size}px`,
          width: isVertical ? `${size}px` : `${size * 2}px`,
        }}
      >
        <div className="grid shrink-0 place-items-center" style={{ height: `${size}px`, width: `${size}px` }}>
          <Image src={src} width={size} height={size} alt={alt} />
        </div>
        <div
          className="grid shrink-0 place-items-center"
          style={{ height: `${size}px`, width: `${size}px` }}
          aria-hidden="true"
        >
          <Image src={src} width={size} height={size} alt="" />
        </div>
      </div>
    </div>
  );
}

export function AnimatedCategoryIcons({
  icons,
  className,
  iconSize = 48,
}: {
  icons: AnimatedCategoryIconItem[];
  className?: string;
  iconSize?: number;
}) {
  if (!icons.length) return null;

  return (
    <div className={cn("grid sm:grid-cols-8 grid-cols-5", className)}>
      {icons.map((icon) => (
        <AnimatedIcon
          key={`${icon.src}-${icon.label}`}
          src={icon.src}
          alt={icon.alt}
          label={icon.label}
          direction={icon.direction}
          duration={icon.duration}
          offset={icon.offset}
          size={iconSize}
        />
      ))}
    </div>
  );
}
