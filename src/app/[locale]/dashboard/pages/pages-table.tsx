"use client";

import { FilterResetIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type PageRow = {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  status: string;
  kind: "system" | "custom";
};

function statusTone(status: string) {
  if (status === "published") return "border-green-500/40 bg-green-500/10 text-green-600";
  if (status === "draft") return "border-yellow-500/40 bg-yellow-500/10 text-yellow-600";
  return "border-border bg-muted text-muted-foreground";
}

type SortBy = "slugAsc" | "titleAsc" | "statusAsc";

export function PagesTable({
  deleteAction,
  locale,
  pages,
}: {
  deleteAction: (id: string) => Promise<{ error?: string }>;
  locale: string;
  pages: PageRow[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState<"all" | "system" | "custom">("all");
  const [sortBy, setSortBy] = useState<SortBy>("slugAsc");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = pages.filter((page) => {
      const matchesQuery =
        !q ||
        page.slug.toLowerCase().includes(q) ||
        page.titleEn.toLowerCase().includes(q) ||
        page.titleAr.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || page.status === statusFilter;
      const matchesKind = kindFilter === "all" || page.kind === kindFilter;
      return matchesQuery && matchesStatus && matchesKind;
    });

    const sorted = [...list];
    if (sortBy === "titleAsc") sorted.sort((a, b) => a.titleEn.localeCompare(b.titleEn));
    else if (sortBy === "statusAsc") sorted.sort((a, b) => a.status.localeCompare(b.status));
    else sorted.sort((a, b) => a.slug.localeCompare(b.slug));
    return sorted;
  }, [pages, query, statusFilter, kindFilter, sortBy]);

  function handleDelete(page: PageRow) {
    startTransition(async () => {
      const result = await deleteAction(page.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Page "${page.titleEn}" deleted`);
    });
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-border/70 bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-[1.6_1_320px]">
            <HugeiconsIcon
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              icon={Search01Icon}
              strokeWidth={2}
            />
            <Input
              className="h-10 pl-9"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title or slug..."
              value={query}
            />
          </div>
          <div className="w-[170px] shrink-0">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
              <SelectTrigger className="!h-10 w-full text-xs">
                <span>{statusFilter === "all" ? "All statuses" : statusFilter}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="published">published</SelectItem>
                <SelectItem value="draft">draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[170px] shrink-0">
            <Select value={kindFilter} onValueChange={(v) => setKindFilter((v as "all" | "system" | "custom") ?? "all")}>
              <SelectTrigger className="!h-10 w-full text-xs">
                <span>{kindFilter === "all" ? "All types" : kindFilter}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="system">system</SelectItem>
                <SelectItem value="custom">custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[170px] shrink-0">
            <Select value={sortBy} onValueChange={(v) => setSortBy((v as SortBy) ?? "slugAsc")}>
              <SelectTrigger className="!h-10 w-full text-xs">
                <span>
                  {sortBy === "titleAsc" ? "Title (A-Z)" : sortBy === "statusAsc" ? "Status (A-Z)" : "Slug (A-Z)"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slugAsc">Slug (A-Z)</SelectItem>
                <SelectItem value="titleAsc">Title (A-Z)</SelectItem>
                <SelectItem value="statusAsc">Status (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="h-10 shrink-0 gap-1.5 text-xs"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
              setKindFilter("all");
              setSortBy("slugAsc");
            }}
            type="button"
            variant="outline"
          >
            <HugeiconsIcon className="size-3.5" icon={FilterResetIcon} strokeWidth={2} />
            Reset
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
          <span className="font-medium text-foreground">{pages.length}</span> pages
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20">
              <TableHead>Page</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-center text-sm text-muted-foreground" colSpan={4}>
                  No pages found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>
                    <Link
                      className="line-clamp-1 text-sm font-semibold hover:text-primary"
                      href={`/${locale}/dashboard/pages/${page.slug}`}
                    >
                      {page.titleEn}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {page.titleAr ? <span>{page.titleAr} · </span> : null}
                      <span className="font-mono text-[11px]">/{page.slug}</span>
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge className="border border-border bg-muted text-foreground uppercase" variant="outline">
                      {page.kind}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("uppercase", statusTone(page.status))} variant="outline">
                      {page.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "h-8 px-3 text-xs")}
                        href={`/${locale}/dashboard/pages/${page.slug}`}
                      >
                        <Pencil className="mr-1.5 size-3.5" />
                        Edit
                      </Link>
                      <Link
                        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "h-8 px-3 text-xs")}
                        href={`/${locale}/${page.slug}`}
                        target="_blank"
                      >
                        <Eye className="mr-1.5 size-3.5" />
                        View
                      </Link>
                      {page.kind === "custom" ? (
                        <AlertDialog>
                          <AlertDialogTrigger
                            className={cn(buttonVariants({ size: "sm", variant: "destructive" }), "h-8 px-3 text-xs")}
                            disabled={isPending}
                          >
                            <Trash2 className="mr-1.5 size-3.5" />
                            Delete
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this page?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete <span className="font-medium">{page.titleEn}</span> and its translations.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(page)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : null}
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
