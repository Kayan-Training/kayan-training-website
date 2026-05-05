import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function DashboardSectionHeading({
  description,
  icon: Icon,
  index,
  title,
  className,
}: {
  description?: string;
  icon: React.ElementType;
  index: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-[11px] font-medium text-muted-foreground/40">
          {index}
        </span>
        <Icon className="size-4 text-primary" />
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        {description ? (
          <span className="ml-auto text-[11px] text-muted-foreground">
            {description}
          </span>
        ) : null}
      </div>
      <div className="mt-3 h-px bg-border/50" />
    </div>
  );
}

export function DashboardFieldLabel({
  children,
  hint,
  className,
}: {
  children: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-1.5 flex items-center justify-between", className)}>
      <Label className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </Label>
      {hint ? (
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  );
}
