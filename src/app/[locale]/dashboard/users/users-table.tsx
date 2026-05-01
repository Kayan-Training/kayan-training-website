"use client";

import { useMemo, useState, useTransition } from "react";
import { FilterResetIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { setUserRole, toggleBanUser } from "./_actions";

export type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  banned: boolean;
  createdAt: Date;
  locale: string;
};

export function UsersTable({ locale, users }: { locale: string; users: UserRow[] }) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery =
        !q || (u.name ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  function handleRoleChange(id: string, role: string) {
    startTransition(async () => {
      const result = await setUserRole(id, role, locale);
      if (result.error) toast.error(result.error);
      else toast.success("Role updated");
    });
  }

  function handleToggleBan(id: string, currentlyBanned: boolean) {
    startTransition(async () => {
      const result = await toggleBanUser(id, !currentlyBanned, locale);
      if (result.error) toast.error(result.error);
      else toast.success(currentlyBanned ? "User unbanned" : "User banned");
    });
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-border/70 bg-card p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_160px_auto]">
          <div className="relative">
            <HugeiconsIcon
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              icon={Search01Icon}
              strokeWidth={2}
            />
            <Input
              className="h-10 pl-9"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email..."
              value={query}
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? "all")}>
            <SelectTrigger className="h-10">
              <span className="text-sm">{roleFilter === "all" ? "All roles" : roleFilter}</span>
            </SelectTrigger>
            <SelectContent>
              {["all", "user", "admin"].map((r) => (
                <SelectItem key={r} value={r}>
                  {r === "all" ? "All roles" : r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setQuery("");
              setRoleFilter("all");
            }}
            type="button"
          >
            <HugeiconsIcon className="size-3.5" icon={FilterResetIcon} strokeWidth={2} /> Reset
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
          <span className="font-medium text-foreground">{users.length}</span> users
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <p className="text-sm font-medium">{user.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </TableCell>
                <TableCell>
                  <Select value={user.role} onValueChange={(role) => role && handleRoleChange(user.id, role)}>
                    <SelectTrigger className="h-8 w-24 text-xs">
                      <span>{user.role}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">user</SelectItem>
                      <SelectItem value="admin">admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {user.banned ? (
                    <Badge className="border-red-500/40 bg-red-500/10 text-red-600" variant="outline">
                      Banned
                    </Badge>
                  ) : (
                    <Badge className="border-green-500/40 bg-green-500/10 text-green-700" variant="outline">
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(user.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger
                      className={cn(
                        buttonVariants({ size: "sm", variant: "outline" }),
                        "h-8 px-3 text-xs",
                        !user.banned && "border-red-200 text-red-600 hover:bg-red-50",
                      )}
                      disabled={isPending}
                    >
                      {user.banned ? "Unban" : "Ban"}
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {user.banned ? "Unban" : "Ban"} {user.email}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {user.banned
                            ? "User will regain access to their account."
                            : "User will be immediately locked out."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleToggleBan(user.id, user.banned)}>
                          {user.banned ? "Unban" : "Ban"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
