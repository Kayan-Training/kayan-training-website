"use client";

/**
 * Multi-select combobox with hidden inputs for server-action forms.
 */
import { useMemo, useState } from "react";
import { CheckmarkCircle02Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Option = {
  label: string;
  value: string;
};

export function MultiSelectCombobox({
  name,
  options,
  initialSelected = [],
  onChange,
  placeholder = "Select options",
}: {
  name: string;
  options: Option[];
  initialSelected?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(initialSelected);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggleValue = (value: string) => {
    setSelected((prev) => {
      const next = prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value];
      onChange?.(next);
      return next;
    });
  };

  return (
    <div className="grid gap-2">
      {selected.map((value) => (
        <input key={value} name={name} type="hidden" value={value} />
      ))}

      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full justify-between",
          )}
        >
          <span className="truncate">
            {selected.length ? `${selected.length} selected` : placeholder}
          </span>
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[320px] p-0">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No results.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const checked = selectedSet.has(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => toggleValue(option.value)}
                      value={option.label}
                    >
                      <HugeiconsIcon
                        className={cn("opacity-20", checked && "opacity-100")}
                        icon={CheckmarkCircle02Icon}
                        strokeWidth={2}
                      />
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((value) => {
            const label = options.find((option) => option.value === value)?.label ?? value;
            return (
              <Badge key={value} variant="secondary">
                {label}
              </Badge>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
