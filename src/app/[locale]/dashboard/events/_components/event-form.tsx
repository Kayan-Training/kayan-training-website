"use client";

// ─────────────────────────────────────────────────────────────────────────────
// EventForm — Kayan Dashboard
//
// Layout (3-col, full viewport height):
//   [Left nav rail w-52] | [Active section panel flex-1] | [Right rail w-72]
//
// Design principles:
//   • TABBED — only the active section renders, no long scroll
//   • No Card wrappers around sections (card padding is unnecessary bulk)
//   • Right rail is w-72 with generous px-5 so text never squishes
//   • RichTextEditor is passed props directly — no wrapping div that clips it
//   • All Switch components get shrink-0 + pointer-events-none so the thumb
//     never overflows; click is handled by the parent button
//   • Every SelectTrigger renders an explicit <span> child (not SelectValue
//     placeholder) so the human-readable label always shows
//   • Inputs are normalised to h-9 via inputCls
// ─────────────────────────────────────────────────────────────────────────────

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// ── Lucide icons ──────────────────────────────────────────────────────────────
import {
  AlignLeft,
  ArrowLeft,
  Award,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Download,
  FileText,
  GripVertical,
  ImageIcon,
  Info,
  LayoutList,
  Link2,
  ListChecks,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Settings2,
  Star,
  Tag,
  Trash2,
  Upload,
  Users,
  Video,
  X,
} from "lucide-react";

// ── shadcn/ui ─────────────────────────────────────────────────────────────────
import { RichTextEditor } from "@/components/dashboard/rich-text-editor";
import {
  DashboardFieldLabel,
  DashboardSectionHeading,
} from "@/components/dashboard/editor-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UploadProgress } from "@/components/ui/upload-progress";
import { uploadMediaFile } from "@/lib/client/media-upload";

// ─────────────────────────────────────────────────────────────────────────────
// Zod schema
// ─────────────────────────────────────────────────────────────────────────────

const agendaItemSchema = z.object({
  day: z.number().int().min(1),
  time: z.string().min(1),
  title: z.string().min(1),
  trainerId: z.string().optional(),
  type: z.enum(["talk", "break", "workshop", "panel"]),
});

const registrationFieldSchema = z.object({
  id: z.string(),
  labelAr: z.string().min(1),
  labelEn: z.string().min(1),
  optionsAr: z.string(),
  optionsEn: z.string(),
  placeholderAr: z.string(),
  placeholderEn: z.string(),
  required: z.boolean(),
  type: z.enum(["text", "email", "textarea", "select"]),
});

const eventSchema = z.object({
  agenda: z.array(agendaItemSchema),
  capacity: z.string(),
  categories: z.array(z.string()),
  contentAr: z.string(),
  contentEn: z.string(),
  coverImage: z.string(),
  endDate: z.string().min(1),
  googleMapsLink: z.string(),
  isCertified: z.boolean(),
  isFeatured: z.boolean(),
  isFree: z.boolean(),
  language: z.enum(["en", "ar", "both"]),
  location: z.string(),
  meetingLink: z.string(),
  meetingPlatform: z.enum(["zoom", "teams", "meet", "other"]),
  paymentMethods: z.enum(["both", "card", "bank"]),
  bankAccountName: z.string(),
  bankName: z.string(),
  bankIban: z.string(),
  bankSwift: z.string(),
  bankInstructionsEn: z.string(),
  bankInstructionsAr: z.string(),
  price: z.string().min(1),
  registrationDeadline: z.string(),
  registrationFields: z.array(registrationFieldSchema),
  registrationsOpen: z.boolean(),
  seoDescriptionAr: z.string(),
  seoDescriptionEn: z.string(),
  seoTitleAr: z.string(),
  seoTitleEn: z.string(),
  showMapEmbed: z.boolean(),
  shortAr: z.string().max(160),
  shortEn: z.string().max(160),
  slug: z.string().min(1),
  startDate: z.string().min(1),
  status: z.enum(["draft", "published"]),
  titleAr: z.string().min(1),
  titleEn: z.string().min(1),
  trainerIds: z.array(z.string()),
  type: z.enum(["onsite", "online", "hybrid"]),
});

export type EventFormValues = z.infer<typeof eventSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Label maps — always show human-readable strings in UI
// ─────────────────────────────────────────────────────────────────────────────

const eventTypeLabels = { onsite: "On-site", online: "Online", hybrid: "Hybrid" } as const;
const languageLabels = { en: "English", ar: "Arabic", both: "Bilingual (EN + AR)" } as const;
const statusLabels = { published: "Published", draft: "Draft" } as const;
const paymentLabels = {
  both: "Card & Bank Transfer",
  card: "Card only",
  bank: "Bank Transfer only",
} as const;
const platformLabels = {
  zoom: "Zoom",
  teams: "Microsoft Teams",
  meet: "Google Meet",
  other: "Other",
} as const;
const agendaTypeLabels = {
  talk: "Talk",
  break: "Break",
  workshop: "Workshop",
  panel: "Panel",
} as const;
const fieldTypeLabels = {
  text: "Text",
  email: "Email",
  textarea: "Textarea",
  select: "Select (dropdown)",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Section IDs
// ─────────────────────────────────────────────────────────────────────────────

type SectionId =
  | "identity"
  | "schedule"
  | "location"
  | "pricing"
  | "content"
  | "agenda"
  | "trainers"
  | "categories"
  | "registrationForm"
  | "registrations";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toSlug(v: string): string {
  return v
    .toLowerCase()
    .trim()
    .replace(/[\u0600-\u06FF\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDayLabel(day: number, startDate: string): string {
  if (!startDate) return `Day ${day}`;
  const d = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return `Day ${day}`;
  d.setDate(d.getDate() + day - 1);
  return `Day ${day} · ${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared style constants
// ─────────────────────────────────────────────────────────────────────────────

const inputCls =
  "h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-xs " +
  "placeholder:text-zinc-300 focus:border-teal-500 focus:outline-none focus:ring-2 " +
  "focus:ring-teal-500/10 transition-colors";

const labelCls = "text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400";

// ─────────────────────────────────────────────────────────────────────────────
// Primitive sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Teal info callout */
function Note({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border border-teal-100 bg-teal-50 px-3.5 py-3",
        "text-[12.5px] leading-relaxed text-teal-700",
        className,
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0 text-teal-500" />
      <span>{children}</span>
    </div>
  );
}

/** Section heading: number + icon + title + description */
function SectionHeader({
  description,
  icon: Icon,
  number,
  title,
}: {
  description: string;
  icon: React.ElementType;
  number: string;
  title: string;
}) {
  return (
    <DashboardSectionHeading
      description={description}
      icon={Icon}
      index={number}
      title={title}
    />
  );
}

/** Field label row: label + optional right-side hint */
function FL({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return <DashboardFieldLabel hint={hint}>{children}</DashboardFieldLabel>;
}

/**
 * Select backed by a label map.
 * Always renders the human-readable label on the trigger (not raw enum value).
 */
function EnumSelect<T extends string>({
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  disabled?: boolean;
  label?: string;
  onChange: (v: T) => void;
  options: Record<T, string>;
  value: T;
}) {
  return (
    <div className="space-y-1.5">
      {label ? <Label className={labelCls}>{label}</Label> : null}
      <Select disabled={disabled} value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger className={cn(inputCls, "cursor-pointer pr-8")}>
          {/* Explicit span — avoids SelectValue placeholder flash */}
          <span className="truncate">{options[value]}</span>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {(Object.entries(options) as [T, string][]).map(([v, lbl]) => (
              <SelectItem key={v} value={v}>{lbl}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Toggle control row used in both the main content and the right rail.
 * The entire row is a button; the Switch is pointer-events-none so it
 * can't grab its own click (the button handles it).
 * This guarantees the Switch thumb never overflows its track.
 */
function ToggleControl({
  checked,
  className,
  description,
  iconBg,
  iconEl,
  onCheckedChange,
  title,
}: {
  checked: boolean;
  className?: string;
  description?: string;
  iconBg?: string;
  iconEl: React.ReactNode;
  onCheckedChange: (v: boolean) => void;
  title: string;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors",
        checked ? "border-teal-200 bg-teal-50/60" : "border-zinc-200 bg-white hover:bg-zinc-50/80",
        className,
      )}
      type="button"
      onClick={() => onCheckedChange(!checked)}
    >
      <div className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md", iconBg ?? "bg-zinc-100")}>
        {iconEl}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-zinc-800">{title}</p>
        {description ? <p className="mt-0.5 text-[11.5px] leading-relaxed text-zinc-400">{description}</p> : null}
      </div>
      <div className="mt-0.5 shrink-0">
        {/* pointer-events-none: button above handles the click */}
        <Switch checked={checked} className="pointer-events-none data-[state=checked]:bg-teal-600" />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sortable wrappers (DnD kit)
// ─────────────────────────────────────────────────────────────────────────────

function SortableFieldItem({ id, children }: { id: string; children: (dragHandleProps: React.HTMLAttributes<HTMLButtonElement>) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
    >
      {children({ ...attributes, ...listeners } as React.HTMLAttributes<HTMLButtonElement>)}
    </div>
  );
}

function SortableTrainerItem({ id, children }: { id: string; children: (dragHandleProps: React.HTMLAttributes<HTMLButtonElement>) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
    >
      {children({ ...attributes, ...listeners } as React.HTMLAttributes<HTMLButtonElement>)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EventForm
// ─────────────────────────────────────────────────────────────────────────────

export function EventForm({
  categoryOptions,
  defaultValues,
  eventId,
  fetchMedia,
  locale,
  onSubmit,
  registrations = [],
  submitLabel,
  trainerOptions,
}: {
  categoryOptions: Array<{ label: string; value: string }>;
  defaultValues?: Partial<EventFormValues>;
  eventId?: string;
  fetchMedia: () => Promise<{ id: string; originalName: string; url: string; mimeType: string }[]>;
  locale: string;
  onSubmit: (values: EventFormValues) => Promise<{ error?: string }>;
  registrations?: Array<{
    id: string;
    registrantName: string;
    registrantEmail: string;
    status: string;
    createdAt: string;
  }>;
  submitLabel: string;
  trainerOptions: Array<{ label: string; value: string }>;
}) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeLocale, setActiveLocale] = useState<"en" | "ar">("en");
  const [activeSection, setActiveSection] = useState<SectionId>("identity");
  const [activeDay, setActiveDay] = useState(1);
  const [manualDays, setManualDays] = useState<number[]>([]);
  const [openFieldId, setOpenFieldId] = useState<string | null>(null);
  const [newFieldType, setNewFieldType] = useState<"text" | "email" | "textarea" | "select">("text");
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const [coverUploadStatus, setCoverUploadStatus] = useState("");
  const [coverLibraryOpen, setCoverLibraryOpen] = useState(false);
  const [coverLibraryLoading, setCoverLibraryLoading] = useState(false);
  const [coverLibraryItems, setCoverLibraryItems] = useState<{ id: string; originalName: string; url: string; mimeType: string }[]>([]);
  const [trainerCandidate, setTrainerCandidate] = useState("");

  // ── Form ──────────────────────────────────────────────────────────────────
  const form = useForm<EventFormValues>({
    defaultValues: {
      agenda: [],
      capacity: "",
      categories: [],
      contentAr: "",
      contentEn: "",
      coverImage: "",
      endDate: "",
      googleMapsLink: "",
      isCertified: false,
      isFeatured: false,
      isFree: false,
      language: "both",
      location: "",
      meetingLink: "",
      meetingPlatform: "zoom",
      paymentMethods: "both",
      bankAccountName: "",
      bankName: "",
      bankIban: "",
      bankSwift: "",
      bankInstructionsEn: "",
      bankInstructionsAr: "",
      price: "0",
      registrationDeadline: "",
      registrationFields: [],
      registrationsOpen: true,
      seoDescriptionAr: "",
      seoDescriptionEn: "",
      seoTitleAr: "",
      seoTitleEn: "",
      showMapEmbed: false,
      shortAr: "",
      shortEn: "",
      slug: "",
      startDate: "",
      status: "draft",
      titleAr: "",
      titleEn: "",
      trainerIds: [],
      type: "onsite",
      ...defaultValues,
    },
    resolver: zodResolver(eventSchema),
  });

  const agenda = useFieldArray({ control: form.control, name: "agenda" });
  const regFields = useFieldArray({ control: form.control, name: "registrationFields" });

  // ── Watched values ────────────────────────────────────────────────────────
  const eventType = form.watch("type");
  const status = form.watch("status");
  const startDate = form.watch("startDate");
  const capacity = form.watch("capacity");
  const isFree = form.watch("isFree");
  const paymentMethods = form.watch("paymentMethods");
  const selectedTrainerIds = form.watch("trainerIds");
  const selectedCategoryIds = form.watch("categories");
  const coverImage = form.watch("coverImage");
  const shortEnLen = form.watch("shortEn").length;
  const shortArLen = form.watch("shortAr").length;
  const registrationsCount = registrations.length;
  const occupancy = Number(capacity || 0) > 0 ? Math.min(100, Math.round((registrationsCount / Number(capacity || 1)) * 100)) : 0;

  // ── Derived ───────────────────────────────────────────────────────────────
  const locationLabel =
    eventType === "online" ? "Delivery"
    : eventType === "hybrid" ? "Venue & Delivery"
    : "Location";

  const agendaDays = useMemo(() => {
    const days = Array.from(new Set([...agenda.fields.map((f) => f.day), ...manualDays, 1]));
    return days.sort((a, b) => a - b);
  }, [agenda.fields, manualDays]);

  const chosenTrainers = useMemo(
    () => trainerOptions.filter((t) => selectedTrainerIds.includes(t.value)),
    [selectedTrainerIds, trainerOptions],
  );

  const availableTrainers = useMemo(
    () => trainerOptions.filter((t) => !selectedTrainerIds.includes(t.value)),
    [selectedTrainerIds, trainerOptions],
  );

  const activeTitle = form.watch(activeLocale === "en" ? "titleEn" : "titleAr").trim();
  const pageHeading = activeTitle || (submitLabel.includes("Create") ? "New Event" : "Edit Event");

  // ── Nav sections list ─────────────────────────────────────────────────────
  const sections: Array<{ icon: React.ElementType; id: SectionId; label: string }> = [
    { icon: Pencil,           id: "identity",         label: "Identity" },
    { icon: CalendarDays,     id: "schedule",         label: "Schedule" },
    { icon: MapPin,           id: "location",         label: locationLabel },
    { icon: CircleDollarSign, id: "pricing",          label: "Pricing" },
    { icon: AlignLeft,        id: "content",          label: "Content" },
    { icon: LayoutList,       id: "agenda",           label: "Agenda" },
    { icon: Users,            id: "trainers",         label: "Trainers" },
    { icon: Tag,              id: "categories",       label: "Categories" },
    { icon: ClipboardList,    id: "registrationForm", label: "Reg. Form" },
    { icon: ListChecks,       id: "registrations",    label: "Registrations" },
  ];

  const sectionIdx = sections.findIndex((s) => s.id === activeSection);
  const prevSection = sections[sectionIdx - 1];
  const nextSection = sections[sectionIdx + 1];

  // ── Handlers ──────────────────────────────────────────────────────────────

  function save(values: EventFormValues) {
    startTransition(async () => {
      const result = await onSubmit(values);
      if (result.error) { toast.error(result.error); return; }
      toast.success("Event saved.");
      router.push(`/${locale}/dashboard/events`);
      router.refresh();
    });
  }

  function addTrainer() {
    const id = trainerCandidate || availableTrainers[0]?.value;
    if (!id) return;
    form.setValue("trainerIds", Array.from(new Set([...selectedTrainerIds, id])), { shouldDirty: true });
    setTrainerCandidate("");
  }

  function removeTrainer(id: string) {
    form.setValue("trainerIds", selectedTrainerIds.filter((t) => t !== id), { shouldDirty: true });
  }

  function toggleCategory(id: string) {
    const next = selectedCategoryIds.includes(id)
      ? selectedCategoryIds.filter((c) => c !== id)
      : [...selectedCategoryIds, id];
    form.setValue("categories", next, { shouldDirty: true });
  }

  function addRegistrationField(type: "text" | "email" | "textarea" | "select") {
    const id = `field-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    regFields.append({
      id, labelAr: "", labelEn: "",
      optionsAr: type === "select" ? "الخيار 1,الخيار 2" : "",
      optionsEn: type === "select" ? "Option 1,Option 2" : "",
      placeholderAr: "", placeholderEn: "", required: false, type,
    });
    setOpenFieldId(id);
  }

  async function uploadCoverImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    setIsCoverUploading(true);
    setCoverUploadProgress(0);
    setCoverUploadStatus("");
    try {
      const media = await uploadMediaFile(file, {
        onProgress: (percent) => setCoverUploadProgress(percent),
        onStatus: (status) => setCoverUploadStatus(status),
      });
      form.setValue("coverImage", media.url, { shouldDirty: true });
      toast.success("Cover image uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsCoverUploading(false);
    }
  }

  async function openCoverLibrary() {
    setCoverLibraryLoading(true);
    try {
      const items = await fetchMedia();
      setCoverLibraryItems(items);
      setCoverLibraryOpen(true);
    } finally {
      setCoverLibraryLoading(false);
    }
  }

  // ── DnD ───────────────────────────────────────────────────────────────────
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleFieldDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = regFields.fields.findIndex((f) => f.id === active.id);
    const to = regFields.fields.findIndex((f) => f.id === over.id);
    if (from !== -1 && to !== -1) regFields.move(from, to);
  }

  function handleTrainerDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = form.getValues("trainerIds");
    const from = ids.indexOf(active.id as string);
    const to = ids.indexOf(over.id as string);
    if (from !== -1 && to !== -1) form.setValue("trainerIds", arrayMove(ids, from, to), { shouldDirty: true });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Form {...form}>
        <form className="flex h-screen overflow-hidden bg-zinc-50" onSubmit={form.handleSubmit(save)}>

        {/* ════════════════════════════════════════════════════════════════
            LEFT NAV RAIL  w-52
        ════════════════════════════════════════════════════════════════ */}
        <nav className="flex h-full w-52 shrink-0 flex-col border-r border-zinc-200 bg-white">

          {/* Top: back + event title + status */}
          <div className="border-b border-zinc-100 px-4 py-4">
            <Link
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 transition-colors hover:text-zinc-700"
              href={`/${locale}/dashboard/events`}
            >
              <ArrowLeft className="size-3" /> Events
            </Link>
            <h1 className="mt-2 line-clamp-2 text-[13px] font-bold leading-snug text-zinc-800">
              {pageHeading}
            </h1>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className={cn(
                "size-1.5 rounded-full",
                status === "published" ? "animate-pulse bg-teal-500" : "bg-zinc-300",
              )} />
              <span className="text-[11px] font-semibold text-zinc-400">{statusLabels[status]}</span>
            </div>
          </div>

          {/* Section nav */}
          <div className="flex-1 overflow-y-auto py-2">
            <p className="px-4 pb-1 pt-2 text-[9.5px] font-bold uppercase tracking-widest text-zinc-300">
              Sections
            </p>
            {sections.map(({ icon: Icon, id, label }) => (
              <button
                className={cn(
                  "flex w-full items-center gap-2.5 border-r-2 px-4 py-2 text-left text-[12.5px] font-medium transition-all",
                  activeSection === id
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-transparent text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800",
                )}
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-zinc-100 px-4 py-3">
            <p className={cn(labelCls, "text-center")}>
              Use the sticky top bar for language and save actions
            </p>
          </div>

        </nav>

        {/* ════════════════════════════════════════════════════════════════
            MAIN PANEL  flex-1
            Only the active section renders (tabbed, not scroll)
        ════════════════════════════════════════════════════════════════ */}
        <main className="flex h-full flex-1 min-w-0 flex-col overflow-hidden">

          {/* Breadcrumb bar */}
          <div className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-zinc-100 bg-white px-7 py-3 text-[12px]">
            <span className="text-zinc-400">Events</span>
            <ChevronRight className="size-3.5 text-zinc-300" />
            <span className="text-zinc-400">{pageHeading}</span>
            <ChevronRight className="size-3.5 text-zinc-300" />
            <span className="font-semibold text-zinc-700">
              {sections.find((s) => s.id === activeSection)?.label}
            </span>
          </div>

          {/* Sticky actions */}
          <div className="sticky top-[45px] z-10 flex items-center justify-between gap-3 border-b border-zinc-100 bg-white/95 px-7 py-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Content
              </span>
              <div className="flex rounded-md border border-zinc-200 bg-zinc-50 p-0.5">
                {(["en", "ar"] as const).map((loc) => (
                  <button
                    className={cn(
                      "rounded px-2.5 py-1 text-[11px] font-bold tracking-widest transition-all",
                      activeLocale === loc
                        ? "bg-white text-teal-600 shadow-sm"
                        : "text-zinc-400 hover:text-zinc-600",
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
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                  status === "published"
                    ? "bg-teal-50 text-teal-700"
                    : "bg-zinc-100 text-zinc-500",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    status === "published" ? "bg-teal-500" : "bg-zinc-400",
                  )}
                />
                {statusLabels[status]}
              </span>
              <Link
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-md border border-zinc-200 px-3 text-[12px] font-medium text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-800",
                )}
                href={`/${locale}/dashboard/events`}
              >
                Discard
              </Link>
              <Button
                className="h-8 bg-teal-600 px-3 text-[12px] font-semibold hover:bg-teal-700"
                disabled={isPending}
                type="submit"
              >
                {isPending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                {isPending ? "Saving…" : submitLabel}
              </Button>
            </div>
          </div>

          {/* Section content — scrollable */}
          <div className="flex-1 overflow-y-auto px-7 py-7">
            <div className="mx-auto max-w-2xl">

              {/* ─────────────────────────────────────────────────────────
                  §01  IDENTITY
                  Cover image · title + inline slug · short description
                  Event type · language of instruction
              ───────────────────────────────────────────────────────── */}
              {activeSection === "identity" && (
                <div className="space-y-5">
                  <SectionHeader
                    description="Cover image, titles, URL slug, type and language"
                    icon={Pencil}
                    number="01"
                    title="Identity"
                  />

                  {/* Cover image upload */}
                  <FormField
                    control={form.control}
                    name="coverImage"
                    render={({ field }) => (
                      <FormItem>
                        <FL>Cover Image</FL>
                        <input
                          ref={coverInputRef}
                          accept="image/*"
                          className="sr-only"
                          type="file"
                          onChange={(e) => void uploadCoverImage(e.target.files?.[0])}
                        />
                        <button
                          className={cn(
                            "group relative flex w-full cursor-pointer items-center justify-center overflow-hidden",
                            "rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 transition-colors",
                            "hover:border-teal-400 hover:bg-teal-50/30",
                            isCoverUploading && "pointer-events-none opacity-60",
                          )}
                          style={{ height: 172 }}
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                        >
                          {coverImage ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img alt="Cover" className="absolute inset-0 h-full w-full object-cover" src={coverImage} />
                              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                <Upload className="size-4 text-white" />
                                <span className="text-[13px] font-semibold text-white">Replace image</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-zinc-400">
                              {isCoverUploading
                                ? <Loader2 className="size-6 animate-spin text-teal-500" />
                                : <ImageIcon className="size-7 text-zinc-300" />}
                              <span className="text-[13px] font-medium">
                                {isCoverUploading ? `Uploading… ${coverUploadProgress}%` : "Upload cover image"}
                              </span>
                              <span className="text-[11.5px] text-zinc-300">
                                JPG, PNG or WebP · Recommended 1600 × 900
                              </span>
                              <UploadProgress
                                className="w-full max-w-[260px]"
                                isActive={isCoverUploading}
                                percent={coverUploadProgress}
                                status={coverUploadStatus}
                              />
                            </div>
                          )}
                        </button>
                        {coverImage ? (
                          <div className="mt-2 flex gap-2">
                            <Button className="h-7 text-[11.5px]" size="sm" type="button" variant="outline"
                              onClick={() => coverInputRef.current?.click()}>
                              <Upload className="mr-1 size-3" /> Replace
                            </Button>
                            <Button className="h-7 text-[11.5px] text-red-500 hover:text-red-600" size="sm" type="button" variant="outline"
                              onClick={() => form.setValue("coverImage", "", { shouldDirty: true })}>
                              <X className="mr-1 size-3" /> Remove
                            </Button>
                            <Button className="h-7 text-[11.5px]" disabled={coverLibraryLoading || isCoverUploading} size="sm" type="button" variant="outline"
                              onClick={() => void openCoverLibrary()}>
                              {coverLibraryLoading ? <Loader2 className="mr-1 size-3 animate-spin" /> : <Search className="mr-1 size-3" />} Browse
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-2 flex gap-2">
                            <Button className="h-7 text-[11.5px]" disabled={coverLibraryLoading || isCoverUploading} size="sm" type="button" variant="outline"
                              onClick={() => void openCoverLibrary()}>
                              {coverLibraryLoading ? <Loader2 className="mr-1 size-3 animate-spin" /> : <Search className="mr-1 size-3" />} Browse library
                            </Button>
                          </div>
                        )}
                        <input className="sr-only" type="text" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Title + inline editable slug */}
                  <FormField
                    control={form.control}
                    name={activeLocale === "en" ? "titleEn" : "titleAr"}
                    render={({ field }) => (
                      <FormItem>
                        <FL>Title</FL>
                        <FormControl>
                          <Input
                            className={cn(inputCls, "text-[15px] font-semibold")}
                            dir={activeLocale === "ar" ? "rtl" : "ltr"}
                            placeholder={activeLocale === "en" ? "Event title in English" : "عنوان الفعالية بالعربية"}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              const cur = form.getValues("slug");
                              const auto = toSlug(form.getValues("titleEn"));
                              if (!cur || cur === auto) {
                                form.setValue("slug", toSlug(e.target.value), { shouldDirty: true });
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        {/* Inline slug — directly beneath title */}
                        <FormField
                          control={form.control}
                          name="slug"
                          render={({ field: sf }) => (
                            <div className="mt-1.5 flex items-stretch overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 text-[11.5px] shadow-xs focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-500/10">
                              <span className="flex items-center border-r border-zinc-200 bg-zinc-100 px-2.5 font-medium text-zinc-400 select-none whitespace-nowrap">
                                kayan.om/events/
                              </span>
                              <input
                                className="flex-1 min-w-0 bg-transparent px-2.5 py-1.5 font-mono font-semibold text-teal-600 outline-none placeholder:text-zinc-300"
                                placeholder="event-slug"
                                spellCheck={false}
                                {...sf}
                                onBlur={(e) => {
                                  sf.onBlur();
                                  sf.onChange(toSlug(e.target.value) || "event-slug");
                                }}
                              />
                              <span className="flex items-center px-2 text-zinc-300">
                                <Pencil className="size-3" />
                              </span>
                            </div>
                          )}
                        />
                      </FormItem>
                    )}
                  />

                  {/* Short description */}
                  <FormField
                    control={form.control}
                    name={activeLocale === "en" ? "shortEn" : "shortAr"}
                    render={({ field }) => {
                      const count = activeLocale === "en" ? shortEnLen : shortArLen;
                      return (
                        <FormItem>
                          <FL
                            hint={
                              <span className={cn(
                                "font-mono text-[10.5px] font-semibold",
                                count > 144 ? "text-red-500" : count > 120 ? "text-amber-500" : "text-zinc-300",
                              )}>
                                {count} / 160
                              </span>
                            }
                          >
                            Short Description
                            <span className="ml-1.5 font-normal normal-case tracking-normal text-zinc-400">
                              shown in listings
                            </span>
                          </FL>
                          <FormControl>
                            <Textarea
                              className={cn(inputCls, "h-auto resize-none py-2")}
                              dir={activeLocale === "ar" ? "rtl" : "ltr"}
                              maxLength={160}
                              placeholder={activeLocale === "en"
                                ? "A concise summary shown in event cards…"
                                : "ملخص قصير يظهر في بطاقات الفعاليات…"}
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  {/* Event type + language */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <EnumSelect label="Event Type" onChange={field.onChange} options={eventTypeLabels} value={field.value} />
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="language" render={({ field }) => (
                      <FormItem>
                        <EnumSelect label="Language of Instruction" onChange={field.onChange} options={languageLabels} value={field.value} />
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="h-px bg-zinc-100" />

                  {/* SEO moved from right sidebar into Identity tab */}
                  <div className="space-y-3">
                    <p className={cn(labelCls, "mb-0")}>SEO Metadata</p>
                    <FormField
                      control={form.control}
                      name={activeLocale === "en" ? "seoTitleEn" : "seoTitleAr"}
                      render={({ field }) => (
                        <FormItem>
                          <FL>SEO Title ({activeLocale.toUpperCase()})</FL>
                          <FormControl>
                            <Input
                              className={inputCls}
                              dir={activeLocale === "ar" ? "rtl" : "ltr"}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={activeLocale === "en" ? "seoDescriptionEn" : "seoDescriptionAr"}
                      render={({ field }) => (
                        <FormItem>
                          <FL>SEO Description ({activeLocale.toUpperCase()})</FL>
                          <FormControl>
                            <Textarea
                              className={cn(inputCls, "h-auto resize-none py-2")}
                              dir={activeLocale === "ar" ? "rtl" : "ltr"}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                </div>
              )}

              {/* ─────────────────────────────────────────────────────────
                  §02  SCHEDULE
                  Start · end · registration deadline · capacity
              ───────────────────────────────────────────────────────── */}
              {activeSection === "schedule" && (
                <div className="space-y-5">
                  <SectionHeader description="Dates, capacity and registration window" icon={CalendarDays} number="02" title="Schedule" />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="startDate" render={({ field }) => (
                      <FormItem><FL>Start Date</FL><FormControl><Input className={inputCls} type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="endDate" render={({ field }) => (
                      <FormItem><FL>End Date</FL><FormControl><Input className={inputCls} type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="registrationDeadline" render={({ field }) => (
                      <FormItem><FL hint="optional">Registration Deadline</FL><FormControl><Input className={inputCls} type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="capacity" render={({ field }) => (
                      <FormItem><FL hint="max seats">Capacity</FL><FormControl><Input className={inputCls} min={1} placeholder="e.g. 40" type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <Note>
                    Capacity is enforced automatically — registrations close once the limit is
                    reached, without any manual action needed.
                  </Note>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────
                  §03  LOCATION
                  Conditional blocks: onsite / online / hybrid
              ───────────────────────────────────────────────────────── */}
              {activeSection === "location" && (
                <div className="space-y-5">
                  <SectionHeader
                    description={
                      eventType === "online" ? "Meeting platform and join link"
                      : eventType === "hybrid" ? "Venue address plus online delivery link"
                      : "Venue details and map embed settings"
                    }
                    icon={MapPin}
                    number="03"
                    title={locationLabel}
                  />

                  {/* Onsite / Hybrid: venue + map */}
                  {(eventType === "onsite" || eventType === "hybrid") && (
                    <>
                      <FormField control={form.control} name="location" render={({ field }) => (
                        <FormItem>
                          <FL>Venue Name / Address</FL>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                              <Input className={cn(inputCls, "pl-8")} placeholder="Grand Hyatt Muscat, Al Shati Street" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="googleMapsLink" render={({ field }) => (
                          <FormItem>
                            <FL>Google Maps Link</FL>
                            <FormControl>
                              <div className="relative">
                                <Link2 className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                                <Input className={cn(inputCls, "pl-8")} placeholder="https://maps.google.com/…" type="url" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="showMapEmbed" render={({ field }) => (
                          <FormItem>
                            <FL>Map Embed</FL>
                            <ToggleControl
                              checked={field.value}
                              description="Show interactive map on event page"
                              iconBg="bg-teal-50"
                              iconEl={<MapPin className="size-4 text-teal-600" />}
                              title="Show map embed"
                              onCheckedChange={field.onChange}
                            />
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </>
                  )}

                  {/* Online / Hybrid: meeting platform + link */}
                  {(eventType === "online" || eventType === "hybrid") && (
                    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
                      <div className="flex items-center gap-2">
                        <Video className="size-4 text-teal-600" />
                        <p className="text-[13px] font-semibold text-zinc-700">Online Delivery</p>
                      </div>
                      <FormField control={form.control} name="meetingPlatform" render={({ field }) => (
                        <FormItem>
                          <FL>Platform</FL>
                          <div className="flex flex-wrap gap-2">
                            {(Object.entries(platformLabels) as [keyof typeof platformLabels, string][]).map(([v, lbl]) => (
                              <button
                                className={cn(
                                  "rounded-md border px-3 py-1.5 text-[12px] font-semibold transition-all",
                                  field.value === v
                                    ? "border-teal-500 bg-teal-50 text-teal-700"
                                    : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300",
                                )}
                                key={v} type="button"
                                onClick={() => field.onChange(v)}
                              >
                                {lbl}
                              </button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="meetingLink" render={({ field }) => (
                        <FormItem>
                          <FL>Meeting Link</FL>
                          <FormControl>
                            <div className="relative">
                              <Link2 className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                              <Input className={cn(inputCls, "pl-8")} placeholder="https://zoom.us/j/…" type="url" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <p className="text-[11.5px] text-zinc-400">
                        Sent only to registered participants — not publicly visible.
                      </p>
                    </div>
                  )}

                </div>
              )}

              {/* ─────────────────────────────────────────────────────────
                  §04  PRICING
                  Free toggle · price (OMR) · payment methods
              ───────────────────────────────────────────────────────── */}
              {activeSection === "pricing" && (
                <div className="space-y-4">
                  <SectionHeader description="Fees and accepted payment methods" icon={CircleDollarSign} number="04" title="Pricing" />
                  <FormField control={form.control} name="isFree" render={({ field }) => (
                    <FormItem>
                      <ToggleControl
                        checked={field.value}
                        description="Hides the price and removes payment requirement entirely"
                        iconBg="bg-teal-50"
                        iconEl={<CircleDollarSign className="size-4 text-teal-600" />}
                        title="Mark as free event"
                        onCheckedChange={field.onChange}
                      />
                    </FormItem>
                  )} />
                  {isFree ? (
                    <Note>This event is free — price and payment fields are hidden from learners.</Note>
                  ) : (
                    <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="price" render={({ field }) => (
                        <FormItem>
                          <FL>Price</FL>
                          <div className="flex h-9 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-xs focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/10">
                            <span className="flex items-center border-r border-zinc-200 bg-zinc-50 px-3 text-[11px] font-bold text-zinc-500">OMR</span>
                            <input className="flex-1 min-w-0 bg-transparent px-3 text-sm text-zinc-900 outline-none" min={0} step="0.001" type="number" {...field} />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="paymentMethods" render={({ field }) => (
                        <FormItem>
                          <EnumSelect label="Payment Methods" onChange={field.onChange} options={paymentLabels} value={field.value} />
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    {(paymentMethods === "both" || paymentMethods === "bank") && (
                      <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
                        <p className="text-[12px] font-semibold text-zinc-700">Bank Transfer Details</p>
                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="bankName" render={({ field }) => (
                            <FormItem>
                              <FL>Bank Name</FL>
                              <FormControl><Input className={inputCls} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="bankAccountName" render={({ field }) => (
                            <FormItem>
                              <FL>Account Name</FL>
                              <FormControl><Input className={inputCls} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="bankIban" render={({ field }) => (
                            <FormItem>
                              <FL>IBAN</FL>
                              <FormControl><Input className={inputCls} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="bankSwift" render={({ field }) => (
                            <FormItem>
                              <FL>SWIFT</FL>
                              <FormControl><Input className={inputCls} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="bankInstructionsEn" render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FL>Instructions (EN)</FL>
                              <FormControl><Textarea className={cn(inputCls, "h-auto py-2")} rows={2} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="bankInstructionsAr" render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FL>Instructions (AR)</FL>
                              <FormControl><Textarea className={cn(inputCls, "h-auto py-2")} dir="rtl" rows={2} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      </div>
                    )}
                    </div>
                  )}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────
                  §05  CONTENT
                  Short description (bilingual) + Tiptap rich text
                  IMPORTANT: RichTextEditor is NOT wrapped in any container
                  that would clip or resize it. Props are passed directly.
              ───────────────────────────────────────────────────────── */}
              {activeSection === "content" && (
                <div className="space-y-5">
                  <SectionHeader description="Rich text content shown on the public event detail page" icon={AlignLeft} number="05" title="Content" />

                  {/* Short description */}
                  <FormField
                    control={form.control}
                    name={activeLocale === "en" ? "shortEn" : "shortAr"}
                    render={({ field }) => {
                      const count = activeLocale === "en" ? shortEnLen : shortArLen;
                      return (
                        <FormItem>
                          <div className="mb-1.5 flex items-center justify-between">
                            <Label className={labelCls}>
                              Short Description
                              <span className="ml-1.5 font-normal normal-case tracking-normal text-zinc-400">
                                shown in listings
                              </span>
                            </Label>
                            <span className={cn(
                              "font-mono text-[10.5px] font-semibold",
                              count > 144 ? "text-red-500" : count > 120 ? "text-amber-500" : "text-zinc-300",
                            )}>
                              {count} / 160
                            </span>
                          </div>
                          <FormControl>
                            <Textarea
                              className={cn(inputCls, "h-auto resize-none py-2")}
                              dir={activeLocale === "ar" ? "rtl" : "ltr"}
                              maxLength={160}
                              placeholder={activeLocale === "en"
                                ? "A concise summary shown in event cards and search results…"
                                : "ملخص قصير يظهر في بطاقات الفعاليات…"}
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  {/* Long description — Tiptap (unwrapped) */}
                  <FormField
                    control={form.control}
                    name={activeLocale === "en" ? "contentEn" : "contentAr"}
                    render={({ field }) => (
                      <FormItem>
                        <div className="mb-1.5 flex items-center justify-between">
                          <Label className={labelCls}>
                            Long Description
                            <span className="ml-1.5 font-normal normal-case tracking-normal text-zinc-400">
                              Powered by Tiptap
                            </span>
                          </Label>
                        </div>
                        {/* RichTextEditor manages its own border/toolbar — no wrapper */}
                        <RichTextEditor
                          dir={activeLocale === "ar" ? "rtl" : "ltr"}
                          onChange={field.onChange}
                          placeholder="Build the full event page content — headings, lists, tables, images…"
                          value={field.value}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>
              )}

              {/* ─────────────────────────────────────────────────────────
                  §06  AGENDA
                  Day tabs · session table (time / title / type / speaker)
              ───────────────────────────────────────────────────────── */}
              {activeSection === "agenda" && (
                <div className="space-y-4">
                  <SectionHeader description="Displayed as a timetable on the public event page" icon={LayoutList} number="06" title="Agenda" />

                  {/* Day tabs */}
                  <div className="flex flex-wrap items-center gap-2">
                    {agendaDays.map((day) => (
                      <button
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11.5px] font-semibold transition-all",
                          activeDay === day
                            ? "border-teal-500 bg-teal-500 text-white"
                            : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300",
                        )}
                        key={day}
                        type="button"
                        onClick={() => setActiveDay(day)}
                      >
                        {formatDayLabel(day, startDate)}
                        {day > 1 && (
                          <span
                            className={cn(
                              "ml-0.5 flex size-3.5 items-center justify-center rounded-full text-[10px] leading-none",
                              activeDay === day ? "bg-white/25 hover:bg-white/40" : "bg-zinc-100 hover:bg-red-100 hover:text-red-500",
                            )}
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              agenda.fields
                                .map((f, i) => (f.day === day ? i : -1))
                                .filter((i) => i !== -1)
                                .reverse()
                                .forEach((i) => agenda.remove(i));
                              setManualDays((p) => p.filter((d) => d !== day));
                              if (activeDay === day) setActiveDay(agendaDays[0] ?? 1);
                            }}
                          >
                            ×
                          </span>
                        )}
                      </button>
                    ))}
                    <button
                      className="inline-flex items-center gap-1 rounded-full border border-dashed border-zinc-300 px-3 py-1 text-[11.5px] font-semibold text-zinc-400 transition-colors hover:border-teal-400 hover:text-teal-600"
                      type="button"
                      onClick={() => {
                        const next = Math.max(...agendaDays) + 1;
                        setManualDays((p) => [...p, next]);
                        setActiveDay(next);
                      }}
                    >
                      <Plus className="size-3" /> Add Day
                    </button>
                  </div>

                  {/* Session table */}
                  <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
                    {/* Table header */}
                    <div className="grid grid-cols-[88px_1fr_96px_130px_40px] border-b border-zinc-100 bg-zinc-50">
                      {["Time", "Session", "Type", "Speaker", ""].map((h) => (
                        <div className="border-r border-zinc-100 px-3 py-2 text-[9.5px] font-bold uppercase tracking-widest text-zinc-400 last:border-none" key={h}>{h}</div>
                      ))}
                    </div>
                    {/* Rows for active day */}
                    {agenda.fields
                      .map((item, index) => ({ index, item }))
                      .filter(({ item }) => item.day === activeDay)
                      .map(({ index, item }) => (
                        <div className="grid grid-cols-[88px_1fr_96px_130px_40px] border-b border-zinc-100 last:border-none hover:bg-zinc-50/60" key={item.id}>
                          <div className="border-r border-zinc-100">
                            <FormField control={form.control} name={`agenda.${index}.time`} render={({ field }) => (
                              <input className="h-10 w-full bg-transparent px-3 font-mono text-[11.5px] text-zinc-700 outline-none focus:bg-teal-50/40" type="time" {...field} />
                            )} />
                          </div>
                          <div className="border-r border-zinc-100">
                            <FormField control={form.control} name={`agenda.${index}.title`} render={({ field }) => (
                              <input className="h-10 w-full bg-transparent px-3 text-[13px] text-zinc-800 outline-none placeholder:text-zinc-300 focus:bg-teal-50/40" placeholder="Session title…" {...field} />
                            )} />
                          </div>
                          <div className="border-r border-zinc-100">
                            <FormField control={form.control} name={`agenda.${index}.type`} render={({ field }) => (
                              <select className="h-10 w-full appearance-none bg-transparent px-3 text-[12px] font-medium text-zinc-600 outline-none focus:bg-teal-50/40" value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                                {Object.entries(agendaTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                              </select>
                            )} />
                          </div>
                          <div className="border-r border-zinc-100">
                            <FormField control={form.control} name={`agenda.${index}.trainerId`} render={({ field }) => (
                              <select className="h-10 w-full appearance-none bg-transparent px-3 text-[12px] text-zinc-600 outline-none focus:bg-teal-50/40" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || undefined)}>
                                <option value="">No speaker</option>
                                {trainerOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                            )} />
                          </div>
                          <div className="flex items-center justify-center">
                            <button className="flex size-7 items-center justify-center rounded text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-500" type="button" onClick={() => agenda.remove(index)}>
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    {/* Empty state */}
                    {agenda.fields.filter((f) => f.day === activeDay).length === 0 && (
                      <div className="flex flex-col items-center gap-1.5 py-10 text-center">
                        <LayoutList className="size-5 text-zinc-200" />
                        <p className="text-[13px] text-zinc-400">No sessions for this day yet</p>
                      </div>
                    )}
                  </div>

                  <Button
                    className="h-9 border-dashed text-zinc-500 hover:border-teal-400 hover:text-teal-600"
                    type="button"
                    variant="outline"
                    onClick={() => agenda.append({ day: activeDay, time: "", title: "", trainerId: "", type: "talk" })}
                  >
                    <Plus className="mr-1.5 size-3.5" /> Add session
                  </Button>

                </div>
              )}

              {/* ─────────────────────────────────────────────────────────
                  §07  TRAINERS
                  Select from existing trainers · displayed as grid cards
              ───────────────────────────────────────────────────────── */}
              {activeSection === "trainers" && (
                <div className="space-y-4">
                  <SectionHeader description="People leading this event" icon={Users} number="07" title="Trainers" />

                  {/* Search + add */}
                  <div className="flex gap-2">
                    <Select value={trainerCandidate} onValueChange={(v) => setTrainerCandidate(v ?? "")}>
                      <SelectTrigger className={cn(inputCls, "flex-1 cursor-pointer pr-8")}>
                        <span className={trainerCandidate ? "text-zinc-900" : "text-zinc-400"}>
                          {trainerCandidate
                            ? trainerOptions.find((t) => t.value === trainerCandidate)?.label
                            : "Search existing trainers…"}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {availableTrainers.length === 0
                            ? <div className="px-3 py-2 text-[12px] text-zinc-400">All trainers already added</div>
                            : availableTrainers.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Button
                      className="h-9 shrink-0 bg-teal-600 text-[13px] hover:bg-teal-700"
                      disabled={!trainerCandidate && availableTrainers.length === 0}
                      type="button"
                      onClick={addTrainer}
                    >
                      <Plus className="mr-1.5 size-3.5" /> Add trainer
                    </Button>
                  </div>

                  {/* Cards */}
                  <DndContext sensors={dndSensors} onDragEnd={handleTrainerDragEnd}>
                    <SortableContext items={chosenTrainers.map((t) => t.value)} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-3 gap-3">
                        {chosenTrainers.map((trainer) => (
                          <SortableTrainerItem id={trainer.value} key={trainer.value}>
                            {(dragHandleProps) => (
                              <div className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs transition-shadow hover:shadow-sm">
                                <button
                                  aria-label={`Remove ${trainer.label}`}
                                  className="absolute right-2 top-2 z-10 flex size-5 items-center justify-center rounded-full bg-white/90 text-zinc-400 opacity-0 shadow-xs transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                                  type="button"
                                  onClick={() => removeTrainer(trainer.value)}
                                >
                                  <X className="size-2.5" />
                                </button>
                                <div className="flex h-20 items-center justify-center bg-gradient-to-br from-teal-50 to-zinc-100">
                                  <Users className="size-7 text-zinc-200" />
                                </div>
                                <div className="px-3 pb-3 pt-2.5">
                                  <p className="truncate text-[13px] font-semibold text-zinc-800">{trainer.label}</p>
                                  <p className="mt-0.5 text-[11.5px] text-zinc-400">Trainer</p>
                                </div>
                                <button
                                  {...dragHandleProps}
                                  aria-label="Drag to reorder"
                                  className="absolute bottom-2 right-2 cursor-grab text-zinc-300 hover:text-zinc-500 active:cursor-grabbing"
                                  type="button"
                                >
                                  <GripVertical className="size-3.5" />
                                </button>
                              </div>
                            )}
                          </SortableTrainerItem>
                        ))}
                        {chosenTrainers.length === 0 && (
                          <div className="col-span-3 flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-200 py-10 text-center">
                            <Users className="size-6 text-zinc-200" />
                            <p className="text-[13px] text-zinc-400">No trainers assigned yet</p>
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </DndContext>

                </div>
              )}

              {/* ─────────────────────────────────────────────────────────
                  §08  CATEGORIES
                  Toggle chips — selected = filled teal pill
              ───────────────────────────────────────────────────────── */}
              {activeSection === "categories" && (
                <div className="space-y-4">
                  <SectionHeader description="Tags that appear on the event page and in filters" icon={Tag} number="08" title="Categories" />
                  <div className="flex flex-wrap gap-2">
                    {categoryOptions.map((cat) => {
                      const selected = selectedCategoryIds.includes(cat.value);
                      return (
                        <button
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all",
                            selected
                              ? "border-teal-500 bg-teal-500 text-white"
                              : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300",
                          )}
                          key={cat.value}
                          type="button"
                          onClick={() => toggleCategory(cat.value)}
                        >
                          {selected && <span className="size-1.5 rounded-full bg-white/60" />}
                          {cat.label}
                        </button>
                      );
                    })}
                    {categoryOptions.length === 0 && (
                      <p className="text-[13px] text-zinc-400">No categories configured yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────
                  §09  REGISTRATION FORM
                  Add custom fields · accordion per field
              ───────────────────────────────────────────────────────── */}
              {activeSection === "registrationForm" && (
                <div className="space-y-4">
                  <SectionHeader description="Custom inputs shown to learners during sign-up" icon={ClipboardList} number="09" title="Registration Form" />

                  {/* Add field row */}
                  <div className="flex gap-2">
                    <div className="w-48">
                      <EnumSelect onChange={setNewFieldType} options={fieldTypeLabels} value={newFieldType} />
                    </div>
                    <Button className="h-9 bg-teal-600 text-[13px] hover:bg-teal-700" type="button" onClick={() => addRegistrationField(newFieldType)}>
                      <Plus className="mr-1.5 size-3.5" /> Add field
                    </Button>
                  </div>

                  {regFields.fields.length === 0 ? (
                    <Note>
                      No registration fields yet. Add fields to configure what learners fill out
                      during sign-up.
                    </Note>
                  ) : (
                    <DndContext modifiers={[restrictToVerticalAxis]} sensors={dndSensors} onDragEnd={handleFieldDragEnd}>
                      <SortableContext items={regFields.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {regFields.fields.map((regField, index) => {
                        const isOpen = openFieldId === regField.id;
                        const cur = form.getValues(`registrationFields.${index}`);
                        const activeLabel = activeLocale === "en" ? cur.labelEn : cur.labelAr;

                        return (
                          <SortableFieldItem id={regField.id} key={regField.id}>
                            {(dragHandleProps) => (
                          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
                            {/* Header */}
                            <div className="flex w-full items-center gap-2 px-2 py-3">
                              <button
                                {...dragHandleProps}
                                aria-label="Drag to reorder field"
                                className="shrink-0 cursor-grab p-1 text-zinc-300 hover:text-zinc-500 active:cursor-grabbing"
                                type="button"
                              >
                                <GripVertical className="size-4" />
                              </button>
                              <button
                                className="flex flex-1 items-center gap-3 text-left"
                                type="button"
                                onClick={() => setOpenFieldId(isOpen ? null : regField.id)}
                              >
                              <Badge className="shrink-0 rounded-full bg-zinc-100 text-[11px] font-bold text-zinc-500" variant="secondary">
                                Field {index + 1}
                              </Badge>
                              <span className="flex-1 truncate text-[13px] font-medium text-zinc-700">
                                {activeLabel || <span className="italic text-zinc-400">Untitled field</span>}
                              </span>
                              <Badge className="shrink-0 text-[11px]" variant="outline">{cur.type}</Badge>
                              <ChevronDown className={cn("size-4 shrink-0 text-zinc-400 transition-transform", isOpen && "rotate-180")} />
                              </button>
                            </div>

                            {/* Body */}
                            {isOpen && (
                              <div className="border-t border-zinc-100 px-4 pb-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField control={form.control} name={`registrationFields.${index}.type`} render={({ field: tf }) => (
                                    <FormItem><EnumSelect label="Field Type" onChange={tf.onChange} options={fieldTypeLabels} value={tf.value} /><FormMessage /></FormItem>
                                  )} />
                                  <FormField control={form.control} name={`registrationFields.${index}.required`} render={({ field: rf }) => (
                                    <FormItem>
                                      <FL>Required</FL>
                                      <div className="flex h-9 items-center gap-2.5 rounded-md border border-zinc-200 bg-zinc-50 px-3">
                                        <Switch checked={rf.value} className="shrink-0 data-[state=checked]:bg-teal-600" onCheckedChange={rf.onChange} />
                                        <Label className="cursor-pointer text-[13px] font-medium text-zinc-700">Required field</Label>
                                      </div>
                                    </FormItem>
                                  )} />
                                  <FormField control={form.control} name={`registrationFields.${index}.labelEn`} render={({ field: lf }) => (
                                    <FormItem><FL>Label (EN)</FL><FormControl><Input className={inputCls} {...lf} /></FormControl><FormMessage /></FormItem>
                                  )} />
                                  <FormField control={form.control} name={`registrationFields.${index}.labelAr`} render={({ field: lf }) => (
                                    <FormItem><FL>Label (AR)</FL><FormControl><Input className={inputCls} dir="rtl" {...lf} /></FormControl><FormMessage /></FormItem>
                                  )} />
                                  <FormField control={form.control} name={`registrationFields.${index}.placeholderEn`} render={({ field: pf }) => (
                                    <FormItem><FL>Placeholder (EN)</FL><FormControl><Input className={inputCls} {...pf} /></FormControl><FormMessage /></FormItem>
                                  )} />
                                  <FormField control={form.control} name={`registrationFields.${index}.placeholderAr`} render={({ field: pf }) => (
                                    <FormItem><FL>Placeholder (AR)</FL><FormControl><Input className={inputCls} dir="rtl" {...pf} /></FormControl><FormMessage /></FormItem>
                                  )} />
                                  {cur.type === "select" && (
                                    <>
                                      <FormField control={form.control} name={`registrationFields.${index}.optionsEn`} render={({ field: of }) => (
                                        <FormItem><FL hint="comma-separated">Options (EN)</FL><FormControl><Textarea className={cn(inputCls, "h-auto py-2")} rows={2} {...of} /></FormControl><FormMessage /></FormItem>
                                      )} />
                                      <FormField control={form.control} name={`registrationFields.${index}.optionsAr`} render={({ field: of }) => (
                                        <FormItem><FL hint="comma-separated">Options (AR)</FL><FormControl><Textarea className={cn(inputCls, "h-auto py-2")} dir="rtl" rows={2} {...of} /></FormControl><FormMessage /></FormItem>
                                      )} />
                                    </>
                                  )}
                                </div>
                                {/* Field actions */}
                                <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-4">
                                  <Button className="h-7 text-[11.5px]" disabled={index === 0} size="sm" type="button" variant="outline"
                                    onClick={() => index > 0 && regFields.move(index, index - 1)}>↑ Up</Button>
                                  <Button className="h-7 text-[11.5px]" disabled={index === regFields.fields.length - 1} size="sm" type="button" variant="outline"
                                    onClick={() => index < regFields.fields.length - 1 && regFields.move(index, index + 1)}>↓ Down</Button>
                                  <Button className="ml-auto h-7 text-[11.5px] text-red-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600" size="sm" type="button" variant="outline"
                                    onClick={() => { regFields.remove(index); setOpenFieldId(null); }}>
                                    <Trash2 className="mr-1 size-3" /> Remove
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                            )}
                          </SortableFieldItem>
                        );
                      })}
                    </div>
                      </SortableContext>
                    </DndContext>
                  )}

                </div>
              )}

              {/* ─────────────────────────────────────────────────────────
                  §10  REGISTRATIONS
                  Summary strip + inline table.
                  NOTE FOR DEVELOPER: pass a `registrations` prop to
                  populate the table rows. See comment inside table body.
              ───────────────────────────────────────────────────────── */}
              {activeSection === "registrations" && (
                <div className="space-y-4">
                  <SectionHeader description="Attendee submissions for this event" icon={ListChecks} number="10" title="Registrations" />

                  {!eventId ? (
                    <Note>Registrations become available after the event is created and published.</Note>
                  ) : (
                    <>
                      {/* Summary strip */}
                      <div className="flex items-center gap-5 rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-xs">
                        <div>
                          <p className="text-2xl font-bold tabular-nums text-zinc-900">{registrationsCount}</p>
                          <p className="mt-0.5 text-[11px] text-zinc-400">Registered</p>
                        </div>
                        <div className="h-8 w-px bg-zinc-100" />
                        <div>
                          <p className="text-2xl font-bold tabular-nums text-zinc-900">{capacity || "—"}</p>
                          <p className="mt-0.5 text-[11px] text-zinc-400">Capacity</p>
                        </div>
                        <div className="h-8 w-px bg-zinc-100" />
                        <div className="flex-1">
                          <div className="mb-1.5 flex justify-between text-[11px] text-zinc-400">
                            <span>Occupancy</span><span>{occupancy}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                            <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${occupancy}%` }} />
                          </div>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          <a
                            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 px-3 text-[12px] font-semibold text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900"
                            href={`/api/admin/exports/registrations?eventId=${eventId}`}
                          >
                            <Download className="size-3.5" /> Export CSV
                          </a>
                          <Link
                            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 px-3 text-[12px] font-semibold text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900"
                            href={`/${locale}/dashboard/registrations/${eventId}`}
                          >
                            <FileText className="size-3.5" /> Full page
                          </Link>
                        </div>
                      </div>

                      {/* Registrations table */}
                      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
                        <div className="grid grid-cols-[1fr_140px_100px_44px] border-b border-zinc-100 bg-zinc-50">
                          {["Learner", "Registered", "Status", ""].map((h) => (
                            <div className="border-r border-zinc-100 px-3 py-2 text-[9.5px] font-bold uppercase tracking-widest text-zinc-400 last:border-none" key={h}>{h}</div>
                          ))}
                        </div>
                        {registrations.length === 0 ? (
                          <div className="flex flex-col items-center gap-1.5 py-12 text-center">
                            <ListChecks className="size-5 text-zinc-200" />
                            <p className="text-[13px] font-medium text-zinc-400">No registrations yet</p>
                            <p className="text-[11.5px] text-zinc-300">
                              Registrations will appear here once learners sign up
                            </p>
                          </div>
                        ) : (
                          registrations.map((r) => (
                            <div className="grid grid-cols-[1fr_140px_100px_44px] border-b border-zinc-100 last:border-none" key={r.id}>
                              <div className="border-r border-zinc-100 px-3 py-2.5">
                                <p className="text-[13px] font-medium text-zinc-800">{r.registrantName}</p>
                                <p className="text-[11px] text-zinc-400">{r.registrantEmail}</p>
                              </div>
                              <div className="border-r border-zinc-100 px-3 py-2.5 text-[12px] text-zinc-500">{r.createdAt}</div>
                              <div className="border-r border-zinc-100 px-3 py-2.5">
                                <Badge variant="outline" className="capitalize">{r.status}</Badge>
                              </div>
                              <div className="flex items-center justify-center">
                                <Link className="text-zinc-500 hover:text-zinc-800" href={`/${locale}/dashboard/registrations/${eventId}`}>→</Link>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>

            {/* Prev / Next section navigation */}
            <div className="mx-auto mt-10 flex max-w-2xl items-center justify-between">
              {prevSection ? (
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-[12.5px] font-medium text-zinc-500 shadow-xs transition-colors hover:border-zinc-300 hover:text-zinc-800"
                  type="button"
                  onClick={() => setActiveSection(prevSection.id)}
                >
                  <ArrowLeft className="size-3.5" /> {prevSection.label}
                </button>
              ) : <div />}
              {nextSection ? (
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-[12.5px] font-medium text-zinc-500 shadow-xs transition-colors hover:border-zinc-300 hover:text-zinc-800"
                  type="button"
                  onClick={() => setActiveSection(nextSection.id)}
                >
                  {nextSection.label} <ChevronRight className="size-3.5" />
                </button>
              ) : <div />}
            </div>

          </div>
        </main>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT SETTINGS RAIL  w-72
            Wider than before so text is never squished.
            Status · Featured · Registrations open · Certificate · SEO
        ════════════════════════════════════════════════════════════════ */}
        <aside
          aria-label="Event settings"
          className="flex h-full w-72 shrink-0 flex-col overflow-y-auto border-l border-zinc-200 bg-white"
        >
          {/* Rail header */}
          <div className="border-b border-zinc-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Settings2 className="size-4 text-teal-600" />
              <h2 className="text-[13px] font-bold text-zinc-800">Settings</h2>
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-zinc-400">
              Visibility, registration, certificate and SEO controls
            </p>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">

            {/* ── Status ── */}
            <div>
              <p className={cn(labelCls, "mb-2.5")}>Publication Status</p>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <button
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors",
                      field.value === "published"
                        ? "border-teal-200 bg-teal-50/60"
                        : "border-zinc-200 bg-white hover:bg-zinc-50/80",
                    )}
                    type="button"
                    onClick={() =>
                      field.onChange(
                        field.value === "published" ? "draft" : "published",
                      )
                    }
                  >
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-zinc-100">
                      <FileText
                        className={cn(
                          "size-4",
                          field.value === "published"
                            ? "text-teal-600"
                            : "text-zinc-400",
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-zinc-800">
                        {field.value === "published"
                          ? statusLabels.published
                          : statusLabels.draft}
                      </p>
                      <p className="mt-0.5 text-[11.5px] leading-relaxed text-zinc-400">
                        {field.value === "published"
                          ? "Visible to learners"
                          : "Hidden from public"}
                      </p>
                    </div>
                    <div className="mt-0.5 shrink-0">
                      <Switch
                        checked={field.value === "published"}
                        className="pointer-events-none data-[state=checked]:bg-teal-600"
                      />
                    </div>
                  </button>
                )}
              />
            </div>

            <div className="h-px bg-zinc-100" />

            {/* ── Controls ── */}
            <div>
              <p className={cn(labelCls, "mb-2.5")}>Controls</p>
              <div className="space-y-2">
                <FormField control={form.control} name="isFeatured" render={({ field }) => (
                  <ToggleControl
                    checked={field.value}
                    description="Hero card on homepage · one event at a time"
                    iconBg={field.value ? "bg-amber-50" : "bg-zinc-100"}
                    iconEl={<Star className={cn("size-4", field.value ? "fill-amber-400 text-amber-400" : "text-zinc-400")} />}
                    title="Featured event"
                    onCheckedChange={field.onChange}
                  />
                )} />
                <FormField control={form.control} name="registrationsOpen" render={({ field }) => (
                  <ToggleControl
                    checked={field.value}
                    description="Block new sign-ups without unpublishing"
                    iconBg="bg-teal-50"
                    iconEl={<Users className="size-4 text-teal-600" />}
                    title="Registrations open"
                    onCheckedChange={field.onChange}
                  />
                )} />
                <FormField control={form.control} name="isCertified" render={({ field }) => (
                  <ToggleControl
                    checked={field.value}
                    description="Issued on completion of this event"
                    iconBg="bg-blue-50"
                    iconEl={<Award className="size-4 text-blue-600" />}
                    title="Issue certificate"
                    onCheckedChange={field.onChange}
                  />
                )} />
              </div>
            </div>

            {/* ── Quick links (edit mode only) ── */}
            {eventId ? (
              <>
                <div className="h-px bg-zinc-100" />
                <div>
                  <p className={cn(labelCls, "mb-2.5")}>Quick Links</p>
                  <Link
                    className="flex w-full items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2.5 text-[12.5px] font-semibold text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900"
                    href={`/${locale}/dashboard/registrations/${eventId}`}
                  >
                    <ListChecks className="size-3.5 text-teal-600" />
                    View all registrations
                  </Link>
                </div>
              </>
            ) : null}

          </div>
        </aside>

        </form>
      </Form>

      <Dialog onOpenChange={setCoverLibraryOpen} open={coverLibraryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Media Library</DialogTitle>
          </DialogHeader>
          {coverLibraryItems.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No images uploaded yet.</p>
          ) : (
            <div className="grid max-h-[70vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
              {coverLibraryItems.map((item) => (
                <button
                  className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border/50 hover:border-primary"
                  key={item.id}
                  type="button"
                  onClick={() => {
                    form.setValue("coverImage", item.url, { shouldDirty: true });
                    setCoverLibraryOpen(false);
                  }}
                >
                  {item.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={item.originalName} className="h-full w-full object-cover transition-transform group-hover:scale-105" src={item.url} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <Video className="size-6 text-muted-foreground" />
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {item.mimeType.startsWith("image/") ? "image" : "video"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
