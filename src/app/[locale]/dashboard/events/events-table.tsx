"use client";

import {
  ArrowUpDownIcon,
  Delete02Icon,
  FilterResetIcon,
  LinkSquare02Icon,
  PencilEdit02Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatEventStatus, formatEventType } from "@/lib/format";
import { getEventStatusTone, getEventTypeTone } from "@/lib/tone";
import { cn } from "@/lib/utils";
import { deleteProgramsAction } from "./_actions";

export type EventRow = {
  coverImage: string | null;
  endDate: Date;
  eventKind: "event" | "training_course";
  id: string;
  isFeatured: boolean;
  locale: string;
  slug: string;
  registrationsCount: number;
  startDate: Date;
  status: string;
  title: string;
  type: string;
};

type StatusFilter = "all" | "archived" | "draft" | "published";
type TypeFilter = "all" | "hybrid" | "online" | "onsite";
type SortValue = "createdDesc" | "startAsc" | "startDesc" | "titleAsc";

const statusLabels: Record<StatusFilter, string> = {
  all: "All statuses",
  archived: "Archived",
  draft: "Draft",
  published: "Published",
};
const typeLabels: Record<TypeFilter, string> = {
  all: "All types",
  hybrid: "Hybrid",
  online: "Online",
  onsite: "On-site",
};
const sortLabels: Record<SortValue, string> = {
  createdDesc: "Recently created",
  startAsc: "Start date (soonest)",
  startDesc: "Start date (latest)",
  titleAsc: "Title (A-Z)",
};

function isSameCalendarDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function EventsTable({
  events,
  activeLocale,
  emptyTitle = "No programs found",
  emptyDescription = "Try another search or filter combination.",
  programKindLabel = "Programs",
  onDeleted,
}: {
  events: EventRow[];
  activeLocale: string;
  emptyTitle?: string;
  emptyDescription?: string;
  programKindLabel?: string;
  onDeleted?: (ids: string[]) => void;
}) {
  const [rows, setRows] = useState(events);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortValue>("createdDesc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, startDeleting] = useTransition();

  useEffect(() => {
    setRows(events);
    setSelectedIds(new Set());
  }, [events]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((event) => {
      const matchesQuery =
        q.length === 0 || event.title.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter;
      const matchesType = typeFilter === "all" || event.type === typeFilter;
      return matchesQuery && matchesStatus && matchesType;
    });
    const sorted = [...list];
    if (sortBy === "titleAsc")
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === "startAsc")
      sorted.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    if (sortBy === "startDesc")
      sorted.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    return sorted;
  }, [rows, query, sortBy, statusFilter, typeFilter]);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((event) => selectedIds.has(event.id));

  function reset() {
    setQuery("");
    setSortBy("createdDesc");
    setStatusFilter("all");
    setTypeFilter("all");
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const event of filtered) next.delete(event.id);
      } else {
        for (const event of filtered) next.add(event.id);
      }
      return next;
    });
  }

  function handleDeleteSelected() {
    const ids = [...selectedIds];
    if (!ids.length) return;
    startDeleting(async () => {
      const result = await deleteProgramsAction(activeLocale, ids);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${ids.length} ${programKindLabel.toLowerCase()} deleted.`);
      setRows((prev) => prev.filter((row) => !ids.includes(row.id)));
      setSelectedIds(new Set());
      onDeleted?.(ids);
    });
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-border/70 bg-card p-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <div className="relative">
            <HugeiconsIcon
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              icon={Search01Icon}
              strokeWidth={2}
            />
            <Input
              className="h-10 pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search program title..."
              value={query}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter((value as StatusFilter) ?? "all")
            }
          >
            <SelectTrigger className="!h-10 w-full truncate text-xs">
              {statusLabels[statusFilter]}
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(statusLabels) as [StatusFilter, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(value) =>
              setTypeFilter((value as TypeFilter) ?? "all")
            }
          >
            <SelectTrigger className="!h-10 w-full truncate text-xs">
              {typeLabels[typeFilter]}
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(typeLabels) as [TypeFilter, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <Select
            value={sortBy}
            onValueChange={(value) =>
              setSortBy((value as SortValue) ?? "createdDesc")
            }
          >
            <SelectTrigger className="!h-10 w-full truncate text-xs">
              <span className="inline-flex items-center gap-1.5">
                <HugeiconsIcon
                  className="size-3.5 text-muted-foreground"
                  icon={ArrowUpDownIcon}
                  strokeWidth={2}
                />
                {sortLabels[sortBy]}
              </span>
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(sortLabels) as [SortValue, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <Button
            className="h-10 gap-1.5 text-xs"
            type="button"
            variant="outline"
            onClick={reset}
          >
            <HugeiconsIcon
              className="size-3.5"
              icon={FilterResetIcon}
              strokeWidth={2}
            />
            Reset
          </Button>
        </div>
        {selectedIds.size > 0 ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
            <span className="text-xs font-medium text-foreground">
              {selectedIds.size} selected
            </span>
            <Button
              className="h-8 gap-1.5 text-xs"
              disabled={isDeleting}
              size="sm"
              type="button"
              variant="destructive"
              onClick={handleDeleteSelected}
            >
              <HugeiconsIcon className="size-3.5" icon={Delete02Icon} strokeWidth={2} />
              {isDeleting ? "Deleting..." : "Delete Selected"}
            </Button>
          </div>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">{filtered.length}</span>{" "}
          of{" "}
          <span className="font-medium text-foreground">{rows.length}</span>{" "}
          programs
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20">
              <TableHead className="w-[34px]">
                <input
                  aria-label="Select all visible rows"
                  checked={allVisibleSelected}
                  className="size-3.5 accent-primary"
                  type="checkbox"
                  onChange={toggleVisible}
                />
              </TableHead>
              <TableHead className="w-[45%]">Program</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Registrations</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    className="py-10"
                    description={emptyDescription}
                    title={emptyTitle}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((event) => (
                <TableRow
                  key={event.id}
                  className={cn(
                    event.isFeatured && "bg-yellow-50/70 hover:bg-yellow-50/90",
                  )}
                >
                  <TableCell>
                    <input
                      aria-label={`Select ${event.title}`}
                      checked={selectedIds.has(event.id)}
                      className="size-3.5 accent-primary"
                      type="checkbox"
                      onChange={() => toggleRow(event.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 ps-2">
                      <div className="relative w-12 aspect-square shrink-0 overflow-hidden rounded-[8px] border border-border/70 bg-muted">
                        <Image
                          alt={event.title}
                          className="object-cover aspect-square"
                          fill
                          sizes="64px"
                          src={
                            event.coverImage ??
                            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=320&q=80"
                          }
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          className="line-clamp-1 text-sm font-semibold text-foreground hover:underline hover:text-primary"
                          href={`/${event.locale}/dashboard/programs/${event.id}`}
                        >
                          {event.title}
                        </Link>
                        {event.isFeatured ? (
                          <Badge
                            className="border-primary/50 bg-primary/10 text-primary rounded-none uppercase"
                            variant="outline"
                          >
                            Featured
                          </Badge>
                        ) : null}
                        <div className="flex flex-col items-start gap-1">
                          <p className="text-xs text-muted-foreground">
                            /{event.slug}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn("border", getEventStatusTone(event.status))}
                      variant="outline"
                    >
                      {formatEventStatus(event.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn("border", getEventTypeTone(event.type))}
                      variant="outline"
                    >
                      {formatEventType(event.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="">
                    {event.registrationsCount > 0 ? (
                      <span className="font-semibold font-mono text-lg">
                        {event.registrationsCount > 0
                          ? event.registrationsCount
                          : "-"}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {isSameCalendarDate(event.startDate, event.endDate)
                      ? formatDate(event.startDate)
                      : `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        className={cn(
                          buttonVariants({ size: "sm", variant: "outline" }),
                          "h-8 px-3 text-xs",
                        )}
                        aria-label="Edit event"
                        href={`/${event.locale}/dashboard/programs/${event.id}`}
                      >
                        <HugeiconsIcon icon={PencilEdit02Icon} />
                        <span className="ml-1">Edit</span>
                      </Link>
                      <Link
                        aria-label="View event"
                        className={cn(
                          buttonVariants({ size: "sm", variant: "outline" }),
                          "h-8 px-3 text-xs",
                        )}
                        href={`/${activeLocale}/${event.eventKind === "training_course" ? "training-courses" : "events"}/${event.slug}`}
                        target="_blank"
                      >
                        <HugeiconsIcon icon={LinkSquare02Icon} />
                        <span className="ml-1">View</span>
                      </Link>
                      {/* <DropdownMenu>
                        <DropdownMenuTrigger className={cn(buttonVariants({ size: "icon-sm", variant: "outline" }))}>
                          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem render={<Link href={`/${event.locale}/dashboard/programs/${event.id}`} />}>Open Editor</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu> */}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

