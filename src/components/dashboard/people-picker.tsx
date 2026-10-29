"use client";

/** Search and add several directory profiles without closing the picker after each choice. */
import { Check, ChevronDown, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PersonAvatar } from "@/components/dashboard/person-avatar";
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
import type { PeopleOption } from "@/lib/events/people-groups";

export function PeoplePicker({
  people,
  selectedIds,
  locale,
  groupLabel,
  disabled,
  onAdd,
}: {
  people: PeopleOption[];
  selectedIds: string[];
  locale: "en" | "ar";
  groupLabel: string;
  disabled?: boolean;
  onAdd: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [listNode, setListNode] = useState<HTMLDivElement | null>(null);
  const [scrollable, setScrollable] = useState(false);
  useEffect(() => {
    if (!listNode) return;
    const measure = () =>
      setScrollable(listNode.scrollHeight > listNode.clientHeight + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(listNode);
    if (listNode.firstElementChild)
      observer.observe(listNode.firstElementChild);
    measure();
    return () => observer.disconnect();
  }, [listNode]);
  const ar = locale === "ar";
  const [openingSelection, setOpeningSelection] = useState(selectedIds);
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  // Freeze availability ordering per opening: adding a row must not move it under the pointer.
  const orderedPeople = useMemo(() => {
    const atOpen = new Set(openingSelection);
    return [...people].sort(
      (a, b) => Number(atOpen.has(a.value)) - Number(atOpen.has(b.value)),
    );
  }, [people, openingSelection]);
  const remaining = people.filter(
    (person) => !selected.has(person.value),
  ).length;
  function handleOpenChange(next: boolean) {
    if (next) setOpeningSelection(selectedIds);
    setOpen(next);
  }
  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="min-h-10 gap-2"
            disabled={disabled || !people.length}
            aria-label={`${ar ? "إضافة أشخاص إلى" : "Add people to"} ${groupLabel}`}
          />
        }
      >
        <Plus data-icon="inline-start" />
        {ar ? "إضافة أشخاص" : "Add people"}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="dashboard-theme max-h-(--available-height) w-[min(360px,calc(100vw-2rem))] gap-0 overflow-hidden border border-border bg-popover p-0 text-popover-foreground"
        dir={ar ? "rtl" : "ltr"}
      >
        <Command className="min-h-0 flex-1 p-0" disablePointerSelection>
          <div className="shrink-0 border-b p-2">
            <CommandInput
              placeholder={
                ar ? "ابحث بالاسم أو التخصص…" : "Search by name or title…"
              }
              aria-label={ar ? "البحث عن أشخاص" : "Search people"}
            />
          </div>
          <CommandList
            ref={setListNode}
            hideScrollbar={false}
            className="min-h-0 max-h-72 overscroll-contain scroll-auto p-1 [scrollbar-gutter:stable] [scrollbar-width:auto] [scrollbar-color:var(--muted-foreground)_var(--muted)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/60 [&::-webkit-scrollbar-track]:bg-muted"
            label={ar ? "دليل الأشخاص" : "People directory"}
            aria-label={ar ? "دليل الأشخاص" : "People directory"}
          >
            <CommandEmpty>
              {ar ? "لا توجد نتائج مطابقة." : "No people match your search."}
            </CommandEmpty>
            <CommandGroup>
              {orderedPeople.map((person) => {
                const added = selected.has(person.value);
                const name = ar ? person.labelAr || person.label : person.label;
                const subtitle = ar
                  ? person.subtitleAr || person.subtitle
                  : person.subtitle;
                return (
                  <CommandItem
                    key={person.value}
                    value={person.value}
                    keywords={[
                      person.label,
                      person.labelAr ?? "",
                      person.subtitle ?? "",
                      person.subtitleAr ?? "",
                    ]}
                    disabled={added}
                    onSelect={() => onAdd(person.value)}
                    className="h-14 gap-3 px-2 py-2 hover:bg-muted"
                  >
                    <PersonAvatar src={person.imageUrl} name={name} size={32} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-sm font-medium"
                        title={name}
                        dir="auto"
                      >
                        {name}
                      </span>
                      {subtitle ? (
                        <span
                          className="block truncate text-xs text-muted-foreground"
                          title={subtitle}
                          dir="auto"
                        >
                          {subtitle}
                        </span>
                      ) : null}
                    </span>
                    {added ? (
                      <Check
                        className="size-4 shrink-0 text-primary"
                        aria-label={ar ? "تمت الإضافة" : "Added"}
                      />
                    ) : (
                      <Plus className="size-4 shrink-0 text-muted-foreground" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-muted/30 px-3 py-2">
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span>
              {ar
                ? `${remaining} متاح للإضافة`
                : `${remaining} available to add`}
            </span>
            {scrollable ? (
              <span className="flex items-center gap-1">
                <ChevronDown className="size-3" />
                {ar ? "مرّر لرؤية المزيد" : "Scroll to see more"}
              </span>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            className="min-h-10"
            onClick={() => setOpen(false)}
          >
            {ar ? "تم" : "Done"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
