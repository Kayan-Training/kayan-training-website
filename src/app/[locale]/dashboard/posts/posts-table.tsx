"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FilterResetIcon, MoreHorizontalIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Eye, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type PostRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  publishedAt: Date | null;
  locale: string;
};

const statusColors: Record<string, string> = {
  published: "border-green-500/40 bg-green-500/10 text-green-700",
  draft: "border-yellow-500/40 bg-yellow-500/10 text-yellow-700",
  archived: "border-zinc-400/40 bg-zinc-400/10 text-zinc-600",
};

export function PostsTable({ locale, posts }: { locale: string; posts: PostRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.slug.includes(q);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [posts, query, statusFilter]);

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
              placeholder="Search posts..."
              value={query}
            />
          </div>
          <div className="w-[170px] shrink-0">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="!h-10 w-full text-xs">
              <span>
                {statusFilter === "all"
                  ? "All statuses"
                  : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </span>
            </SelectTrigger>
            <SelectContent>
              {["all", "published", "draft", "archived"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
          <Button
            className="h-10 shrink-0 gap-1.5 text-xs"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
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
          <span className="font-medium text-foreground">{posts.length}</span> posts
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20">
              <TableHead className="w-[55%]">Post</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-center text-sm text-muted-foreground" colSpan={4}>
                  No posts found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <Link
                      className="line-clamp-1 text-sm font-semibold hover:text-primary"
                      href={`/${locale}/dashboard/posts/${post.id}`}
                    >
                      {post.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">{post.slug}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border capitalize", statusColors[post.status] ?? "")} variant="outline">
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {post.publishedAt ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(post.publishedAt) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "h-8 px-3 text-xs")}
                        href={`/${locale}/dashboard/posts/${post.id}`}
                      >
                        <Pencil className="mr-1.5 size-3.5" />
                        Edit
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger className={cn(buttonVariants({ size: "icon-sm", variant: "outline" }))}>
                          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            render={<Link href={`/${locale}/posts/${post.slug}`} target="_blank" />}
                          >
                            <Eye className="mr-1.5 size-3.5" />
                            View on site
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
