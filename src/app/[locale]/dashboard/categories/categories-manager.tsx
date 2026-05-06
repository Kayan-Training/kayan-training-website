"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImagePickerField } from "@/components/ui/image-picker-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createCategory, deleteCategory, fetchCategoryMediaAction, updateCategory } from "./_actions";

const PROFILE_ICONS: Array<{ slug: string; label: string; path: string }> = [
  { slug: "continuous-improvement", label: "Continuous Improvement", path: "/icons/kayan_profile_NEW.svg" },
  { slug: "economy", label: "Economy", path: "/icons/kayan_profile_Economy.svg" },
  { slug: "education-psychology", label: "Education & Psychology", path: "/icons/kayan_profile_Education & Psychology.svg" },
  { slug: "lifestyle", label: "Lifestyle", path: "/icons/kayan_profile_Lifestyle.svg" },
  { slug: "management-leadership", label: "Management & Leadership", path: "/icons/kayan_profile_Management & Leadership.svg" },
  { slug: "media-communication", label: "Media & Communication", path: "/icons/kayan_profile_Media & Communication.svg" },
  { slug: "tech", label: "Tech", path: "/icons/kayan_profile_Tech.svg" },
];

export type CategoryItem = {
  id: string;
  slug: string;
  icon: string;
  color: string;
  image: string;
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
};

type FormState = {
  slug: string;
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  icon: string;
  color: string;
  image: string;
};

const EMPTY_FORM: FormState = {
  slug: "",
  nameEn: "",
  nameAr: "",
  descEn: "",
  descAr: "",
  icon: "",
  color: "#28b473",
  image: "",
};

const inputCls =
  "h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm text-foreground " +
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-ring/30 transition-colors";

const labelCls = "mb-1.5 block text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground";

function CategoryForm({
  initialValues,
  onCancel,
  onSave,
  submitLabel,
}: {
  initialValues?: FormState;
  onCancel?: () => void;
  onSave: (v: FormState) => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<FormState>(initialValues ?? EMPTY_FORM);
  const [activeLocale, setActiveLocale] = useState<"en" | "ar">("en");

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="space-y-5">
      {/* Locale toggle */}
      <div className="flex items-center gap-3">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Language:</span>
        <div className="flex overflow-hidden rounded-md border border-border/70">
          {(["en", "ar"] as const).map((loc) => (
            <button
              className={cn(
                "px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                activeLocale === loc
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
              key={loc}
              type="button"
              onClick={() => setActiveLocale(loc)}
            >
              {loc.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Slug</label>
          <input
            className={inputCls}
            placeholder="e.g. management-leadership"
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
          />
        </div>
        {activeLocale === "en" ? (
          <>
            <div>
              <label className={labelCls}>Name (English)</label>
              <input className={inputCls} placeholder="Category name" value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description (English)</label>
              <input className={inputCls} placeholder="Short description" value={form.descEn} onChange={(e) => set("descEn", e.target.value)} />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className={labelCls}>Name (Arabic)</label>
              <input className={cn(inputCls, "text-right")} dir="rtl" placeholder="اسم التصنيف" value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description (Arabic)</label>
              <input className={cn(inputCls, "text-right")} dir="rtl" placeholder="وصف قصير" value={form.descAr} onChange={(e) => set("descAr", e.target.value)} />
            </div>
          </>
        )}
      </div>

      {/* Cover image */}
      <div>
        <label className={labelCls}>Cover Image</label>
        <ImagePickerField
          fetchMedia={fetchCategoryMediaAction}
          value={form.image}
          onChange={(v) => set("image", v)}
        />
      </div>

      {/* Color */}
      <div>
        <label className={labelCls}>Accent Color</label>
        <div className="flex items-center gap-3">
          <input
            aria-label="Category color"
            className="h-9 w-14 cursor-pointer rounded-md border border-border/70 p-1"
            title="Category color"
            type="color"
            value={form.color}
            onChange={(e) => set("color", e.target.value)}
          />
          <span className="font-mono text-sm text-muted-foreground">{form.color}</span>
        </div>
      </div>

      {/* Icon — original colors; selected = colored ring + bg tint */}
      <div>
        <label className={labelCls}>Icon</label>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {PROFILE_ICONS.map((icon) => {
            const selected = form.icon === icon.slug;
            return (
              <button
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-all",
                  selected
                    ? "border-2 shadow-sm"
                    : "border-border/60 bg-muted/30 hover:border-border hover:bg-muted",
                )}
                key={icon.slug}
                style={selected ? { borderColor: form.color, backgroundColor: form.color + "18" } : undefined}
                title={icon.label}
                type="button"
                onClick={() => set("icon", icon.slug)}
              >
                <div className="flex size-8 items-center justify-center rounded-md">
                  <Image
                    alt={icon.label}
                    height={24}
                    src={icon.path}
                    width={24}
                  />
                </div>
                <span className="w-full truncate text-center text-[9px] text-muted-foreground">
                  {icon.label.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          disabled={!form.slug || !form.nameEn || !form.nameAr}
          type="button"
          onClick={() => onSave(form)}
        >
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

export function CategoriesManager({
  categories,
  locale,
}: {
  categories: CategoryItem[];
  locale: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"nameAsc" | "slugAsc">("nameAsc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = categories.filter((cat) => {
      if (!q) return true;
      return (
        cat.nameEn.toLowerCase().includes(q) ||
        cat.nameAr.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q)
      );
    });
    const sorted = [...list];
    if (sortBy === "slugAsc") sorted.sort((a, b) => a.slug.localeCompare(b.slug));
    else sorted.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
    return sorted;
  }, [categories, query, sortBy]);

  function handleCreate(form: FormState) {
    startTransition(async () => {
      const result = await createCategory(
        form.slug, form.nameEn, form.nameAr, form.descEn, form.descAr,
        form.icon, form.color, form.image, locale,
      );
      if (result.error) toast.error(result.error);
      else {
        toast.success("Category created");
        setAddOpen(false);
      }
    });
  }

  function handleUpdate(id: string, form: FormState) {
    startTransition(async () => {
      const result = await updateCategory(
        id, form.slug, form.nameEn, form.nameAr, form.descEn, form.descAr,
        form.icon, form.color, form.image, locale,
      );
      if (result.error) toast.error(result.error);
      else {
        toast.success("Category updated");
        setEditingCat(null);
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
    <div className="space-y-4">
      {/* Header + Add button */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-5 py-4">
        <div>
          <p className="text-sm font-semibold">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"}
          </p>
          <p className="text-xs text-muted-foreground">Manage training domain categories</p>
        </div>
        <Button className="h-10 gap-2" type="button" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          New Category
        </Button>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="h-10 min-w-[260px] flex-[1.6_1_320px]"
            placeholder="Search by name or slug..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="w-[170px] shrink-0">
            <Select value={sortBy} onValueChange={(v) => setSortBy((v as "nameAsc" | "slugAsc") ?? "nameAsc")}>
              <SelectTrigger className="!h-10 w-full text-xs">
                <span>{sortBy === "slugAsc" ? "Slug (A-Z)" : "Name (A-Z)"}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nameAsc">Name (A-Z)</SelectItem>
                <SelectItem value="slugAsc">Slug (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="h-10 shrink-0 text-xs"
            type="button"
            variant="outline"
            onClick={() => {
              setQuery("");
              setSortBy("nameAsc");
            }}
          >
            Reset
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
          <span className="font-medium text-foreground">{categories.length}</span> categories
        </p>
      </div>

      {/* Category list */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((cat) => {
          const iconObj = PROFILE_ICONS.find((i) => i.slug === cat.icon);
          return (
            <div
              className="overflow-hidden rounded-xl border border-border/70 bg-card"
              key={cat.id}
            >
              {/* Cover image strip */}
              {cat.image && (
                <div className="relative h-24 w-full bg-muted">
                  <Image
                    alt={cat.nameEn}
                    className="h-full w-full object-cover"
                    fill
                    sizes="(max-width: 1280px) 50vw, 33vw"
                    src={cat.image}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                </div>
              )}

              <div className="flex items-center gap-3 p-4">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: cat.color + "22", border: `1px solid ${cat.color}44` }}
                >
                  {iconObj ? (
                    <Image alt={cat.nameEn} height={22} src={iconObj.path} width={22} />
                  ) : (
                    <span className="size-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{cat.nameEn}</p>
                  <p className="truncate text-xs text-muted-foreground">{cat.nameAr} · {cat.slug}</p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    disabled={isPending}
                    type="button"
                    onClick={() => setEditingCat(cat)}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      className={cn(
                        buttonVariants({ size: "sm", variant: "destructive" }),
                        "gap-1.5",
                      )}
                      disabled={isPending}
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete &ldquo;{cat.nameEn}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Removes this category from all events and posts.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(cat.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <CategoryForm
            onCancel={() => setAddOpen(false)}
            onSave={handleCreate}
            submitLabel={isPending ? "Creating…" : "Create Category"}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingCat} onOpenChange={(open) => { if (!open) setEditingCat(null); }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit — {editingCat?.nameEn}</DialogTitle>
          </DialogHeader>
          {editingCat && (
            <CategoryForm
              initialValues={{
                slug: editingCat.slug,
                nameEn: editingCat.nameEn,
                nameAr: editingCat.nameAr,
                descEn: editingCat.descEn,
                descAr: editingCat.descAr,
                icon: editingCat.icon,
                color: editingCat.color,
                image: editingCat.image,
              }}
              onCancel={() => setEditingCat(null)}
              onSave={(form) => handleUpdate(editingCat.id, form)}
              submitLabel={isPending ? "Saving…" : "Save Changes"}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
