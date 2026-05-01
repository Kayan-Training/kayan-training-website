"use client";

/**
 * Reusable shadcn Select field that posts value through a hidden input.
 */
import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = {
  label: string;
  value: string;
};

export function FormSelectField({
  name,
  defaultValue,
  options,
  placeholder,
}: {
  name: string;
  defaultValue: string;
  options: Option[];
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="grid gap-2">
      <input name={name} type="hidden" value={value} />
      <Select
        defaultValue={defaultValue}
        onValueChange={(nextValue) => setValue(nextValue ?? "")}
        value={value}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder ?? "Select option"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
