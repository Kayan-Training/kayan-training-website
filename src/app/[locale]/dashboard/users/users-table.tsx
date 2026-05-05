"use client";

import { useMemo, useState, useTransition } from "react";
import { FilterResetIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Ban, KeyRound, MoreHorizontal, ShieldCheck, ShieldUser } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned">(
    "all",
  );
  const [roleDialogUser, setRoleDialogUser] = useState<UserRow | null>(null);
  const [nextRole, setNextRole] = useState<"user" | "admin">("user");
  const [resetDialogUser, setResetDialogUser] = useState<UserRow | null>(null);
  const [banDialogUser, setBanDialogUser] = useState<UserRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery =
        !q || (u.name ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !u.banned) ||
        (statusFilter === "banned" && u.banned);
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  function handleToggleBan(id: string, currentlyBanned: boolean) {
    startTransition(async () => {
      const result = await toggleBanUser(id, !currentlyBanned, locale);
      if (result.error) toast.error(result.error);
      else toast.success(currentlyBanned ? "User unbanned" : "User banned");
    });
  }

  function openRoleDialog(user: UserRow) {
    setRoleDialogUser(user);
    setNextRole((user.role === "admin" ? "admin" : "user") as "user" | "admin");
  }

  function saveRoleChange() {
    if (!roleDialogUser) return;
    startTransition(async () => {
      const result = await setUserRole(roleDialogUser.id, nextRole, locale);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Role updated");
        setRoleDialogUser(null);
      }
    });
  }

  function sendPasswordResetEmail() {
    if (!resetDialogUser) return;
    startTransition(async () => {
      try {
        const { error } = await authClient.requestPasswordReset({
          email: resetDialogUser.email,
          redirectTo: `${window.location.origin}/${locale}/auth/reset-password`,
        });
        if (error) {
          toast.error(error.message ?? "Failed to send password reset email.");
          return;
        }
        toast.success(`Password reset email sent to ${resetDialogUser.email}`);
        setResetDialogUser(null);
      } catch {
        toast.error("Failed to send password reset email.");
      }
    });
  }

  return (
    <>
      <Dialog open={!!roleDialogUser} onOpenChange={(open) => { if (!open) setRoleDialogUser(null); }}>
        {roleDialogUser ? (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Change Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Update role for <span className="font-medium text-foreground">{roleDialogUser.email}</span>
              </p>
              <Select value={nextRole} onValueChange={(v) => setNextRole((v as "user" | "admin") ?? "user")}>
                <SelectTrigger className="!h-10 w-full text-xs">
                  <span>{nextRole}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">user</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRoleDialogUser(null)}>Cancel</Button>
                <Button disabled={isPending} onClick={saveRoleChange}>
                  {isPending ? "Saving..." : "Save role"}
                </Button>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
      <AlertDialog open={!!resetDialogUser} onOpenChange={(open) => { if (!open) setResetDialogUser(null); }}>
        {resetDialogUser ? (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send password reset email?</AlertDialogTitle>
              <AlertDialogDescription>
                This will email a reset link to <span className="font-medium text-foreground">{resetDialogUser.email}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={sendPasswordResetEmail}>
                Send reset email
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        ) : null}
      </AlertDialog>
      <AlertDialog open={!!banDialogUser} onOpenChange={(open) => { if (!open) setBanDialogUser(null); }}>
        {banDialogUser ? (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {banDialogUser.banned ? "Unban" : "Ban"} {banDialogUser.email}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {banDialogUser.banned
                  ? "User will regain access to their account."
                  : "User will be immediately locked out."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleToggleBan(banDialogUser.id, banDialogUser.banned)}
              >
                {banDialogUser.banned ? "Unban" : "Ban"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        ) : null}
      </AlertDialog>
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
              placeholder="Search name or email..."
              value={query}
            />
          </div>
          <div className="w-[170px] shrink-0">
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? "all")}>
            <SelectTrigger className="!h-10 w-full text-xs">
              <span>{roleFilter === "all" ? "All roles" : roleFilter}</span>
            </SelectTrigger>
            <SelectContent>
              {["all", "user", "admin"].map((r) => (
                <SelectItem key={r} value={r}>
                  {r === "all" ? "All roles" : r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
          <div className="w-[170px] shrink-0">
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter((v as "all" | "active" | "banned") ?? "all")
            }
          >
            <SelectTrigger className="!h-10 w-full text-xs">
              <span className="capitalize">
                {statusFilter === "all" ? "All statuses" : statusFilter}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
          </div>
          <Button
            className="h-10 shrink-0 gap-1.5 text-xs"
            onClick={() => {
              setQuery("");
              setRoleFilter("all");
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
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell className="py-12 text-center text-sm text-muted-foreground" colSpan={5}>
                  No users match your current filters.
                </TableCell>
              </TableRow>
            ) : null}
            {filtered.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <p className="text-sm font-medium">{user.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </TableCell>
                <TableCell>
                  <Badge className="border border-border bg-muted text-foreground capitalize" variant="outline">
                    {user.role}
                  </Badge>
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
                  <div className="inline-flex items-center gap-1.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={cn(buttonVariants({ size: "icon-sm", variant: "outline" }))}
                        disabled={isPending}
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-fit min-w-0">
                        <DropdownMenuItem onClick={() => openRoleDialog(user)}>
                          <ShieldUser className="mr-1.5 size-3.5" />
                          Change role
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setResetDialogUser(user)}>
                          <KeyRound className="mr-1.5 size-3.5" />
                          Send password reset
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setBanDialogUser(user)}
                        >
                          {user.banned ? (
                            <ShieldCheck className="mr-1.5 size-3.5" />
                          ) : (
                            <Ban className="mr-1.5 size-3.5" />
                          )}
                          {user.banned ? "Unban user" : "Ban user"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
    </>
  );
}
