"use client";

import { Link01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { X } from "lucide-react";
import { useMemo, useState } from "react";

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
  trainingCourses?: LinkEntityOption[];
  staticRoutes?: LinkEntityOption[];
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
  const [isEditingInternal, setIsEditingInternal] = useState(false);

  function handleSelect(url: string) {
    onChange(url);
    setIsEditingInternal(false);
    setOpen(false);
  }

  const hasEntities =
    entities.pages.length > 0 ||
    entities.posts.length > 0 ||
    entities.events.length > 0 ||
    (entities.trainingCourses?.length ?? 0) > 0 ||
    (entities.staticRoutes?.length ?? 0) > 0;
  const isInternalLink = useMemo(() => value.trim().startsWith("/"), [value]);
  const showInternalChip = isInternalLink && !isEditingInternal;

  return (
    <div className="flex">
      {showInternalChip ? (
        <div
          className={cn(
            "flex h-10 min-w-0 flex-1 items-center justify-between rounded-l-md border border-r-0 border-border/70 bg-card px-2",
            dir === "rtl" && "flex-row-reverse",
          )}
        >
          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary">
            <HugeiconsIcon icon={Link01Icon} className="size-3.5 shrink-0" />
            <span className="truncate font-mono">{value}</span>
          </span>
          <div className="ml-2 flex items-center gap-1">
            <Button
              className="h-7 px-2 text-[10px]"
              size="sm"
              type="button"
              variant="ghost"
              onClick={() => setIsEditingInternal(true)}
            >
              Edit
            </Button>
            <Button
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              size="sm"
              type="button"
              variant="ghost"
              onClick={() => {
                onChange("");
                setIsEditingInternal(false);
              }}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <input
          className={cn(inputCls, dir === "rtl" && "text-right")}
          dir={dir}
          placeholder={placeholder}
          title="URL"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger
          render={
            <button
              aria-label="Browse pages, posts, events, and training courses"
              className={cn(
                "flex h-10 items-center gap-1.5 rounded-r-md border border-border/70 bg-muted/40 px-3",
                "text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              )}
              title="Browse pages, posts, events, and training courses"
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
            <CommandInput placeholder="Search pages, posts, events, training courses…" />
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
              {(entities.trainingCourses?.length ?? 0) > 0 && (
                <CommandGroup heading="Training Courses">
                  {(entities.trainingCourses ?? []).map((e) => (
                    <CommandItem
                      key={e.id}
                      value={`training-${e.label}-${e.url}`}
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
              {(entities.staticRoutes?.length ?? 0) > 0 && (
                <CommandGroup heading="Static Routes">
                  {(entities.staticRoutes ?? []).map((e) => (
                    <CommandItem
                      key={e.id}
                      value={`static-${e.label}-${e.url}`}
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
