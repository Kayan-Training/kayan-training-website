"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Pencil, Trash2, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  type LinkPickerEntities,
  LinkPickerInput,
} from "@/components/ui/link-picker-input";
import { cn } from "@/lib/utils";
import {
  createMenuItem,
  deleteMenuItem,
  reorderMenuItems,
  updateMenuItem,
} from "./_actions";

export type MenuItemRow = {
  id: string;
  type: string;
  url: string | null;
  targetId: string | null;
  labelEn: string;
  labelAr: string;
  order: number;
};

export type EntityOption = { id: string; label: string; url: string };

type LinkType = "link" | "page" | "post" | "event";

const inputCls =
  "h-9 w-full rounded-md border border-border/70 bg-card px-3 text-sm text-foreground " +
  "placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors";

const TYPE_LABELS: Record<LinkType, string> = {
  link: "Manual URL",
  page: "Page",
  post: "Post",
  event: "Event",
};

const TYPE_COLORS: Record<string, string> = {
  link: "border-border bg-muted text-muted-foreground",
  page: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  post: "border-purple-500/30 bg-purple-500/10 text-purple-600",
  event: "border-amber-500/30 bg-amber-500/10 text-amber-600",
};

function resolveDisplayUrl(
  item: MenuItemRow,
  entities: {
    pages: EntityOption[];
    posts: EntityOption[];
    events: EntityOption[];
  },
): string {
  if (item.type === "link") return item.url ?? "";
  const list =
    item.type === "page"
      ? entities.pages
      : item.type === "post"
        ? entities.posts
        : entities.events;
  return list.find((e) => e.id === item.targetId)?.url ?? item.targetId ?? "";
}

function toPickerEntities(entities: {
  pages: EntityOption[];
  posts: EntityOption[];
  events: EntityOption[];
}): LinkPickerEntities {
  return entities;
}

function findTargetId(
  type: LinkType,
  url: string,
  entities: {
    pages: EntityOption[];
    posts: EntityOption[];
    events: EntityOption[];
  },
): string | null {
  const list =
    type === "page"
      ? entities.pages
      : type === "post"
        ? entities.posts
        : entities.events;
  return list.find((e) => e.url === url)?.id ?? null;
}

// ─── Sortable item row ────────────────────────────────────────────────────────

function SortableItemRow({
  item,
  entities,
  locale,
  isPending,
  onDelete,
  onSave,
}: {
  item: MenuItemRow;
  entities: {
    pages: EntityOption[];
    posts: EntityOption[];
    events: EntityOption[];
  };
  locale: string;
  isPending: boolean;
  onDelete: (id: string) => void;
  onSave: (
    id: string,
    type: LinkType,
    labelEn: string,
    labelAr: string,
    url: string | null,
    targetId: string | null,
  ) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [editing, setEditing] = useState(false);
  const [editType, setEditType] = useState<LinkType>(item.type as LinkType);
  const [editLabelEn, setEditLabelEn] = useState(item.labelEn);
  const [editLabelAr, setEditLabelAr] = useState(item.labelAr);
  const [editUrl, setEditUrl] = useState(resolveDisplayUrl(item, entities));

  function handleSave() {
    const isLink = editType === "link";
    onSave(
      item.id,
      editType,
      editLabelEn,
      editLabelAr,
      isLink ? editUrl : null,
      isLink ? null : findTargetId(editType, editUrl, entities),
    );
    setEditing(false);
  }

  function handleCancel() {
    setEditing(false);
    setEditType(item.type as LinkType);
    setEditLabelEn(item.labelEn);
    setEditLabelAr(item.labelAr);
    setEditUrl(resolveDisplayUrl(item, entities));
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b border-border/50 last:border-0",
        isDragging && "opacity-50 z-50",
      )}
    >
      {!editing ? (
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            className="cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground"
            type="button"
          >
            <GripVertical className="size-4 shrink-0" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {item.labelEn}
              <span className="mx-1.5 text-muted-foreground">/</span>
              {item.labelAr}
            </p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {resolveDisplayUrl(item, entities)}
            </p>
          </div>
          <Badge
            className={cn(
              "border capitalize",
              TYPE_COLORS[item.type] ?? TYPE_COLORS.link,
            )}
            variant="outline"
          >
            {item.type}
          </Badge>
          <button
            aria-label="Edit item"
            className="text-muted-foreground hover:text-foreground"
            title="Edit"
            type="button"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-3.5" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <button
                  aria-label="Remove item"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={isPending}
                  title="Remove"
                  type="button"
                >
                  <Trash2 className="size-3.5" />
                </button>
              }
            ></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Remove &ldquo;{item.labelEn}&rdquo;?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This link will be removed from the menu permanently.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(item.id)}>
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <div className="space-y-3 bg-muted/20 px-4 py-4">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(TYPE_LABELS) as LinkType[]).map((t) => (
              <button
                className={cn(
                  "rounded-md px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                  editType === t
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/70 bg-card text-muted-foreground hover:bg-muted/40",
                )}
                key={t}
                type="button"
                onClick={() => {
                  setEditType(t);
                  setEditUrl("");
                }}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Label (EN)
              </label>
              <input
                className={inputCls}
                placeholder="Label (English)"
                title="Label (English)"
                value={editLabelEn}
                onChange={(e) => setEditLabelEn(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Label (AR)
              </label>
              <input
                className={cn(inputCls, "text-right")}
                dir="rtl"
                placeholder="التسمية بالعربية"
                title="Label (Arabic)"
                value={editLabelAr}
                onChange={(e) => setEditLabelAr(e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {editType === "link" ? "URL" : "Target"}
              </label>
              <LinkPickerInput
                entities={toPickerEntities(entities)}
                placeholder={
                  editType === "link" ? "/en/page-slug" : "Search or paste URL…"
                }
                value={editUrl}
                onChange={setEditUrl}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              disabled={isPending}
              type="button"
              onClick={handleSave}
            >
              <Check className="size-3" />
              Save
            </button>
            <button
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/70 bg-card px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
              type="button"
              onClick={handleCancel}
            >
              <X className="size-3" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MenuItemList({
  entities,
  items: initialItems,
  locale,
  menuId,
}: {
  entities: {
    events: EntityOption[];
    pages: EntityOption[];
    posts: EntityOption[];
  };
  items: MenuItemRow[];
  locale: string;
  menuId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<MenuItemRow[]>(initialItems);

  const [linkType, setLinkType] = useState<LinkType>("link");
  const [labelEn, setLabelEn] = useState("");
  const [labelAr, setLabelAr] = useState("");
  const [url, setUrl] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      startTransition(async () => {
        const result = await reorderMenuItems(
          next.map((i) => i.id),
          locale,
        );
        if (result.error) toast.error(result.error);
      });
      return next;
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteMenuItem(id, locale);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Item removed.");
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    });
  }

  function handleSave(
    id: string,
    type: LinkType,
    lEn: string,
    lAr: string,
    itemUrl: string | null,
    targetId: string | null,
  ) {
    startTransition(async () => {
      const result = await updateMenuItem(
        id,
        type,
        lEn,
        lAr,
        itemUrl,
        targetId,
        locale,
      );
      if (result.error) toast.error(result.error);
      else {
        toast.success("Item updated.");
        setItems((prev) =>
          prev.map((i) =>
            i.id === id
              ? {
                  ...i,
                  type,
                  labelEn: lEn,
                  labelAr: lAr,
                  url: itemUrl,
                  targetId,
                }
              : i,
          ),
        );
      }
    });
  }

  function handleCreate() {
    const isLink = linkType === "link";
    startTransition(async () => {
      const result = await createMenuItem(
        menuId,
        linkType,
        labelEn,
        labelAr,
        isLink ? url : null,
        isLink ? null : findTargetId(linkType, url, entities),
        items.length,
        locale,
      );
      if (result.error) toast.error(result.error);
      else if (result.item) {
        toast.success("Item added.");
        setItems((prev) => [...prev, result.item!]);
        setLabelEn("");
        setLabelAr("");
        setUrl("");
      }
    });
  }

  const isValid = !!labelEn && !!labelAr && !!url;

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        sensors={sensors}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div>
            {items.length === 0 && (
              <p className="px-5 py-4 text-sm text-muted-foreground">
                No items yet — add one below.
              </p>
            )}
            {items.map((item) => (
              <SortableItemRow
                entities={entities}
                isPending={isPending}
                item={item}
                key={item.id}
                locale={locale}
                onDelete={handleDelete}
                onSave={handleSave}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add item form */}
      <div className="border-t border-border/50 p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Add Item
        </p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(Object.keys(TYPE_LABELS) as LinkType[]).map((t) => (
            <button
              className={cn(
                "rounded-md px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                linkType === t
                  ? "bg-primary text-primary-foreground"
                  : "border border-border/70 bg-card text-muted-foreground hover:bg-muted/40",
              )}
              key={t}
              type="button"
              onClick={() => {
                setLinkType(t);
                setUrl("");
              }}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Label (EN)
            </label>
            <input
              className={inputCls}
              placeholder="Label (English)"
              title="Label (English)"
              value={labelEn}
              onChange={(e) => setLabelEn(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Label (AR)
            </label>
            <input
              className={cn(inputCls, "text-right")}
              dir="rtl"
              placeholder="التسمية بالعربية"
              title="Label (Arabic)"
              value={labelAr}
              onChange={(e) => setLabelAr(e.target.value)}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {linkType === "link" ? "URL" : "Target"}
            </label>
            <LinkPickerInput
              entities={toPickerEntities(entities)}
              placeholder={
                linkType === "link" ? "/en/page-slug" : "Search or paste URL…"
              }
              value={url}
              onChange={setUrl}
            />
          </div>
        </div>
        <button
          className="mt-3 inline-flex h-9 items-center rounded-md bg-primary px-4 text-xs font-medium uppercase tracking-widest text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          disabled={isPending || !isValid}
          type="button"
          onClick={handleCreate}
        >
          {isPending ? "Adding…" : "Add Item"}
        </button>
      </div>
    </div>
  );
}
