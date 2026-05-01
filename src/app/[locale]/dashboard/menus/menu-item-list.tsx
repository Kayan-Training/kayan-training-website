"use client";

import { useState, useTransition } from "react";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createMenuItem, deleteMenuItem } from "./_actions";

export type MenuItemRow = {
  id: string;
  url: string | null;
  labelEn: string;
  labelAr: string;
  order: number;
};

export function MenuItemList({
  items,
  locale,
  menuId,
}: {
  items: MenuItemRow[];
  locale: string;
  menuId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ url: "", labelEn: "", labelAr: "" });

  function handleCreate() {
    startTransition(async () => {
      const result = await createMenuItem(menuId, form.url, form.labelEn, form.labelAr, items.length, locale);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Item added");
        setForm({ url: "", labelEn: "", labelAr: "" });
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteMenuItem(id, locale);
      if (result.error) toast.error(result.error);
      else toast.success("Item removed");
    });
  }

  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="mb-4 space-y-2">
        {items.map((item) => (
          <div
            className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/10 px-3 py-2"
            key={item.id}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {item.labelEn} / {item.labelAr}
              </p>
              <p className="text-xs text-muted-foreground">{item.url}</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger className={buttonVariants({ size: "sm", variant: "destructive" })} disabled={isPending}>
                Remove
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove "{item.labelEn}"?</AlertDialogTitle>
                  <AlertDialogDescription>This link will be removed from the menu.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(item.id)}>Remove</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">No items yet.</p>}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          onChange={(e) => setForm((f) => ({ ...f, labelEn: e.target.value }))}
          placeholder="Label (EN)"
          value={form.labelEn}
        />
        <Input
          onChange={(e) => setForm((f) => ({ ...f, labelAr: e.target.value }))}
          placeholder="Label (AR)"
          value={form.labelAr}
        />
        <Input
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
          placeholder="URL (e.g. /en/about)"
          value={form.url}
        />
      </div>
      <Button
        className="mt-3"
        disabled={isPending || !form.url || !form.labelEn || !form.labelAr}
        onClick={handleCreate}
        size="sm"
      >
        Add Item
      </Button>
    </div>
  );
}
