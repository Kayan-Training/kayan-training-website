"use client";

import { Link01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type LinkEntityOption = { id: string; label: string; url: string };

export type LinkPickerEntities = {
  pages: LinkEntityOption[];
  posts: LinkEntityOption[];
  events: LinkEntityOption[];
};

const inputCls =
  "h-10 min-w-0 flex-1 rounded-l-md border border-r-0 border-border/70 bg-card px-3 text-sm " +
  "text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors";

export function LinkPickerInput({
  value,
  onChange,
  entities,
  placeholder = "/en/page-slug",
  dir = "ltr",
}: {
  value: string;
  onChange: (url: string) => void;
  entities: LinkPickerEntities;
  placeholder?: string;
  dir?: "ltr" | "rtl";
}) {
  const [open, setOpen] = useState(false);

  function handleSelect(url: string) {
    onChange(url);
    setOpen(false);
  }

  const hasEntities =
    entities.pages.length > 0 ||
    entities.posts.length > 0 ||
    entities.events.length > 0;

  return (
    <div className="flex">
      <input
        className={cn(inputCls, dir === "rtl" && "text-right")}
        dir={dir}
        placeholder={placeholder}
        title="URL"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger
          render={
            <button
              aria-label="Browse pages, posts, and events"
              className={cn(
                "flex h-10 items-center gap-1.5 rounded-r-md border border-border/70 bg-muted/40 px-3",
                "text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              )}
              title="Browse pages, posts, and events"
              type="button"
            >
              {/* <HugeiconsIcon icon={SearchMdIcon} className="size-3.5" /> */}
              <HugeiconsIcon icon={Search01Icon} className="size-3.5" />
              Browse
            </button>
          }
        ></PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0" sideOffset={4}>
          <Command>
            <CommandInput placeholder="Search pages, posts, events…" />
            <CommandList>
              {!hasEntities && <CommandEmpty>No items found.</CommandEmpty>}
              <CommandEmpty>No results.</CommandEmpty>
              {entities.pages.length > 0 && (
                <CommandGroup heading="Pages">
                  {entities.pages.map((e) => (
                    <CommandItem
                      key={e.id}
                      value={`page-${e.label}-${e.url}`}
                      onSelect={() => handleSelect(e.url)}
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm">{e.label}</span>
                        <span className="truncate font-mono text-[10px] text-muted-foreground">
                          {e.url}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {entities.posts.length > 0 && (
                <CommandGroup heading="Posts">
                  {entities.posts.map((e) => (
                    <CommandItem
                      key={e.id}
                      value={`post-${e.label}-${e.url}`}
                      onSelect={() => handleSelect(e.url)}
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm">{e.label}</span>
                        <span className="truncate font-mono text-[10px] text-muted-foreground">
                          {e.url}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {entities.events.length > 0 && (
                <CommandGroup heading="Events">
                  {entities.events.map((e) => (
                    <CommandItem
                      key={e.id}
                      value={`event-${e.label}-${e.url}`}
                      onSelect={() => handleSelect(e.url)}
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm">{e.label}</span>
                        <span className="truncate font-mono text-[10px] text-muted-foreground">
                          {e.url}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
