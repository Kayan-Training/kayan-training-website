"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Mail, Pencil, Plus, Trash2, UserRound } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createTrainer, deleteTrainer, fetchTrainerMediaAction, saveTrainerOrder, updateTrainer, type TrainerPayload } from "./_actions";

export type TrainerItem = {
  id: string;
  email: string;
  nameEn: string;
  nameAr: string;
  specializationEn: string;
  specializationAr: string;
  bioEn: string;
  bioAr: string;
  imageUrl: string;
  sortOrder: number;
};

type FormState = TrainerPayload;

const EMPTY_FORM: FormState = {
  email: "",
  nameEn: "",
  nameAr: "",
  specializationEn: "",
  specializationAr: "",
  bioEn: "",
  bioAr: "",
  imageUrl: "",
};

const labelCls = "mb-1.5 block text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground";
const inputCls =
  "h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm text-foreground " +
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-ring/30 transition-colors";

function TrainerForm({
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

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Email</label>
          <input
            className={inputCls}
            placeholder="trainer@kayan.com"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Profile Image</label>
        <ImagePickerField fetchMedia={fetchTrainerMediaAction} value={form.imageUrl} onChange={(v) => set("imageUrl", v)} />
      </div>

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

      {activeLocale === "en" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Name (English)</label>
            <input className={inputCls} placeholder="Full name" value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Specialization (English)</label>
            <input className={inputCls} placeholder="e.g. Leadership Coach" value={form.specializationEn} onChange={(e) => set("specializationEn", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Bio (English)</label>
            <Textarea
              className="min-h-24"
              placeholder="Short profile summary"
              value={form.bioEn}
              onChange={(e) => set("bioEn", e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Name (Arabic)</label>
            <input className={cn(inputCls, "text-right")} dir="rtl" placeholder="الاسم الكامل" value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Specialization (Arabic)</label>
            <input className={cn(inputCls, "text-right")} dir="rtl" placeholder="مثال: مدرب قيادة" value={form.specializationAr} onChange={(e) => set("specializationAr", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Bio (Arabic)</label>
            <Textarea
              className="min-h-24 text-right"
              dir="rtl"
              placeholder="نبذة قصيرة"
              value={form.bioAr}
              onChange={(e) => set("bioAr", e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button disabled={!form.nameEn.trim() || !form.nameAr.trim()} type="button" onClick={() => onSave(form)}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function TrainersManager({
  trainers,
  locale,
}: {
  trainers: TrainerItem[];
  locale: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<TrainerItem | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"nameAsc" | "specializationAsc">("nameAsc");
  const [orderedIds, setOrderedIds] = useState<string[]>(trainers.map((t) => t.id));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = trainers.filter((trainer) => {
      if (!q) return true;
      return (
        trainer.nameEn.toLowerCase().includes(q) ||
        trainer.nameAr.toLowerCase().includes(q) ||
        trainer.email.toLowerCase().includes(q) ||
        trainer.specializationEn.toLowerCase().includes(q) ||
        trainer.specializationAr.toLowerCase().includes(q)
      );
    });
    const sorted = [...list];
    if (sortBy === "specializationAsc") {
      sorted.sort((a, b) => (a.specializationEn || "zzzz").localeCompare(b.specializationEn || "zzzz"));
    } else {
      sorted.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
    }
    return sorted;
  }, [trainers, query, sortBy]);

  const orderedTrainers = useMemo(() => {
    const byId = new Map(trainers.map((trainer) => [trainer.id, trainer]));
    return orderedIds.map((id) => byId.get(id)).filter((item): item is TrainerItem => Boolean(item));
  }, [trainers, orderedIds]);

  function handleCreate(payload: TrainerPayload) {
    startTransition(async () => {
      const result = await createTrainer(payload, locale);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Trainer created");
      setAddOpen(false);
    });
  }

  function handleUpdate(id: string, payload: TrainerPayload) {
    startTransition(async () => {
      const result = await updateTrainer(id, payload, locale);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Trainer updated");
      setEditing(null);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteTrainer(id, locale);
      if (result.error) toast.error(result.error);
      else toast.success("Trainer deleted");
    });
  }

  function handleOrderDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedIds.findIndex((id) => id === active.id);
    const newIndex = orderedIds.findIndex((id) => id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setOrderedIds((prev) => arrayMove(prev, oldIndex, newIndex));
  }

  function handleSaveOrder() {
    startTransition(async () => {
      const result = await saveTrainerOrder(orderedIds, locale);
      if (result.error) toast.error(result.error);
      else toast.success("Trainer order saved.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-5 py-4">
        <div>
          <p className="text-sm font-semibold">{trainers.length} trainer{trainers.length === 1 ? "" : "s"}</p>
          <p className="text-xs text-muted-foreground">Build and maintain profile cards used in programs</p>
        </div>
        <Button className="h-10 gap-2" type="button" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          New Trainer
        </Button>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="h-10 min-w-[260px] flex-[1.6_1_320px]"
            placeholder="Search by name, email, specialization..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="w-[210px] shrink-0">
            <Select value={sortBy} onValueChange={(v) => setSortBy((v as "nameAsc" | "specializationAsc") ?? "nameAsc")}>
              <SelectTrigger className="!h-10 w-full text-xs">
                <span>{sortBy === "specializationAsc" ? "Specialization (A-Z)" : "Name (A-Z)"}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nameAsc">Name (A-Z)</SelectItem>
                <SelectItem value="specializationAsc">Specialization (A-Z)</SelectItem>
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
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Trainer Order (Drag & Drop)</p>
          <Button className="h-8 text-xs" disabled={isPending} size="sm" type="button" onClick={handleSaveOrder}>
            Save Order
          </Button>
        </div>
        <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleOrderDragEnd}>
          <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {orderedTrainers.map((trainer) => (
                <SortableOrderRow key={trainer.id} trainer={trainer} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((trainer) => (
          <div className="overflow-hidden rounded-xl border border-border/70 bg-card" key={trainer.id}>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted">
                  {trainer.imageUrl ? (
                    <Image alt={trainer.nameEn} className="object-cover" fill sizes="48px" src={trainer.imageUrl} />
                  ) : (
                    <UserRound className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{trainer.nameEn || "Unnamed Trainer"}</p>
                  <p className="truncate text-xs text-muted-foreground">{trainer.nameAr || "-"}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{trainer.specializationEn || "Trainer"}</p>
                </div>
              </div>

              {trainer.email ? (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="size-3.5" />
                  <span className="truncate">{trainer.email}</span>
                </p>
              ) : null}

              <div className="mt-3 flex items-center gap-1">
                <button
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  disabled={isPending}
                  type="button"
                  onClick={() => setEditing(trainer)}
                >
                  <Pencil className="size-3.5" />
                  Edit
                </button>
                <AlertDialog>
                  <AlertDialogTrigger
                    className={cn(buttonVariants({ size: "sm", variant: "destructive" }), "gap-1.5")}
                    disabled={isPending}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{trainer.nameEn || "this trainer"}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the profile and unlinks it from related program agenda/speaker references.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(trainer.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Trainer</DialogTitle>
          </DialogHeader>
          <TrainerForm
            onCancel={() => setAddOpen(false)}
            onSave={handleCreate}
            submitLabel={isPending ? "Creating..." : "Create Trainer"}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit - {editing?.nameEn}</DialogTitle>
          </DialogHeader>
          {editing ? (
            <TrainerForm
              initialValues={{
                email: editing.email,
                nameEn: editing.nameEn,
                nameAr: editing.nameAr,
                specializationEn: editing.specializationEn,
                specializationAr: editing.specializationAr,
                bioEn: editing.bioEn,
                bioAr: editing.bioAr,
                imageUrl: editing.imageUrl,
              }}
              onCancel={() => setEditing(null)}
              onSave={(payload) => handleUpdate(editing.id, payload)}
              submitLabel={isPending ? "Saving..." : "Save Changes"}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SortableOrderRow({ trainer }: { trainer: TrainerItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: trainer.id });

  return (
    <div
      ref={setNodeRef}
      className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        type="button"
      >
        <GripVertical className="size-4" />
      </button>
      <div className="relative size-8 overflow-hidden rounded-full bg-muted">
        {trainer.imageUrl ? (
          <Image alt={trainer.nameEn} className="object-cover" fill sizes="32px" src={trainer.imageUrl} />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UserRound className="size-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{trainer.nameEn || "Unnamed Trainer"}</p>
        <p className="truncate text-xs text-muted-foreground">{trainer.specializationEn || "Trainer"}</p>
      </div>
    </div>
  );
}
