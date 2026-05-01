import { type ReactNode } from "react";

export function PageHeader({
  action,
  title,
}: {
  action?: ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {action}
    </div>
  );
}
