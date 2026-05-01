import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  className,
  description,
  icon,
  title,
}: {
  className?: string;
  description?: string;
  icon?: ReactNode;
  title: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-center", className)}>
      {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      <p className="font-medium text-foreground">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
