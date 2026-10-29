"use client";

/**
 * Edits event-local bilingual groups using shared person profiles.
 * One drag context handles group ordering, member ordering and cross-group moves.
 * The parent form owns persistence and dirty state; buttons provide drag alternatives.
 */

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import {
  ChevronDown,
  MoreHorizontal,
  ArrowRight,
  UserRound,
  ArrowDown,
  ArrowUp,
  GripVertical,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PersonAvatar } from "@/components/dashboard/person-avatar";
import { PeoplePicker } from "@/components/dashboard/people-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

import {
  addPersonToGroup,
  groupName,
  movePerson,
  type PeopleGroup,
  type PeopleOption,
} from "@/lib/events/people-groups";
import { cn } from "@/lib/utils";

type Props = {
  groups: PeopleGroup[];
  people: PeopleOption[];
  locale: "en" | "ar";
  onChange: (groups: PeopleGroup[]) => void;
  disabled?: boolean;
  error?: string;
};
const memberKey = (groupId: string, personId: string) =>
  JSON.stringify([groupId, personId]);
const groupKey = (id: string) => `group:${id}`;
const hitClass = "min-h-10 min-w-10";

// Group drags only collide with groups. Member drags prefer a row over its enclosing drop zone.
const collisionDetection: CollisionDetection = (args) => {
  const kind = args.active.data.current?.kind;
  const droppableContainers = args.droppableContainers.filter((item) =>
    kind === "group"
      ? item.data.current?.kind === "group"
      : item.data.current?.kind !== "group",
  );
  const filtered = { ...args, droppableContainers };
  const hits = pointerWithin(filtered);
  if (hits.length) {
    const member = hits.find(
      (hit) =>
        droppableContainers.find((item) => item.id === hit.id)?.data.current
          ?.kind === "member",
    );
    return member ? [member] : hits;
  }
  // A pointer released outside the editor must not move anything. Keyboard drags use geometry.
  return args.pointerCoordinates ? [] : closestCenter(filtered);
};

// Nested group/member targets need the same filtering for keyboard geometry as pointer collisions.
const keyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
  const groupDrag = args.context.active?.data.current?.kind === "group";
  const droppableRects = new Map(
    [...args.context.droppableRects].filter(([id]) => {
      const data = args.context.droppableContainers.get(id)?.data.current;
      return groupDrag
        ? data?.kind === "group"
        : data?.kind === "member" || (data?.kind === "drop" && data.empty);
    }),
  );
  return sortableKeyboardCoordinates(event, {
    ...args,
    context: { ...args.context, droppableRects },
  });
};

export function PeopleGroupsEditor({
  groups,
  people,
  locale,
  onChange,
  disabled,
  error,
}: Props) {
  const dndId = useId();
  const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null);
  useEffect(() => setOverlayRoot(document.body), []);
  const ar = locale === "ar";
  const [removing, setRemoving] = useState<string | null>(null);
  const [dragLabel, setDragLabel] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: keyboardCoordinates,
    }),
  );
  const label = (group: PeopleGroup) =>
    groupName(group, locale) || (ar ? "مجموعة جديدة" : "New group");
  const name = (person: PeopleOption) =>
    ar ? person.labelAr || person.label : person.label;

  function change(next: PeopleGroup[], message: string) {
    onChange(next);
    setAnnouncement(message);
  }
  function reorderGroup(id: string, offset: number) {
    const from = groups.findIndex((group) => group.id === id);
    const to = from + offset;
    if (from >= 0 && to >= 0 && to < groups.length)
      change(
        arrayMove(groups, from, to),
        ar ? "تم تغيير ترتيب المجموعات" : "Group order updated",
      );
  }
  function move(
    source: string,
    target: string,
    person: string,
    index?: number,
  ) {
    change(
      movePerson(groups, source, target, person, index),
      ar ? "تم نقل الشخص" : "Person moved",
    );
  }
  function addToGroup(source: string, target: string, person: string) {
    change(
      addPersonToGroup(groups, source, target, person),
      ar ? "تمت إضافة الشخص إلى المجموعة" : "Person added to group",
    );
  }
  function onDragEnd({ active, over }: DragEndEvent) {
    setDragLabel(null);
    if (!over || active.id === over.id) return;
    const source = active.data.current;
    const target = over.data.current;
    if (source?.kind === "group" && target?.kind === "group") {
      const from = groups.findIndex((group) => group.id === source.groupId);
      const to = groups.findIndex((group) => group.id === target.groupId);
      if (from >= 0 && to >= 0)
        change(
          arrayMove(groups, from, to),
          ar ? "تم تغيير ترتيب المجموعات" : "Group order updated",
        );
    } else if (source?.kind === "member" && target?.groupId) {
      const targetGroup = groups.find((group) => group.id === target.groupId);
      const index =
        target.kind === "member"
          ? targetGroup?.memberIds.indexOf(target.personId)
          : undefined;
      move(source.groupId, target.groupId, source.personId, index);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-5" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">
          {ar
            ? "أنشئ مجموعة وسمّها بكل لغة، ثم أضف الأشخاص. اسحب المقابض لتغيير الترتيب أو نقل الأشخاص بين المجموعات."
            : "Create a group, name it in each language, then add people. Drag handles to change the order or move people between groups."}
        </p>
        <Button
          className={hitClass}
          disabled={disabled || groups.length >= 50}
          type="button"
          variant="outline"
          onClick={() =>
            change(
              [
                ...groups,
                {
                  id: crypto.randomUUID(),
                  nameEn: "",
                  nameAr: "",
                  memberIds: [],
                },
              ],
              ar ? "تمت إضافة مجموعة" : "Group added",
            )
          }
        >
          <Plus data-icon="inline-start" />
          {ar ? "إضافة مجموعة" : "Add group"}
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={collisionDetection}
        measuring={{ droppable: { strategy: MeasuringStrategy.WhileDragging } }}
        onDragStart={({ active }) =>
          setDragLabel(active.data.current?.label ?? "")
        }
        onDragCancel={() => setDragLabel(null)}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={groups.map((group) => groupKey(group.id))}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-4">
            {groups.map((group, index) => (
              <GroupCard
                key={group.id}
                group={group}
                index={index}
                total={groups.length}
                groups={groups}
                people={people}
                locale={locale}
                invalid={Boolean(
                  error && !group.nameEn.trim() && !group.nameAr.trim(),
                )}
                disabled={disabled}
                label={label(group)}
                personName={name}
                onChange={(next) =>
                  onChange(
                    groups.map((entry) =>
                      entry.id === group.id ? next : entry,
                    ),
                  )
                }
                onRemove={() =>
                  group.memberIds.length
                    ? setRemoving(group.id)
                    : change(
                        groups.filter((entry) => entry.id !== group.id),
                        ar ? "تم حذف المجموعة" : "Group removed",
                      )
                }
                onReorder={(offset) => reorderGroup(group.id, offset)}
                onMove={move}
                onAddToGroup={addToGroup}
              />
            ))}
          </div>
        </SortableContext>
        {/* Fixed overlays must escape the editor's transformed/scrolling ancestors. */}
        {overlayRoot
          ? createPortal(
              <DragOverlay
                adjustScale={false}
                dropAnimation={null}
                modifiers={[snapCenterToCursor]}
                className="dashboard-theme text-foreground"
                style={{ width: "max-content", maxWidth: "calc(100vw - 24px)" }}
              >
                {dragLabel ? (
                  <div
                    dir={ar ? "rtl" : "ltr"}
                    className="max-w-xs truncate rounded-lg border bg-background px-4 py-3 text-sm font-medium shadow-lg"
                  >
                    {dragLabel}
                  </div>
                ) : null}
              </DragOverlay>,
              overlayRoot,
            )
          : null}
      </DndContext>
      {!groups.length ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          <Users className="size-7" />
          <p className="text-sm">
            {ar
              ? "لا توجد مجموعات بعد. أضف مجموعة ثم اختر أشخاصًا من الدليل."
              : "No groups yet. Add a group, then choose people from the directory."}
          </p>
        </div>
      ) : null}
      <Dialog
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <DialogContent
          className="dashboard-theme text-foreground"
          dir={ar ? "rtl" : "ltr"}
        >
          <DialogHeader>
            <DialogTitle>{ar ? "حذف المجموعة؟" : "Remove group?"}</DialogTitle>
            <DialogDescription>
              {ar
                ? "ستُحذف هذه المجموعة وعضوياتها من هذا البرنامج أو الفعالية. ستبقى الملفات الشخصية والعضويات في المجموعات الأخرى."
                : "This removes the group and its memberships from this program/event. Profiles and memberships in other groups stay available."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className={hitClass}
              type="button"
              variant="outline"
              onClick={() => setRemoving(null)}
            >
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              className={hitClass}
              type="button"
              variant="destructive"
              onClick={() => {
                change(
                  groups.filter((group) => group.id !== removing),
                  ar ? "تم حذف المجموعة" : "Group removed",
                );
                setRemoving(null);
              }}
            >
              {ar ? "حذف المجموعة" : "Remove group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type GroupProps = {
  onAddToGroup: (source: string, target: string, person: string) => void;
  invalid?: boolean;
  group: PeopleGroup;
  index: number;
  total: number;
  groups: PeopleGroup[];
  people: PeopleOption[];
  locale: "en" | "ar";
  disabled?: boolean;
  label: string;
  personName: (person: PeopleOption) => string;
  onChange: (group: PeopleGroup) => void;
  onRemove: () => void;
  onReorder: (offset: number) => void;
  onMove: (
    source: string,
    target: string,
    person: string,
    index?: number,
  ) => void;
};
function GroupCard({
  onAddToGroup,
  invalid,
  group,
  index,
  total,
  groups,
  people,
  locale,
  disabled,
  label,
  personName,
  onChange,
  onRemove,
  onReorder,
  onMove,
}: GroupProps) {
  const reducedMotion = useReducedMotion();
  const ar = locale === "ar";
  const inputId = useId();
  const bodyId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!group.nameEn && !group.nameAr) nameRef.current?.focus();
  }, []);
  const [collapsed, setCollapsed] = useState(
    index > 0 && Boolean(group.nameEn || group.nameAr),
  );
  const expanded = !collapsed || Boolean(invalid);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: groupKey(group.id),
    data: { kind: "group", groupId: group.id, label },
    disabled,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop:${group.id}`,
    data: {
      kind: "drop",
      groupId: group.id,
      empty: !expanded || group.memberIds.length === 0,
    },
    disabled,
  });
  const alternateName = ar ? group.nameEn : group.nameAr;
  const members = group.memberIds.flatMap((id) => {
    const person = people.find((entry) => entry.value === id);
    return person ? [person] : [];
  });
  const countLabel = ar
    ? `${members.length} أشخاص`
    : `${members.length} ${members.length === 1 ? "person" : "people"}`;
  return (
    <section
      aria-label={label}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: reducedMotion ? undefined : transition,
        opacity: isDragging ? 0.3 : 1,
      }}
      className={cn(
        "@container min-w-0 overflow-visible border bg-card",
        isOver && "border-primary ring-2 ring-primary/15",
      )}
    >
      <div
        ref={!expanded ? setDropRef : undefined}
        className={cn(
          "flex flex-wrap items-center gap-1 px-3 py-3 sm:gap-2 sm:px-4",
          expanded && "border-b",
          isOver && !expanded && "bg-primary/5",
        )}
      >
        <Button
          className={cn(
            hitClass,
            "touch-none cursor-grab text-muted-foreground active:cursor-grabbing",
          )}
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          {...attributes}
          {...listeners}
          aria-label={`${ar ? "سحب المجموعة" : "Drag group"}: ${label}`}
        >
          <GripVertical />
        </Button>
        <button
          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-md px-1 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring"
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          aria-label={`${expanded ? (ar ? "طي المجموعة" : "Collapse group") : ar ? "توسيع المجموعة" : "Expand group"}: ${label}`}
          onClick={() => setCollapsed(expanded)}
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none",
              !expanded && (ar ? "rotate-90" : "-rotate-90"),
            )}
          />
          <span className="min-w-0 flex-1">
            <span className="block break-words text-sm font-semibold">
              <bdi>{label}</bdi>
            </span>
            {alternateName ? (
              <span
                className="mt-0.5 block truncate text-xs text-muted-foreground"
                title={alternateName}
              >
                <bdi>{alternateName}</bdi>
              </span>
            ) : null}
          </span>
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs tabular-nums text-muted-foreground">
            {countLabel}
          </span>
        </button>
        <div className="ms-auto flex w-full shrink-0 items-center justify-end gap-1 @[480px]:w-auto">
          <PeoplePicker
            people={people}
            selectedIds={group.memberIds}
            locale={locale}
            groupLabel={label}
            disabled={disabled}
            onAdd={(id) => {
              onChange({ ...group, memberIds: [...group.memberIds, id] });
              setCollapsed(false);
            }}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  className={hitClass}
                  variant="ghost"
                  size="icon"
                  type="button"
                  disabled={disabled}
                  aria-label={`${ar ? "خيارات المجموعة" : "Group actions"}: ${label}`}
                />
              }
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="dashboard-theme w-52"
              align="end"
              dir={ar ? "rtl" : "ltr"}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="min-h-10"
                  disabled={index === 0}
                  onClick={() => onReorder(-1)}
                >
                  <ArrowUp />
                  {ar ? "رفع المجموعة" : "Move group up"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="min-h-10"
                  disabled={index === total - 1}
                  onClick={() => onReorder(1)}
                >
                  <ArrowDown />
                  {ar ? "خفض المجموعة" : "Move group down"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="min-h-10"
                  variant="destructive"
                  onClick={onRemove}
                >
                  <Trash2 />
                  {ar ? "حذف المجموعة" : "Remove group"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div
        id={bodyId}
        aria-hidden={!expanded}
        inert={!expanded}
        className="grid transition-[grid-template-rows,opacity] duration-250 ease-out motion-reduce:transition-none"
        style={{
          gridTemplateRows: expanded ? "1fr" : "0fr",
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-wrap items-end gap-3 bg-muted/20 px-4 py-4 sm:px-5">
            <div className="min-w-0 flex-1 basis-full @[480px]:basis-48">
              <Label
                htmlFor={inputId}
                className="text-xs text-muted-foreground"
              >
                {ar ? "اسم المجموعة" : "Group name"} · {locale.toUpperCase()}
              </Label>
              <Input
                id={inputId}
                ref={nameRef}
                aria-invalid={invalid}
                className="mt-1.5 min-h-10 bg-card"
                maxLength={200}
                value={ar ? group.nameAr : group.nameEn}
                disabled={disabled}
                placeholder={ar ? "مثلًا: المتحدثون" : "e.g. Speakers"}
                onChange={(event) =>
                  onChange({
                    ...group,
                    [ar ? "nameAr" : "nameEn"]: event.target.value,
                  })
                }
              />
            </div>
            <p className="w-full max-w-sm text-xs leading-relaxed text-muted-foreground @[480px]:w-auto @[480px]:max-w-52">
              {ar
                ? "غيّر اللغة لإضافة الاسم الآخر."
                : "Switch the content language to edit the other name."}
            </p>
          </div>
          <div
            ref={expanded ? setDropRef : undefined}
            className={cn(
              "min-h-24 px-3 pb-3 sm:px-4 sm:pb-4",
              isOver && "bg-primary/5",
            )}
          >
            <SortableContext
              items={group.memberIds.map((id) => memberKey(group.id, id))}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-border/70">
                {members.map((person, memberIndex) => (
                  <MemberRow
                    key={person.value}
                    person={person}
                    name={personName(person)}
                    group={group}
                    groups={groups}
                    locale={locale}
                    disabled={disabled || !expanded}
                    index={memberIndex}
                    onMove={onMove}
                    onAddToGroup={onAddToGroup}
                    onRemove={() =>
                      onChange({
                        ...group,
                        memberIds: group.memberIds.filter(
                          (id) => id !== person.value,
                        ),
                      })
                    }
                  />
                ))}
              </div>
            </SortableContext>
            {!members.length ? (
              <div
                className={cn(
                  "mt-1 flex min-h-32 flex-col items-center justify-center gap-2 border border-dashed px-5 py-6 text-center",
                  isOver && "border-primary",
                )}
              >
                <UserRound className="size-6 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {ar ? "أضف أول شخص" : "Add the first person"}
                </p>
                <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                  {ar
                    ? "استخدم «إضافة أشخاص» أو اسحب شخصًا من مجموعة أخرى. المجموعات الفارغة لا تظهر في الموقع."
                    : "Choose Add people or drag someone from another group. Empty groups stay hidden on the website."}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {!expanded && isOver ? (
        <p
          className="border-t border-dashed border-primary px-5 py-3 text-sm text-primary"
          role="status"
        >
          {ar
            ? "أفلت لإضافة الشخص إلى هذه المجموعة"
            : "Drop to move this person into this group"}
        </p>
      ) : null}
    </section>
  );
}

function MemberRow({
  onAddToGroup,
  person,
  name,
  group,
  groups,
  locale,
  disabled,
  index,
  onMove,
  onRemove,
}: {
  person: PeopleOption;
  name: string;
  group: PeopleGroup;
  groups: PeopleGroup[];
  locale: "en" | "ar";
  disabled?: boolean;
  index: number;
  onMove: GroupProps["onMove"];
  onAddToGroup: GroupProps["onAddToGroup"];
  onRemove: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const ar = locale === "ar";
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: memberKey(group.id, person.value),
    data: {
      kind: "member",
      groupId: group.id,
      personId: person.value,
      label: name,
    },
    disabled,
  });
  const subtitle = ar ? person.subtitleAr || person.subtitle : person.subtitle;
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: reducedMotion ? undefined : transition,
        opacity: isDragging ? 0.25 : 1,
      }}
      className="group/member flex min-w-0 items-center gap-2 py-3 sm:gap-3"
    >
      <Button
        className={cn(
          hitClass,
          "touch-none cursor-grab text-muted-foreground active:cursor-grabbing",
        )}
        variant="ghost"
        size="icon"
        type="button"
        disabled={disabled}
        {...attributes}
        {...listeners}
        aria-label={`${ar ? "سحب الشخص" : "Drag person"}: ${name}`}
      >
        <GripVertical />
      </Button>
      <PersonAvatar src={person.imageUrl} name={name} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={name} dir="auto">
          {name}
        </p>
        {subtitle ? (
          <p
            className="mt-0.5 truncate text-xs text-muted-foreground"
            dir="auto"
            title={subtitle}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              className={hitClass}
              variant="ghost"
              size="icon"
              type="button"
              disabled={disabled}
              aria-label={`${ar ? "خيارات الشخص" : "Person actions"}: ${name}`}
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="dashboard-theme w-64"
          align="end"
          dir={ar ? "rtl" : "ltr"}
        >
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="min-h-10"
              disabled={index === 0}
              onClick={() =>
                onMove(group.id, group.id, person.value, index - 1)
              }
            >
              <ArrowUp />
              {ar ? "رفع الشخص" : "Move person up"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="min-h-10"
              disabled={index === group.memberIds.length - 1}
              onClick={() =>
                onMove(group.id, group.id, person.value, index + 1)
              }
            >
              <ArrowDown />
              {ar ? "خفض الشخص" : "Move person down"}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          {groups.length > 1 ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="min-h-10">
                    <ArrowRight />
                    {ar ? "نقل إلى مجموعة" : "Move to group"}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent
                    className="dashboard-theme w-64"
                    side={ar ? "left" : "right"}
                    dir={ar ? "rtl" : "ltr"}
                  >
                    <DropdownMenuGroup>
                      {groups
                        .filter((entry) => entry.id !== group.id)
                        .map((entry) => (
                          <DropdownMenuItem
                            className="min-h-10"
                            key={entry.id}
                            onClick={() =>
                              onMove(group.id, entry.id, person.value)
                            }
                          >
                            <span className="min-w-0 flex-1 whitespace-normal break-words">
                              {groupName(entry, locale) ||
                                (ar ? "مجموعة جديدة" : "New group")}
                              {entry.memberIds.includes(person.value) ? (
                                <span className="block text-xs text-muted-foreground">
                                  {ar
                                    ? "عضو بالفعل؛ ستُزال العضوية الحالية فقط"
                                    : "Already a member; removes current membership"}
                                </span>
                              ) : null}
                            </span>
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="min-h-10">
                    <Plus />
                    {ar ? "إضافة إلى مجموعة" : "Add to group"}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent
                    className="dashboard-theme w-64"
                    side={ar ? "left" : "right"}
                    dir={ar ? "rtl" : "ltr"}
                  >
                    <DropdownMenuGroup>
                      {groups
                        .filter((entry) => entry.id !== group.id)
                        .map((entry) => (
                          <DropdownMenuItem
                            className="min-h-10"
                            key={entry.id}
                            disabled={entry.memberIds.includes(person.value)}
                            onClick={() =>
                              onAddToGroup(group.id, entry.id, person.value)
                            }
                          >
                            <span className="min-w-0 flex-1 whitespace-normal break-words">
                              {groupName(entry, locale) ||
                                (ar ? "مجموعة جديدة" : "New group")}
                              {entry.memberIds.includes(person.value) ? (
                                <span className="block text-xs text-muted-foreground">
                                  {ar ? "عضو بالفعل" : "Already a member"}
                                </span>
                              ) : null}
                            </span>
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
            </>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="min-h-10"
              variant="destructive"
              onClick={onRemove}
            >
              <X />
              {ar ? "إزالة من المجموعة" : "Remove from group"}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
