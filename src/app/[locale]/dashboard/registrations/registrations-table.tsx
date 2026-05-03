"use client";

import { FilterResetIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { bulkUpdateRegistrationStatus, deleteRegistrations, rejectPayment, verifyPayment } from "./_actions";

export type RegistrationRow = {
  id: string;
  eventId: string;
  eventTitle: string;
  registrantName: string;
  registrantEmail: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentProofUrl?: string | null;
  paymentRef?: string | null;
  amount: string | null;
  createdAt: Date;
  locale: string;
};

const statusColors: Record<string, string> = {
  confirmed: "border-green-500/40 bg-green-500/10 text-green-700",
  pending: "border-yellow-500/40 bg-yellow-500/10 text-yellow-700",
  cancelled: "border-red-500/40 bg-red-500/10 text-red-600",
  attended: "border-blue-500/40 bg-blue-500/10 text-blue-700",
};

function exportCsv(rows: RegistrationRow[]) {
  const header = ["ID", "Event", "Name", "Email", "Status", "Payment", "Amount", "Date"].join(",");
  const lines = rows.map((r) =>
    [
      r.id,
      `"${r.eventTitle.replace(/"/g, '""')}"`,
      `"${r.registrantName.replace(/"/g, '""')}"`,
      r.registrantEmail,
      r.status,
      r.paymentStatus,
      r.amount ?? "0",
      r.createdAt.toISOString().slice(0, 10),
    ].join(","),
  );
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "registrations.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function PaymentDialog({
  row,
  locale,
  onClose,
}: {
  row: RegistrationRow;
  locale: string;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleVerify() {
    startTransition(async () => {
      const result = await verifyPayment(row.id, note, locale);
      if (result.error) toast.error(result.error);
      else { toast.success("Payment verified — registration confirmed."); onClose(); }
    });
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectPayment(row.id, note, locale);
      if (result.error) toast.error(result.error);
      else { toast.success("Payment rejected — registration cancelled."); onClose(); }
    });
  }

  const canAct = row.paymentStatus === "pending";

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Payment — {row.registrantName}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-muted/20 p-4">
          <div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Method</p><p className="capitalize">{row.paymentMethod}</p></div>
          <div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</p><p className="capitalize">{row.paymentStatus}</p></div>
          <div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</p><p>{row.amount ? `${row.amount} OMR` : "—"}</p></div>
          <div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reference</p><p className="font-mono text-xs">{row.paymentRef ?? "—"}</p></div>
        </div>
        {row.paymentProofUrl && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Proof</p>
            <a className="block overflow-hidden rounded-md border border-border/60" href={row.paymentProofUrl} rel="noreferrer" target="_blank">
              <img alt="Payment proof" className="max-h-48 w-full object-contain bg-muted" src={row.paymentProofUrl} />
            </a>
          </div>
        )}
        {canAct && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Note / Reason</p>
            <Input
              placeholder="Optional note for verification or rejection reason"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        )}
        {canAct && (
          <div className="flex gap-2 pt-1">
            <Button className="flex-1" disabled={isPending} onClick={handleVerify}>
              {isPending ? "Processing…" : "Verify Payment"}
            </Button>
            <Button className="flex-1" disabled={isPending} variant="destructive" onClick={handleReject}>
              Reject
            </Button>
          </div>
        )}
        {!canAct && (
          <p className="text-xs text-muted-foreground">
            Payment already processed ({row.paymentStatus}). Use bulk status controls to update if needed.
          </p>
        )}
      </div>
    </DialogContent>
  );
}

export function RegistrationsTable({
  locale,
  registrations,
}: {
  locale: string;
  registrations: RegistrationRow[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [paymentRow, setPaymentRow] = useState<RegistrationRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return registrations.filter((r) => {
      const matchesQuery =
        !q ||
        r.registrantName.toLowerCase().includes(q) ||
        r.registrantEmail.toLowerCase().includes(q) ||
        r.eventTitle.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [registrations, query, statusFilter]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((r) => next.add(r.id));
        return next;
      });
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkStatus(status: string) {
    const ids = [...selected];
    startTransition(async () => {
      const result = await bulkUpdateRegistrationStatus(ids, status, locale);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`Updated ${ids.length} registration(s) to ${status}`);
        setSelected(new Set());
      }
    });
  }

  function handleDelete(ids: string[]) {
    startTransition(async () => {
      const result = await deleteRegistrations(ids, locale);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`Deleted ${ids.length} registration(s)`);
        setSelected(new Set());
      }
    });
  }

  return (
    <>
    <Dialog open={!!paymentRow} onOpenChange={(open) => { if (!open) setPaymentRow(null); }}>
      {paymentRow && <PaymentDialog locale={locale} row={paymentRow} onClose={() => setPaymentRow(null)} />}
    </Dialog>
    <div className="grid gap-4">
      <div className="rounded-xl border border-border/70 bg-card p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_160px_auto_auto]">
          <div className="relative">
            <HugeiconsIcon
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              icon={Search01Icon}
              strokeWidth={2}
            />
            <Input
              className="h-10 pl-9"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, event..."
              value={query}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="h-10">
              <span className="text-sm">
                {statusFilter === "all"
                  ? "All statuses"
                  : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </span>
            </SelectTrigger>
            <SelectContent>
              {["all", "pending", "confirmed", "cancelled", "attended"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="h-10" onClick={() => exportCsv(filtered)} size="sm" variant="outline">
            Export CSV
          </Button>
          <button
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
            }}
            type="button"
          >
            <HugeiconsIcon className="size-3.5" icon={FilterResetIcon} strokeWidth={2} /> Reset
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
          <span className="font-medium text-foreground">{registrations.length}</span> registrations
        </p>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex gap-2">
            {["confirmed", "pending", "cancelled"].map((s) => (
              <Button disabled={isPending} key={s} onClick={() => handleBulkStatus(s)} size="sm" variant="outline">
                Mark {s}
              </Button>
            ))}
            <AlertDialog>
              <AlertDialogTrigger className={buttonVariants({ size: "sm", variant: "destructive" })} disabled={isPending}>
                Delete
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selected.size} registration(s)?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete([...selected])}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20">
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Registrant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-center text-sm text-muted-foreground" colSpan={6}>
                  No registrations found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} />
                  </TableCell>
                  <TableCell>
                    <Link
                      className="line-clamp-1 text-sm font-medium hover:text-primary"
                      href={`/${locale}/dashboard/registrations/${r.eventId}`}
                    >
                      {r.eventTitle}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{r.registrantName}</p>
                    <p className="text-xs text-muted-foreground">{r.registrantEmail}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border capitalize", statusColors[r.status] ?? "")} variant="outline">
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      className={cn(
                        "rounded px-2 py-0.5 text-[11px] font-medium capitalize transition-colors hover:bg-muted",
                        r.paymentStatus === "pending" && r.paymentMethod === "bank"
                          ? "text-yellow-600 underline underline-offset-2"
                          : "text-muted-foreground",
                      )}
                      type="button"
                      onClick={() => setPaymentRow(r)}
                    >
                      {r.paymentStatus}
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(r.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
    </>
  );
}
