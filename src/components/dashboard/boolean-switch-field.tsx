"use client";

/**
 * Switch field that synchronizes a hidden string value for server actions.
 */
import { useState } from "react";

import { Switch } from "@/components/ui/switch";

type BooleanSwitchFieldProps = {
  defaultChecked?: boolean;
  id?: string;
  label?: string;
  name: string;
};

export function BooleanSwitchField({
  defaultChecked = false,
  id,
  label,
  name,
}: BooleanSwitchFieldProps) {
  const [checked, setChecked] = useState(defaultChecked);
  const hiddenId = id ?? `${name}Hidden`;

  return (
    <div className="flex items-center gap-2">
      <Switch checked={checked} onCheckedChange={setChecked} />
      {label ? <span className="text-sm text-muted-foreground">{label}</span> : null}
      <input id={hiddenId} name={name} type="hidden" value={checked ? "true" : "false"} />
    </div>
  );
}
