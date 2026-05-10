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
}: {
  src: string;
  alt: string;
  label: string;
  direction: IconDirection;
  duration?: string;
  offset?: string;
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
      className="relative h-12 w-12 overflow-hidden"
      title={label}
      aria-label={alt}
    >
      <div
        className={cn(
          "absolute will-change-transform motion-reduce:animate-none",
          isVertical
            ? "inset-0 flex h-[200%] flex-col"
            : "left-0 top-0 flex h-full w-[96px]",
          animationClass,
        )}
        style={{
          direction: "ltr",
          animationDuration: duration ?? "5.5s",
          animationDelay: offset ?? "0s",
          animationIterationCount: "infinite",
          animationTimingFunction: "linear",
        }}
      >
        <div className="grid h-12 w-12 shrink-0 place-items-center">
          <Image src={src} width={48} height={48} alt={alt} />
        </div>
        <div
          className="grid h-12 w-12 shrink-0 place-items-center"
          aria-hidden="true"
        >
          <Image src={src} width={48} height={48} alt="" />
        </div>
      </div>
    </div>
  );
}

export function AnimatedCategoryIcons({
  icons,
  className,
}: {
  icons: AnimatedCategoryIconItem[];
  className?: string;
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
        />
      ))}
    </div>
  );
}
