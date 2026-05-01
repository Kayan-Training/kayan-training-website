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
import { createCategory, deleteCategory } from "./_actions";

export type CategoryItem = {
  id: string;
  slug: string;
  icon: string;
  color: string;
  nameEn: string;
  nameAr: string;
};

export function CategoriesManager({
  categories,
  locale,
}: {
  categories: CategoryItem[];
  locale: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ slug: "", nameEn: "", nameAr: "", icon: "", color: "" });

  function handleCreate() {
    startTransition(async () => {
      const result = await createCategory(form.slug, form.nameEn, form.nameAr, form.icon, form.color, locale);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Category created");
        setForm({ slug: "", nameEn: "", nameAr: "", icon: "", color: "" });
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCategory(id, locale);
      if (result.error) toast.error(result.error);
      else toast.success("Category deleted");
    });
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">Add Category</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="Slug (e.g. leadership)"
            value={form.slug}
          />
          <Input
            onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
            placeholder="Name (EN)"
            value={form.nameEn}
          />
          <Input
            onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
            placeholder="Name (AR)"
            value={form.nameAr}
          />
          <Input
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            placeholder="Icon (e.g. tag)"
            value={form.icon}
          />
          <Input
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            placeholder="Color (e.g. #3b82f6)"
            value={form.color}
          />
        </div>
        <Button
          className="mt-3"
          disabled={isPending || !form.slug || !form.nameEn || !form.nameAr}
          onClick={handleCreate}
          size="sm"
        >
          {isPending ? "Creating…" : "Create Category"}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((cat) => (
          <div
            className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-4"
            key={cat.id}
          >
            <div>
              <p className="text-sm font-semibold">
                {cat.nameEn} / {cat.nameAr}
              </p>
              <p className="text-xs text-muted-foreground">{cat.slug}</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger className={buttonVariants({ size: "sm", variant: "destructive" })} disabled={isPending}>
                Delete
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{cat.nameEn}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the category from all events and posts.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(cat.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>
    </div>
  );
}
