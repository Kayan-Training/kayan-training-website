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
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
// ── Lucide icons ──────────────────────────────────────────────────────────────
import {
  DashboardFieldLabel,
  DashboardSectionHeading,
} from "@/components/dashboard/editor-primitives";

// ── shadcn/ui ─────────────────────────────────────────────────────────────────
import { RichTextEditor } from "@/components/dashboard/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaLibraryDialog } from "@/components/ui/media-library-dialog";
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
import { cn } from "@/lib/utils";

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
  heroProgramLogo: z.string(),
  heroCollaboratorLogos: z.string(),
  heroPeopleLabelAr: z.string(),
  heroPeopleLabelEn: z.string(),
  featuredSessionsStat: z.string(),
  featuredFullDayStat: z.string(),
  heroTagsAr: z.string(),
  heroTagsEn: z.string(),
  showSidebarSeatsFulfillment: z.boolean(),
  showSidebarPayment: z.boolean(),
  endDate: z.string().min(1),
  eventKind: z.enum(["event", "training_course"]),
  googleMapsLink: z.string(),
  isCertified: z.boolean(),
  isFeatured: z.boolean(),
  isFree: z.boolean(),
  language: z.enum(["en", "ar", "both"]),
  location: z.string(),
  meetingLink: z.string(),
  meetingPlatform: z.enum(["zoom", "teams", "meet", "other"]),
  galleryMode: z.enum(["always", "after_passed", "hidden"]),
  galleryMediaIds: z.array(z.string()),
  paymentMethods: z.enum(["both", "card", "bank"]),
  registrationType: z.enum(["internal", "external"]),
  externalRegistrationUrl: z.string(),
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

const eventTypeLabels = {
  onsite: "On-site",
  online: "Online",
  hybrid: "Hybrid",
} as const;
const eventKindLabels = {
  event: "Event",
  training_course: "Training Course",
} as const;
const languageLabels = {
  en: "English",
  ar: "Arabic",
  both: "Bilingual (EN + AR)",
} as const;
const statusLabels = { published: "Published", draft: "Draft" } as const;
const paymentLabels = {
  both: "Card & Bank Transfer",
  card: "Card only",
  bank: "Bank Transfer only",
} as const;
const registrationTypeLabels = {
  internal: "Internal (site form)",
  external: "External (redirect link)",
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
  "h-9! w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-xs " +
  "placeholder:text-zinc-300 focus:border-teal-500 focus:outline-none focus:ring-2 " +
  "focus:ring-teal-500/10 transition-colors";

const labelCls =
  "text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400";

// ─────────────────────────────────────────────────────────────────────────────
// Primitive sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Teal info callout */
function Note({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
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
  id,
  label,
  onChange,
  options,
  value,
}: {
  disabled?: boolean;
  id?: string;
  label?: string;
  onChange: (v: T) => void;
  options: Record<T, string>;
  value: T;
}) {
  const autoId = useId();
  const triggerId = id ?? `enum-select-${autoId}`;
  return (
    <div className="space-y-1.5">
      {label ? (
        <Label
          className={labelCls}
          htmlFor={triggerId}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(triggerId)?.click();
          }}
        >
          {label}
        </Label>
      ) : null}
      <Select
        disabled={disabled}
        value={value}
        onValueChange={(v) => onChange(v as T)}
      >
        <SelectTrigger
          className={cn(inputCls, "cursor-pointer")}
          id={triggerId}
        >
          {/* Explicit span — avoids SelectValue placeholder flash */}
          <span className="truncate">{options[value]}</span>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {(Object.entries(options) as [T, string][]).map(([v, lbl]) => (
              <SelectItem key={v} value={v}>
                {lbl}
              </SelectItem>
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
        checked
          ? "border-teal-200 bg-teal-50/60"
          : "border-zinc-200 bg-white hover:bg-zinc-50/80",
        className,
      )}
      type="button"
      onClick={() => onCheckedChange(!checked)}
    >
      <div
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
          iconBg ?? "bg-zinc-100",
        )}
      >
        {iconEl}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-zinc-800">{title}</p>
        {description ? (
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-zinc-400">
            {description}
          </p>
        ) : null}
      </div>
      <div className="mt-0.5 shrink-0">
        {/* pointer-events-none: button above handles the click */}
        <Switch
          checked={checked}
          className="pointer-events-none data-[state=checked]:bg-teal-600"
        />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sortable wrappers (DnD kit)
// ─────────────────────────────────────────────────────────────────────────────

function SortableFieldItem({
  id,
  children,
}: {
  id: string;
  children: (
    dragHandleProps: React.HTMLAttributes<HTMLButtonElement>,
  ) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      {children({
        ...attributes,
        ...listeners,
      } as React.HTMLAttributes<HTMLButtonElement>)}
    </div>
  );
}

function SortableTrainerItem({
  id,
  children,
}: {
  id: string;
  children: (
    dragHandleProps: React.HTMLAttributes<HTMLButtonElement>,
  ) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      {children({
        ...attributes,
        ...listeners,
      } as React.HTMLAttributes<HTMLButtonElement>)}
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
  fetchGalleryMedia,
  fetchMediaPage,
  fetchGalleryMediaPage,
  locale,
  onSubmit,
  registrations = [],
  submitLabel,
  trainerOptions,
}: {
  categoryOptions: Array<{ label: string; value: string }>;
  defaultValues?: Partial<EventFormValues>;
  eventId?: string;
  fetchMedia: () => Promise<
    { id: string; originalName: string; url: string; mimeType: string }[]
  >;
  fetchGalleryMedia: () => Promise<
    { id: string; originalName: string; url: string; mimeType: string }[]
  >;
  fetchMediaPage?: (
    page: number,
    pageSize?: number,
  ) => Promise<{
    items: { id: string; originalName: string; url: string; mimeType: string }[];
    page: number;
    totalPages: number;
    total: number;
  }>;
  fetchGalleryMediaPage?: (
    page: number,
    pageSize?: number,
  ) => Promise<{
    items: { id: string; originalName: string; url: string; mimeType: string }[];
    page: number;
    totalPages: number;
    total: number;
  }>;
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
  const [newFieldType, setNewFieldType] = useState<
    "text" | "email" | "textarea" | "select"
  >("text");
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const [coverUploadStatus, setCoverUploadStatus] = useState("");
  const [coverLibraryOpen, setCoverLibraryOpen] = useState(false);
  const [coverLibraryLoading, setCoverLibraryLoading] = useState(false);
  const [coverLibraryPage, setCoverLibraryPage] = useState(1);
  const [coverLibraryTotalPages, setCoverLibraryTotalPages] = useState(1);
  const [coverLibraryItems, setCoverLibraryItems] = useState<
    { id: string; originalName: string; url: string; mimeType: string }[]
  >([]);
  const [galleryLibraryOpen, setGalleryLibraryOpen] = useState(false);
  const [galleryLibraryLoading, setGalleryLibraryLoading] = useState(false);
  const [galleryLibraryPage, setGalleryLibraryPage] = useState(1);
  const [galleryLibraryTotalPages, setGalleryLibraryTotalPages] =
    useState(1);
  const [galleryLibraryItems, setGalleryLibraryItems] = useState<
    { id: string; originalName: string; url: string; mimeType: string }[]
  >([]);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState(0);
  const [galleryUploadStatus, setGalleryUploadStatus] = useState("");
  const [heroMediaTarget, setHeroMediaTarget] = useState<
    "cover" | "heroProgram" | "heroCollaborators"
  >("cover");
  const idPrefix = useId();
  const coverImageInputId = `${idPrefix}-cover-image-input`;
  const heroProgramLogoInputId = `${idPrefix}-hero-program-logo-input`;
  const heroCollaboratorLogosInputId = `${idPrefix}-hero-collaborators-input`;
  const titleInputId = `${idPrefix}-title-input`;
  const slugInputId = `${idPrefix}-slug-input`;
  const shortDescriptionInputId = `${idPrefix}-short-description-input`;
  const seoTitleInputId = `${idPrefix}-seo-title-input`;
  const seoDescriptionInputId = `${idPrefix}-seo-description-input`;
  const [trainerCandidate, setTrainerCandidate] = useState("");
  const heroProgramLogoInputRef = useRef<HTMLInputElement>(null);
  const heroCollaboratorLogosInputRef = useRef<HTMLInputElement>(null);

  // ── Form ──────────────────────────────────────────────────────────────────
  const form = useForm<EventFormValues>({
    defaultValues: {
      agenda: [],
      capacity: "",
      categories: [],
      contentAr: "",
      contentEn: "",
      coverImage: "",
      heroProgramLogo: "",
      heroCollaboratorLogos: "",
      heroPeopleLabelAr: "",
      heroPeopleLabelEn: "",
      featuredSessionsStat: "",
      featuredFullDayStat: "",
      heroTagsAr: "",
      heroTagsEn: "",
      showSidebarSeatsFulfillment: true,
      showSidebarPayment: true,
      endDate: "",
      eventKind: "event",
      googleMapsLink: "",
      isCertified: false,
      isFeatured: false,
      isFree: false,
      language: "both",
      location: "",
      meetingLink: "",
      meetingPlatform: "zoom",
      galleryMode: "hidden",
      galleryMediaIds: [],
      paymentMethods: "both",
      registrationType: "internal",
      externalRegistrationUrl: "",
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
  const regFields = useFieldArray({
    control: form.control,
    name: "registrationFields",
  });

  // ── Watched values ────────────────────────────────────────────────────────
  const eventType = form.watch("type");
  const eventKind = form.watch("eventKind");
  const status = form.watch("status");
  const startDate = form.watch("startDate");
  const capacity = form.watch("capacity");
  const isFree = form.watch("isFree");
  const showSidebarSeatsFulfillment = useWatch({
    control: form.control,
    name: "showSidebarSeatsFulfillment",
    defaultValue: true,
  });
  const showSidebarPayment = useWatch({
    control: form.control,
    name: "showSidebarPayment",
    defaultValue: true,
  });
  const paymentMethods = form.watch("paymentMethods");
  const registrationType = form.watch("registrationType");
  const selectedTrainerIds = form.watch("trainerIds");
  const selectedCategoryIds = form.watch("categories");
  const coverImage = form.watch("coverImage");
  const heroProgramLogo = form.watch("heroProgramLogo");
  const heroCollaboratorLogosText = form.watch("heroCollaboratorLogos");
  const heroCollaboratorLogos = heroCollaboratorLogosText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const galleryMode = form.watch("galleryMode");
  const galleryMediaIds = form.watch("galleryMediaIds");
  const shortEnLen = form.watch("shortEn").length;
  const shortArLen = form.watch("shortAr").length;
  const registrationsCount = registrations.length;
  const occupancy =
    Number(capacity || 0) > 0
      ? Math.min(
          100,
          Math.round((registrationsCount / Number(capacity || 1)) * 100),
        )
      : 0;

  // ── Derived ───────────────────────────────────────────────────────────────
  const locationLabel =
    eventType === "online"
      ? "Delivery"
      : eventType === "hybrid"
        ? "Venue & Delivery"
        : "Location";

  const agendaDays = useMemo(() => {
    const days = Array.from(
      new Set([...agenda.fields.map((f) => f.day), ...manualDays, 1]),
    );
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

  const activeTitle = form
    .watch(activeLocale === "en" ? "titleEn" : "titleAr")
    .trim();
  const contentTypeText =
    eventKind === "training_course" ? "Training Course" : "Event";
  const pageHeading =
    activeTitle ||
    (submitLabel.includes("Create")
      ? `New ${contentTypeText}`
      : `Edit ${contentTypeText}`);

  // ── Nav sections list ─────────────────────────────────────────────────────
  const sections: Array<{
    icon: React.ElementType;
    id: SectionId;
    label: string;
  }> = [
    { icon: Pencil, id: "identity", label: "Identity" },
    { icon: CalendarDays, id: "schedule", label: "Schedule" },
    { icon: MapPin, id: "location", label: locationLabel },
    { icon: CircleDollarSign, id: "pricing", label: "Pricing" },
    { icon: AlignLeft, id: "content", label: "Content" },
    { icon: LayoutList, id: "agenda", label: "Agenda" },
    { icon: Users, id: "trainers", label: "Trainers" },
    { icon: Tag, id: "categories", label: "Categories" },
    ...(registrationType === "internal"
      ? [
          {
            icon: ClipboardList,
            id: "registrationForm" as const,
            label: "Reg. Form",
          },
        ]
      : []),
    { icon: ListChecks, id: "registrations", label: "Registrations" },
  ];

  const sectionIdx = sections.findIndex((s) => s.id === activeSection);
  const prevSection = sections[sectionIdx - 1];
  const nextSection = sections[sectionIdx + 1];

  useEffect(() => {
    if (
      registrationType === "external" &&
      activeSection === "registrationForm"
    ) {
      setActiveSection("pricing");
    }
  }, [activeSection, registrationType]);

  useEffect(() => {
    form.register("showSidebarSeatsFulfillment");
    form.register("showSidebarPayment");
  }, [form]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function save(values: EventFormValues) {
    startTransition(async () => {
      const result = await onSubmit(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${contentTypeText} saved.`);
      router.refresh();
    });
  }

  function addTrainer() {
    const id = trainerCandidate || availableTrainers[0]?.value;
    if (!id) return;
    form.setValue(
      "trainerIds",
      Array.from(new Set([...selectedTrainerIds, id])),
      { shouldDirty: true },
    );
    setTrainerCandidate("");
  }

  function removeTrainer(id: string) {
    form.setValue(
      "trainerIds",
      selectedTrainerIds.filter((t) => t !== id),
      { shouldDirty: true },
    );
  }

  function toggleCategory(id: string) {
    const next = selectedCategoryIds.includes(id)
      ? selectedCategoryIds.filter((c) => c !== id)
      : [...selectedCategoryIds, id];
    form.setValue("categories", next, { shouldDirty: true });
  }

  function addRegistrationField(
    type: "text" | "email" | "textarea" | "select",
  ) {
    const id = `field-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    regFields.append({
      id,
      labelAr: "",
      labelEn: "",
      optionsAr: type === "select" ? "الخيار 1,الخيار 2" : "",
      optionsEn: type === "select" ? "Option 1,Option 2" : "",
      placeholderAr: "",
      placeholderEn: "",
      required: false,
      type,
    });
    setOpenFieldId(id);
  }

  async function uploadCoverImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
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

  async function uploadHeroProgramLogo(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    setIsCoverUploading(true);
    setCoverUploadProgress(0);
    setCoverUploadStatus("");
    try {
      const media = await uploadMediaFile(file, {
        onProgress: (percent) => setCoverUploadProgress(percent),
        onStatus: (status) => setCoverUploadStatus(status),
      });
      form.setValue("heroProgramLogo", media.url, { shouldDirty: true });
      toast.success("Program logo uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsCoverUploading(false);
    }
  }

  async function uploadHeroCollaboratorLogos(files: FileList | null) {
    if (!files || files.length === 0) return;
    const accepted = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (accepted.length === 0) {
      toast.error("Please select image files.");
      return;
    }
    setIsCoverUploading(true);
    setCoverUploadProgress(0);
    setCoverUploadStatus("");
    try {
      const urls: string[] = [];
      for (let i = 0; i < accepted.length; i++) {
        const file = accepted[i];
        const media = await uploadMediaFile(file, {
          onProgress: (percent) => {
            const overall = Math.round(
              ((i + percent / 100) / accepted.length) * 100,
            );
            setCoverUploadProgress(overall);
          },
          onStatus: (status) => setCoverUploadStatus(status),
        });
        urls.push(media.url);
      }
      const merged = Array.from(new Set([...heroCollaboratorLogos, ...urls]));
      form.setValue("heroCollaboratorLogos", merged.join("\n"), {
        shouldDirty: true,
      });
      toast.success(`${urls.length} collaborator logo(s) uploaded.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsCoverUploading(false);
    }
  }

  async function loadCoverLibraryPage(page: number) {
    setCoverLibraryLoading(true);
    try {
      if (fetchMediaPage) {
        const result = await fetchMediaPage(page, 24);
        setCoverLibraryItems(result.items);
        setCoverLibraryPage(result.page);
        setCoverLibraryTotalPages(result.totalPages);
      } else {
        const items = await fetchMedia();
        const pageSize = 24;
        const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
        const currentPage = Math.min(Math.max(1, page), totalPages);
        const start = (currentPage - 1) * pageSize;
        setCoverLibraryItems(items.slice(start, start + pageSize));
        setCoverLibraryPage(currentPage);
        setCoverLibraryTotalPages(totalPages);
      }
    } finally {
      setCoverLibraryLoading(false);
    }
  }

  async function loadGalleryLibraryPage(page: number) {
    setGalleryLibraryLoading(true);
    try {
      if (fetchGalleryMediaPage) {
        const result = await fetchGalleryMediaPage(page, 24);
        setGalleryLibraryItems(result.items);
        setGalleryLibraryPage(result.page);
        setGalleryLibraryTotalPages(result.totalPages);
      } else {
        const items = await fetchGalleryMedia();
        const pageSize = 24;
        const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
        const currentPage = Math.min(Math.max(1, page), totalPages);
        const start = (currentPage - 1) * pageSize;
        setGalleryLibraryItems(items.slice(start, start + pageSize));
        setGalleryLibraryPage(currentPage);
        setGalleryLibraryTotalPages(totalPages);
      }
    } finally {
      setGalleryLibraryLoading(false);
    }
  }

  async function openCoverLibrary(target: "cover" | "heroProgram" | "heroCollaborators" = "cover") {
    setHeroMediaTarget(target);
    await loadCoverLibraryPage(1);
    setCoverLibraryOpen(true);
  }

  async function openGalleryLibrary() {
    await loadGalleryLibraryPage(1);
    setGalleryLibraryOpen(true);
  }

  useEffect(() => {
    if (galleryMediaIds.length === 0 || galleryLibraryItems.length > 0) return;
    void (async () => {
      await loadGalleryLibraryPage(1);
    })();
  }, [
    fetchGalleryMedia,
    fetchGalleryMediaPage,
    galleryLibraryItems.length,
    galleryMediaIds.length,
  ]);

  async function uploadGalleryFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const accepted = Array.from(files).filter(
      (file) =>
        file.type.startsWith("image/") || file.type.startsWith("video/"),
    );
    if (accepted.length === 0) {
      toast.error("Please select image/video files.");
      return;
    }
    setIsGalleryUploading(true);
    setGalleryUploadProgress(0);
    setGalleryUploadStatus("");
    try {
      const createdIds: string[] = [];
      for (let i = 0; i < accepted.length; i++) {
        const file = accepted[i];
        const media = await uploadMediaFile(file, {
          onProgress: (percent) => {
            const overall = Math.round(
              ((i + percent / 100) / accepted.length) * 100,
            );
            setGalleryUploadProgress(overall);
          },
          onStatus: (status) => setGalleryUploadStatus(status),
        });
        createdIds.push(media.id);
      }
      form.setValue(
        "galleryMediaIds",
        Array.from(new Set([...galleryMediaIds, ...createdIds])),
        { shouldDirty: true },
      );
      toast.success(`${createdIds.length} gallery item(s) uploaded.`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gallery upload failed.",
      );
    } finally {
      setIsGalleryUploading(false);
    }
  }

  // ── DnD ───────────────────────────────────────────────────────────────────
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

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
    if (from !== -1 && to !== -1)
      form.setValue("trainerIds", arrayMove(ids, from, to), {
        shouldDirty: true,
      });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <form
        className="flex h-screen overflow-hidden bg-zinc-50"
        onSubmit={form.handleSubmit(save)}
      >
          {/* ════════════════════════════════════════════════════════════════
            LEFT NAV RAIL  w-52
        ════════════════════════════════════════════════════════════════ */}
          <nav className="flex h-full w-52 shrink-0 flex-col border-r border-zinc-200 bg-white">
            {/* Top: back + event title + status */}
            <div className="border-b border-zinc-100 px-4 py-4">
              <Link
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 transition-colors hover:text-zinc-700"
                href={`/${locale}/dashboard/programs`}
              >
                <ArrowLeft className="size-3" /> Programs
              </Link>
              <h1 className="mt-2 line-clamp-2 text-[13px] font-bold leading-snug text-zinc-800">
                {pageHeading}
              </h1>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    status === "published"
                      ? "animate-pulse bg-teal-500"
                      : "bg-zinc-300",
                  )}
                />
                <span className="text-[11px] font-semibold text-zinc-400">
                  {statusLabels[status]}
                </span>
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
          </nav>

          {/* ════════════════════════════════════════════════════════════════
            MAIN PANEL  flex-1
            Only the active section renders (tabbed, not scroll)
        ════════════════════════════════════════════════════════════════ */}
          <main className="flex h-full flex-1 min-w-0 flex-col overflow-hidden">
            {/* Breadcrumb bar */}
            <div className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-zinc-100 bg-white px-7 py-3 text-[12px]">
              <span className="text-zinc-400">Programs</span>
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
                  href={`/${locale}/dashboard/programs`}
                >
                  Discard
                </Link>
                <Button
                  className="h-8 bg-teal-600 px-3 text-[12px] font-semibold hover:bg-teal-700"
                  disabled={isPending}
                  type="submit"
                >
                  {isPending && (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  )}
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
                  Delivery mode · language of instruction
              ───────────────────────────────────────────────────────── */}
                {activeSection === "identity" && (
                  <FieldSet className="">
                    <SectionHeader
                      description="Cover image, titles, URL slug, type and language"
                      icon={Pencil}
                      number="01"
                      title="Identity"
                    />

                    {/* Cover image upload */}
                    <Field className="grid gap-2">
                          <FieldLabel htmlFor={coverImageInputId}>Cover Image</FieldLabel>
                          <input
                            ref={coverInputRef}
                            accept="image/*"
                            className="sr-only"
                            id={coverImageInputId}
                            type="file"
                            onChange={(e) =>
                              void uploadCoverImage(e.target.files?.[0])
                            }
                          />
                          <button
                            className={cn(
                              "group relative flex w-full cursor-pointer items-center justify-center overflow-hidden",
                              "rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 transition-colors",
                              "hover:border-teal-400 hover:bg-teal-50/30",
                              isCoverUploading &&
                                "pointer-events-none opacity-60",
                            )}
                            style={{ height: 172 }}
                            type="button"
                            onClick={() => coverInputRef.current?.click()}
                          >
                            {coverImage ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  alt="Cover"
                                  className="absolute inset-0 h-full w-full object-cover"
                                  src={coverImage}
                                />
                                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                  <Upload className="size-4 text-white" />
                                  <span className="text-[13px] font-semibold text-white">
                                    Replace image
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-zinc-400">
                                {isCoverUploading ? (
                                  <Loader2 className="size-6 animate-spin text-teal-500" />
                                ) : (
                                  <ImageIcon className="size-7 text-zinc-300" />
                                )}
                                <span className="text-[13px] font-medium">
                                  {isCoverUploading
                                    ? `Uploading… ${coverUploadProgress}%`
                                    : "Upload cover image"}
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
                              <Button
                                className="h-7 text-[11.5px]"
                                size="sm"
                                type="button"
                                variant="outline"
                                onClick={() => coverInputRef.current?.click()}
                              >
                                <Upload className="mr-1 size-3" /> Replace
                              </Button>
                              <Button
                                className="h-7 text-[11.5px] text-red-500 hover:text-red-600"
                                size="sm"
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  form.setValue("coverImage", "", {
                                    shouldDirty: true,
                                  })
                                }
                              >
                                <X className="mr-1 size-3" /> Remove
                              </Button>
                              <Button
                                className="h-7 text-[11.5px]"
                                disabled={
                                  coverLibraryLoading || isCoverUploading
                                }
                                size="sm"
                                type="button"
                                variant="outline"
                                onClick={() => void openCoverLibrary()}
                              >
                                {coverLibraryLoading ? (
                                  <Loader2 className="mr-1 size-3 animate-spin" />
                                ) : (
                                  <Search className="mr-1 size-3" />
                                )}{" "}
                                Browse
                              </Button>
                            </div>
                          ) : (
                            <div className="mt-2 flex gap-2">
                              <Button
                                className="h-7 text-[11.5px]"
                                disabled={
                                  coverLibraryLoading || isCoverUploading
                                }
                                size="sm"
                                type="button"
                                variant="outline"
                                onClick={() => void openCoverLibrary()}
                              >
                                {coverLibraryLoading ? (
                                  <Loader2 className="mr-1 size-3 animate-spin" />
                                ) : (
                                  <Search className="mr-1 size-3" />
                                )}{" "}
                                Browse library
                              </Button>
                            </div>
                          )}
                          <input className="sr-only" type="text" {...form.register("coverImage")} />
                          <FieldError errors={[form.formState.errors.coverImage]} />
                    </Field>

                    <FieldGroup className="grid gap-3 md:grid-cols-2">
                      <Field className="grid gap-2">
                        <FieldLabel htmlFor={heroProgramLogoInputId}>
                          Hero Program Logo
                        </FieldLabel>
                        <input
                          ref={heroProgramLogoInputRef}
                          accept="image/*"
                          className="sr-only"
                          id={heroProgramLogoInputId}
                          type="file"
                          onChange={(e) =>
                            void uploadHeroProgramLogo(e.target.files?.[0])
                          }
                        />
                        <div className="rounded-md border border-zinc-200 bg-white p-2">
                          {heroProgramLogo ? (
                            <div className="relative h-16 w-40 overflow-hidden rounded bg-zinc-50">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img alt="Hero program logo" className="h-full w-full object-contain p-2" src={heroProgramLogo} />
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-400">No logo selected</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button className="h-7 text-[11.5px]" size="sm" type="button" variant="outline" onClick={() => heroProgramLogoInputRef.current?.click()}>
                            <Upload className="mr-1 size-3" /> Replace
                          </Button>
                          <Button className="h-7 text-[11.5px]" size="sm" type="button" variant="outline" onClick={() => void openCoverLibrary("heroProgram")}>
                            <Search className="mr-1 size-3" /> Browse
                          </Button>
                          <Button className="h-7 text-[11.5px] text-red-500 hover:text-red-600" size="sm" type="button" variant="outline" onClick={() => form.setValue("heroProgramLogo", "", { shouldDirty: true })}>
                            <X className="mr-1 size-3" /> Remove
                          </Button>
                        </div>
                        <FieldDescription>
                          Shown beside the featured hero title.
                        </FieldDescription>
                      </Field>
                      <Field className="grid gap-2">
                        <FieldLabel htmlFor={heroCollaboratorLogosInputId}>
                          Collaborator Logos
                        </FieldLabel>
                        <input
                          ref={heroCollaboratorLogosInputRef}
                          accept="image/*"
                          className="sr-only"
                          id={heroCollaboratorLogosInputId}
                          multiple
                          type="file"
                          onChange={(e) =>
                            void uploadHeroCollaboratorLogos(e.target.files)
                          }
                        />
                        <div className="rounded-md border border-zinc-200 bg-white p-2">
                          {heroCollaboratorLogos.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {heroCollaboratorLogos.map((url) => (
                                <div className="group relative h-12 w-24 overflow-hidden rounded border border-zinc-200 bg-zinc-50" key={url}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img alt="Collaborator logo" className="h-full w-full object-contain p-1" src={url} />
                                  <button
                                    className="absolute right-0 top-0 hidden bg-black/65 px-1 py-0.5 text-[10px] text-white group-hover:block"
                                    type="button"
                                    onClick={() =>
                                      form.setValue(
                                        "heroCollaboratorLogos",
                                        heroCollaboratorLogos.filter((item) => item !== url).join("\n"),
                                        { shouldDirty: true },
                                      )
                                    }
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-400">No collaborator logos selected</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button className="h-7 text-[11.5px]" size="sm" type="button" variant="outline" onClick={() => heroCollaboratorLogosInputRef.current?.click()}>
                            <Upload className="mr-1 size-3" /> Replace
                          </Button>
                          <Button className="h-7 text-[11.5px]" size="sm" type="button" variant="outline" onClick={() => void openCoverLibrary("heroCollaborators")}>
                            <Search className="mr-1 size-3" /> Browse
                          </Button>
                          <Button
                            className="h-7 text-[11.5px] text-red-500 hover:text-red-600"
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={() =>
                              form.setValue("heroCollaboratorLogos", "", {
                                shouldDirty: true,
                              })
                            }
                          >
                            <X className="mr-1 size-3" /> Remove
                          </Button>
                        </div>
                        <FieldDescription>
                          These render in the featured hero as partner logos.
                        </FieldDescription>
                      </Field>
                    </FieldGroup>
                    <Field className="grid gap-2">
                      <FieldLabel>
                        People Label ({activeLocale.toUpperCase()})
                      </FieldLabel>
                      <Input
                        className={inputCls}
                        dir={activeLocale === "ar" ? "rtl" : "ltr"}
                        placeholder={
                          activeLocale === "ar" ? "المدربون" : "Trainers"
                        }
                        value={form.watch(activeLocale === "en" ? "heroPeopleLabelEn" : "heroPeopleLabelAr")}
                        onChange={(e) =>
                          form.setValue(
                            activeLocale === "en"
                              ? "heroPeopleLabelEn"
                              : "heroPeopleLabelAr",
                            e.target.value,
                            { shouldDirty: true },
                          )
                        }
                      />
                      <FieldDescription>
                        If empty, default label is used automatically.
                      </FieldDescription>
                    </Field>
                    <FieldGroup className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Field className="grid gap-2">
                        <FieldLabel htmlFor={`${idPrefix}-featured-sessions-stat`}>
                          Featured Sessions Stat
                        </FieldLabel>
                        <Input
                          className={inputCls}
                          id={`${idPrefix}-featured-sessions-stat`}
                          placeholder="8+"
                          {...form.register("featuredSessionsStat")}
                        />
                        <FieldDescription>
                          Value shown for the Sessions stat on featured program pages.
                        </FieldDescription>
                      </Field>
                      <Field className="grid gap-2">
                        <FieldLabel htmlFor={`${idPrefix}-featured-full-day-stat`}>
                          Featured Full Day Stat
                        </FieldLabel>
                        <Input
                          className={inputCls}
                          id={`${idPrefix}-featured-full-day-stat`}
                          placeholder="2 Days"
                          {...form.register("featuredFullDayStat")}
                        />
                        <FieldDescription>
                          Value shown for the Full Day stat on featured program pages.
                        </FieldDescription>
                      </Field>
                    </FieldGroup>
                    <Field className="grid gap-2">
                      <FieldLabel>
                        Hero Tags ({activeLocale.toUpperCase()}, one per line)
                      </FieldLabel>
                      <Textarea
                        className={cn(inputCls, "min-h-24 py-2")}
                        dir={activeLocale === "ar" ? "rtl" : "ltr"}
                        placeholder={
                          activeLocale === "ar"
                            ? "القيادة\nعلم النفس"
                            : "Leadership\nPsychology"
                        }
                        value={form.watch(activeLocale === "en" ? "heroTagsEn" : "heroTagsAr")}
                        onChange={(e) =>
                          form.setValue(
                            activeLocale === "en" ? "heroTagsEn" : "heroTagsAr",
                            e.target.value,
                            { shouldDirty: true },
                          )
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        {(form
                          .watch(activeLocale === "en" ? "heroTagsEn" : "heroTagsAr")
                          .split("\n")
                          .map((item) => item.trim())
                          .filter(Boolean)).map((tag) => (
                          <Badge className="border-teal-200 bg-teal-50 text-teal-700" key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <FieldDescription>
                        Locale-aware tags. Switch EN/AR above to edit each locale.
                      </FieldDescription>
                    </Field>

                    {/* Title + inline editable slug */}
                    <Field className="grid gap-2">
                          <FieldLabel htmlFor={titleInputId}>Title</FieldLabel>
                          <FieldContent>
                            <Input
                              className={cn(
                                inputCls,
                                "text-[15px] font-semibold",
                              )}
                              dir={activeLocale === "ar" ? "rtl" : "ltr"}
                              id={titleInputId}
                              placeholder={
                                activeLocale === "en"
                                  ? "Event title in English"
                                  : "عنوان الفعالية بالعربية"
                              }
                              value={
                                form.watch(
                                  activeLocale === "en" ? "titleEn" : "titleAr",
                                ) ?? ""
                              }
                              onChange={(e) => {
                                form.setValue(
                                  activeLocale === "en" ? "titleEn" : "titleAr",
                                  e.target.value,
                                  { shouldDirty: true },
                                );
                                const cur = form.getValues("slug");
                                const auto = toSlug(form.getValues("titleEn"));
                                if (!cur || cur === auto) {
                                  form.setValue(
                                    "slug",
                                    toSlug(e.target.value),
                                    { shouldDirty: true },
                                  );
                                }
                              }}
                            />
                          </FieldContent>
                          <FieldError
                            errors={[
                              activeLocale === "en"
                                ? form.formState.errors.titleEn
                                : form.formState.errors.titleAr,
                            ]}
                          />
                          {/* Inline slug — directly beneath title */}
                          
                              <div className="mt-1.5 flex items-stretch overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 text-[11.5px] shadow-xs focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-500/10">
                                <span className="flex items-center border-r border-zinc-200 bg-zinc-100 px-2.5 font-medium text-zinc-400 select-none whitespace-nowrap">
                                  kayan.om/events/
                                </span>
                                <input
                                  className="flex-1 min-w-0 bg-transparent px-2.5 py-1.5 font-mono font-semibold text-teal-600! outline-none placeholder:text-zinc-300"
                                  id={slugInputId}
                                  placeholder="event-slug"
                                  spellCheck={false}
                                  {...form.register("slug")}
                                  onBlur={(e) => {
                                    form.setValue(
                                      "slug",
                                      toSlug(e.target.value) || "event-slug",
                                      { shouldDirty: true },
                                    );
                                  }}
                                />
                                <span className="flex items-center px-2 text-zinc-300">
                                  <Pencil className="size-3" />
                                </span>
                              </div>
                              <FieldError errors={[form.formState.errors.slug]} />
                        </Field>

                    {/* Short description */}
                    {(() => {
                        const count =
                          activeLocale === "en" ? shortEnLen : shortArLen;
                        return (
                          <Field className="grid gap-2">
                            <div className="mb-1.5 flex items-center justify-between">
                              <FieldLabel htmlFor={shortDescriptionInputId}>
                                Short Description
                                <span className="ml-1.5 font-normal normal-case tracking-normal text-zinc-400">
                                  shown in listings
                                </span>
                              </FieldLabel>
                              <span
                                className={cn(
                                  "font-mono text-[10.5px] font-semibold",
                                  count > 144
                                    ? "text-red-500"
                                    : count > 120
                                      ? "text-amber-500"
                                      : "text-zinc-300",
                                )}
                              >
                                {count} / 160
                              </span>
                            </div>
                            <FieldContent>
                              <Textarea
                                className={cn(
                                  inputCls,
                                  "h-auto resize-none py-2",
                                )}
                                dir={activeLocale === "ar" ? "rtl" : "ltr"}
                                id={shortDescriptionInputId}
                                maxLength={160}
                                placeholder={
                                  activeLocale === "en"
                                    ? "A concise summary shown in event cards…"
                                    : "ملخص قصير يظهر في بطاقات الفعاليات…"
                                }
                                rows={2}
                                value={
                                  form.watch(
                                    activeLocale === "en" ? "shortEn" : "shortAr",
                                  ) ?? ""
                                }
                                onChange={(e) =>
                                  form.setValue(
                                    activeLocale === "en" ? "shortEn" : "shortAr",
                                    e.target.value,
                                    { shouldDirty: true },
                                  )
                                }
                              />
                            </FieldContent>
                            <FieldError
                              errors={[
                                activeLocale === "en"
                                  ? form.formState.errors.shortEn
                                  : form.formState.errors.shortAr,
                              ]}
                            />
                          </Field>
                        );
                      })()}

                    {/* Delivery mode + language */}
                    <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field className="grid gap-2">
                            <EnumSelect
                              label="Delivery Mode"
                              onChange={(value) =>
                                form.setValue("type", value, {
                                  shouldDirty: true,
                                })
                              }
                              options={eventTypeLabels}
                              value={form.watch("type")}
                            />
                            <FieldError errors={[form.formState.errors.type]} />
                      </Field>
                      <Field className="grid gap-2">
                            <EnumSelect
                              label="Language of Instruction"
                              onChange={(value) =>
                                form.setValue("language", value, {
                                  shouldDirty: true,
                                })
                              }
                              options={languageLabels}
                              value={form.watch("language")}
                            />
                            <FieldError errors={[form.formState.errors.language]} />
                      </Field>
                    </FieldGroup>

                    <div className="h-px border-0 bg-zinc-100" />

                    {/* SEO moved from right sidebar into Identity tab */}
                    <FieldSet className="">
                      <FieldLegend variant="label">SEO Metadata</FieldLegend>
                      <Field className="grid gap-2">
                            <FieldLabel htmlFor={seoTitleInputId}>
                              <FieldTitle>
                                SEO Title ({activeLocale.toUpperCase()})
                              </FieldTitle>
                            </FieldLabel>
                            <FieldContent>
                              <Input
                                className={inputCls}
                                dir={activeLocale === "ar" ? "rtl" : "ltr"}
                                id={seoTitleInputId}
                                value={
                                  form.watch(
                                    activeLocale === "en"
                                      ? "seoTitleEn"
                                      : "seoTitleAr",
                                  ) ?? ""
                                }
                                onChange={(e) =>
                                  form.setValue(
                                    activeLocale === "en"
                                      ? "seoTitleEn"
                                      : "seoTitleAr",
                                    e.target.value,
                                    { shouldDirty: true },
                                  )
                                }
                              />
                            </FieldContent>
                            <FieldError
                              errors={[
                                activeLocale === "en"
                                  ? form.formState.errors.seoTitleEn
                                  : form.formState.errors.seoTitleAr,
                              ]}
                            />
                            <FieldDescription>
                              Prefer 50-60 characters for search result titles.
                            </FieldDescription>
                      </Field>
                      <Field className="grid gap-2">
                            <FieldLabel htmlFor={seoDescriptionInputId}>
                              SEO Description ({activeLocale.toUpperCase()})
                            </FieldLabel>
                            <FieldContent>
                              <Textarea
                                className={cn(
                                  inputCls,
                                  "h-auto resize-none py-2",
                                )}
                                dir={activeLocale === "ar" ? "rtl" : "ltr"}
                                id={seoDescriptionInputId}
                                rows={3}
                                value={
                                  form.watch(
                                    activeLocale === "en"
                                      ? "seoDescriptionEn"
                                      : "seoDescriptionAr",
                                  ) ?? ""
                                }
                                onChange={(e) =>
                                  form.setValue(
                                    activeLocale === "en"
                                      ? "seoDescriptionEn"
                                      : "seoDescriptionAr",
                                    e.target.value,
                                    { shouldDirty: true },
                                  )
                                }
                              />
                            </FieldContent>
                            <FieldError
                              errors={[
                                activeLocale === "en"
                                  ? form.formState.errors.seoDescriptionEn
                                  : form.formState.errors.seoDescriptionAr,
                              ]}
                            />
                            <FieldDescription>
                              Keep this concise for better click-through in listings.
                            </FieldDescription>
                      </Field>
                    </FieldSet>
                  </FieldSet>
                )}

                {/* ─────────────────────────────────────────────────────────
                  §02  SCHEDULE
                  Start · end · registration deadline · capacity
              ───────────────────────────────────────────────────────── */}
                {activeSection === "schedule" && (
                  <FieldSet className="">
                    <SectionHeader
                      description="Dates, capacity and registration window"
                      icon={CalendarDays}
                      number="02"
                      title="Schedule"
                    />
                    <FieldGroup className="grid grid-cols-2 gap-4">
                      <Field className="grid gap-2">
                        <FieldLabel htmlFor={`${idPrefix}-start-date`}>Start Date</FieldLabel>
                        <FieldContent>
                          <Input
                            className={inputCls}
                            id={`${idPrefix}-start-date`}
                            type="date"
                            {...form.register("startDate")}
                          />
                        </FieldContent>
                        <FieldError errors={[form.formState.errors.startDate]} />
                      </Field>
                      <Field className="grid gap-2">
                        <FieldLabel htmlFor={`${idPrefix}-end-date`}>End Date</FieldLabel>
                        <FieldContent>
                          <Input
                            className={inputCls}
                            id={`${idPrefix}-end-date`}
                            type="date"
                            {...form.register("endDate")}
                          />
                        </FieldContent>
                        <FieldError errors={[form.formState.errors.endDate]} />
                      </Field>
                      <Field className="grid gap-2">
                        <div className="mb-1.5 flex items-center justify-between">
                          <FieldLabel htmlFor={`${idPrefix}-registration-deadline`}>
                            Registration Deadline
                          </FieldLabel>
                          <span className="text-[11px] text-zinc-400">optional</span>
                        </div>
                        <FieldContent>
                          <Input
                            className={inputCls}
                            id={`${idPrefix}-registration-deadline`}
                            type="date"
                            {...form.register("registrationDeadline")}
                          />
                        </FieldContent>
                        <FieldError errors={[form.formState.errors.registrationDeadline]} />
                      </Field>
                      <Field className="grid gap-2">
                        <div className="mb-1.5 flex items-center justify-between">
                          <FieldLabel htmlFor={`${idPrefix}-capacity`}>Capacity</FieldLabel>
                          <span className="text-[11px] text-zinc-400">max seats</span>
                        </div>
                        <FieldContent>
                          <Input
                            className={inputCls}
                            id={`${idPrefix}-capacity`}
                            min={1}
                            placeholder="e.g. 40"
                            type="number"
                            {...form.register("capacity")}
                          />
                        </FieldContent>
                        <FieldError errors={[form.formState.errors.capacity]} />
                      </Field>
                    </FieldGroup>
                    <Note>
                      Capacity is enforced automatically — registrations close
                      once the limit is reached, without any manual action
                      needed.
                    </Note>
                  </FieldSet>
                )}

                {/* ─────────────────────────────────────────────────────────
                  §03  LOCATION
                  Conditional blocks: onsite / online / hybrid
              ───────────────────────────────────────────────────────── */}
                {activeSection === "location" && (
                  <FieldSet className="">
                    <SectionHeader
                      description={
                        eventType === "online"
                          ? "Meeting platform and join link"
                          : eventType === "hybrid"
                            ? "Venue address plus online delivery link"
                            : "Venue details and map embed settings"
                      }
                      icon={MapPin}
                      number="03"
                      title={locationLabel}
                    />

                    {/* Onsite / Hybrid: venue + map */}
                    {(eventType === "onsite" || eventType === "hybrid") && (
                      <>
                        <Field className="grid gap-2">
                          <FieldLabel htmlFor={`${idPrefix}-location`}>Venue Name / Address</FieldLabel>
                          <FieldContent>
                            <div className="relative">
                              <MapPin className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                              <Input
                                className={cn(inputCls, "pl-8")}
                                id={`${idPrefix}-location`}
                                placeholder="Grand Hyatt Muscat, Al Shati Street"
                                {...form.register("location")}
                              />
                            </div>
                          </FieldContent>
                          <FieldError errors={[form.formState.errors.location]} />
                        </Field>
                        <FieldGroup className="grid grid-cols-2 gap-4">
                          <Field className="grid gap-2">
                            <FieldLabel htmlFor={`${idPrefix}-google-maps-link`}>Google Maps Link</FieldLabel>
                            <FieldContent>
                              <div className="relative">
                                <Link2 className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                                <Input
                                  className={cn(inputCls, "pl-8")}
                                  id={`${idPrefix}-google-maps-link`}
                                  placeholder="https://maps.google.com/…"
                                  type="url"
                                  {...form.register("googleMapsLink")}
                                />
                              </div>
                            </FieldContent>
                            <FieldError errors={[form.formState.errors.googleMapsLink]} />
                          </Field>
                          <Field className="grid gap-2">
                            <FieldLabel>Map Embed</FieldLabel>
                            <ToggleControl
                              checked={form.watch("showMapEmbed")}
                              description="Show interactive map on event page"
                              iconBg="bg-teal-50"
                              iconEl={<MapPin className="size-4 text-teal-600" />}
                              title="Show map embed"
                              onCheckedChange={(v) =>
                                form.setValue("showMapEmbed", v, {
                                  shouldDirty: true,
                                })
                              }
                            />
                            <FieldError errors={[form.formState.errors.showMapEmbed]} />
                          </Field>
                        </FieldGroup>
                      </>
                    )}

                    {/* Online / Hybrid: meeting platform + link */}
                    {(eventType === "online" || eventType === "hybrid") && (
                      <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
                        <div className="flex items-center gap-2">
                          <Video className="size-4 text-teal-600" />
                          <p className="text-[13px] font-semibold text-zinc-700">
                            Online Delivery
                          </p>
                        </div>
                        <Field className="grid gap-2">
                              <FieldLabel>Platform</FieldLabel>
                              <div className="flex flex-wrap gap-2">
                                {(
                                  Object.entries(platformLabels) as [
                                    keyof typeof platformLabels,
                                    string,
                                  ][]
                                ).map(([v, lbl]) => (
                                  <button
                                    className={cn(
                                      "rounded-md border px-3 py-1.5 text-[12px] font-semibold transition-all",
                                      form.watch("meetingPlatform") === v
                                        ? "border-teal-500 bg-teal-50 text-teal-700"
                                        : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300",
                                    )}
                                    key={v}
                                    type="button"
                                    onClick={() =>
                                      form.setValue("meetingPlatform", v, {
                                        shouldDirty: true,
                                      })
                                    }
                                  >
                                    {lbl}
                                  </button>
                                ))}
                              </div>
                              <FieldError errors={[form.formState.errors.meetingPlatform]} />
                        </Field>
                        <Field className="grid gap-2">
                              <FieldLabel htmlFor={`${idPrefix}-meeting-link`}>Meeting Link</FieldLabel>
                              <FieldContent>
                                <div className="relative">
                                  <Link2 className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                                  <Input
                                    className={cn(inputCls, "pl-8")}
                                    id={`${idPrefix}-meeting-link`}
                                    placeholder="https://zoom.us/j/…"
                                    type="url"
                                    {...form.register("meetingLink")}
                                  />
                                </div>
                              </FieldContent>
                              <FieldError errors={[form.formState.errors.meetingLink]} />
                        </Field>
                        <p className="text-[11.5px] text-zinc-400">
                          Sent only to registered participants — not publicly
                          visible.
                        </p>
                      </div>
                    )}
                  </FieldSet>
                )}

                {/* ─────────────────────────────────────────────────────────
                  §04  PRICING
                  Free toggle · price (OMR) · payment methods
              ───────────────────────────────────────────────────────── */}
                {activeSection === "pricing" && (
                  <FieldSet className="">
                    <SectionHeader
                      description="Fees and accepted payment methods"
                      icon={CircleDollarSign}
                      number="04"
                      title="Pricing"
                    />
                    <FieldGroup className="grid grid-cols-2 gap-4">
                      <Field className="grid gap-2">
                        <EnumSelect
                          label="Registration Type"
                          onChange={(value) =>
                            form.setValue("registrationType", value, {
                              shouldDirty: true,
                            })
                          }
                          options={registrationTypeLabels}
                          value={form.watch("registrationType")}
                        />
                        <FieldError errors={[form.formState.errors.registrationType]} />
                      </Field>
                      {registrationType === "external" ? (
                        <Field className="grid gap-2">
                          <FieldLabel htmlFor={`${idPrefix}-external-registration-url`}>
                            External Registration URL
                          </FieldLabel>
                          <FieldContent>
                            <Input
                              className={inputCls}
                              id={`${idPrefix}-external-registration-url`}
                              placeholder="https://..."
                              type="url"
                              {...form.register("externalRegistrationUrl")}
                            />
                          </FieldContent>
                          <FieldError errors={[form.formState.errors.externalRegistrationUrl]} />
                        </Field>
                      ) : (
                        <div />
                      )}
                    </FieldGroup>
                    <Field className="grid gap-2">
                      <ToggleControl
                        checked={form.watch("isFree")}
                        description="Hides the price and removes payment requirement entirely"
                        iconBg="bg-teal-50"
                        iconEl={<CircleDollarSign className="size-4 text-teal-600" />}
                        title="Mark as free event"
                        onCheckedChange={(v) =>
                          form.setValue("isFree", v, {
                            shouldDirty: true,
                          })
                        }
                      />
                    </Field>
                    <FieldGroup className="grid grid-cols-2 gap-4">
                      <Field className="grid gap-2">
                        <ToggleControl
                          checked={showSidebarSeatsFulfillment}
                          description="Controls the seats progress bar on the public page sidebar"
                          iconBg="bg-cyan-50"
                          iconEl={<Users className="size-4 text-cyan-600" />}
                          title="Show seats fulfillment bar"
                          onCheckedChange={(v) =>
                            form.setValue("showSidebarSeatsFulfillment", v, {
                              shouldDirty: true,
                              shouldTouch: true,
                            })
                          }
                        />
                      </Field>
                      <Field className="grid gap-2">
                        <ToggleControl
                          checked={showSidebarPayment}
                          description="Controls the price/payment summary visibility in the sidebar card"
                          iconBg="bg-emerald-50"
                          iconEl={<CircleDollarSign className="size-4 text-emerald-600" />}
                          title="Show payment summary"
                          onCheckedChange={(v) =>
                            form.setValue("showSidebarPayment", v, {
                              shouldDirty: true,
                              shouldTouch: true,
                            })
                          }
                        />
                      </Field>
                    </FieldGroup>
                    {isFree ? (
                      <Note>
                        This event is free — price and payment fields are hidden
                        from learners.
                      </Note>
                    ) : (
                      <div className="space-y-4">
                        <FieldGroup className="grid grid-cols-2 gap-4">
                          <Field className="grid gap-2">
                                <FieldLabel htmlFor={`${idPrefix}-price`}>Price</FieldLabel>
                                <div className="flex h-9 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-xs focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/10">
                                  <span className="flex items-center border-r border-zinc-200 bg-zinc-50 px-3 text-[11px] font-bold text-zinc-500">
                                    OMR
                                  </span>
                                  <input
                                    className="flex-1 min-w-0 bg-transparent px-3 text-sm text-zinc-900 outline-none"
                                    id={`${idPrefix}-price`}
                                    min={0}
                                    step="0.001"
                                    type="number"
                                    {...form.register("price")}
                                  />
                                </div>
                                <FieldError errors={[form.formState.errors.price]} />
                          </Field>
                          <Field className="grid gap-2">
                            <EnumSelect
                              label="Payment Methods"
                              onChange={(value) =>
                                form.setValue("paymentMethods", value, {
                                  shouldDirty: true,
                                })
                              }
                              options={paymentLabels}
                              value={form.watch("paymentMethods")}
                            />
                            <FieldError errors={[form.formState.errors.paymentMethods]} />
                          </Field>
                        </FieldGroup>
                        {(paymentMethods === "both" ||
                          paymentMethods === "bank") && (
                          <FieldSet className="rounded-xl border border-zinc-200 bg-white p-4">
                            <FieldLegend>Bank Transfer Details</FieldLegend>
                            <FieldGroup className="grid grid-cols-2 gap-3">
                              <Field className="grid gap-2">
                                <FieldLabel htmlFor={`${idPrefix}-bank-name`}>Bank Name</FieldLabel>
                                <FieldContent>
                                  <Input
                                    className={inputCls}
                                    id={`${idPrefix}-bank-name`}
                                    {...form.register("bankName")}
                                  />
                                </FieldContent>
                                <FieldError errors={[form.formState.errors.bankName]} />
                              </Field>
                              <Field className="grid gap-2">
                                <FieldLabel htmlFor={`${idPrefix}-bank-account-name`}>Account Name</FieldLabel>
                                <FieldContent>
                                  <Input
                                    className={inputCls}
                                    id={`${idPrefix}-bank-account-name`}
                                    {...form.register("bankAccountName")}
                                  />
                                </FieldContent>
                                <FieldError errors={[form.formState.errors.bankAccountName]} />
                              </Field>
                              <Field className="grid gap-2">
                                <FieldLabel htmlFor={`${idPrefix}-bank-iban`}>IBAN</FieldLabel>
                                <FieldContent>
                                  <Input
                                    className={inputCls}
                                    id={`${idPrefix}-bank-iban`}
                                    {...form.register("bankIban")}
                                  />
                                </FieldContent>
                                <FieldError errors={[form.formState.errors.bankIban]} />
                              </Field>
                              <Field className="grid gap-2">
                                <FieldLabel htmlFor={`${idPrefix}-bank-swift`}>SWIFT</FieldLabel>
                                <FieldContent>
                                  <Input
                                    className={inputCls}
                                    id={`${idPrefix}-bank-swift`}
                                    {...form.register("bankSwift")}
                                  />
                                </FieldContent>
                                <FieldError errors={[form.formState.errors.bankSwift]} />
                              </Field>
                              <Field className="col-span-2 grid gap-2">
                                <FieldLabel htmlFor={`${idPrefix}-bank-instructions-en`}>
                                  Instructions (EN)
                                </FieldLabel>
                                <FieldContent>
                                  <Textarea
                                    className={cn(inputCls, "h-auto py-2")}
                                    id={`${idPrefix}-bank-instructions-en`}
                                    rows={2}
                                    {...form.register("bankInstructionsEn")}
                                  />
                                </FieldContent>
                                <FieldError errors={[form.formState.errors.bankInstructionsEn]} />
                              </Field>
                              <Field className="col-span-2 grid gap-2">
                                <FieldLabel htmlFor={`${idPrefix}-bank-instructions-ar`}>
                                  Instructions (AR)
                                </FieldLabel>
                                <FieldContent>
                                  <Textarea
                                    className={cn(inputCls, "h-auto py-2")}
                                    dir="rtl"
                                    id={`${idPrefix}-bank-instructions-ar`}
                                    rows={2}
                                    {...form.register("bankInstructionsAr")}
                                  />
                                </FieldContent>
                                <FieldError errors={[form.formState.errors.bankInstructionsAr]} />
                              </Field>
                            </FieldGroup>
                          </FieldSet>
                        )}
                      </div>
                    )}
                  </FieldSet>
                )}

                {/* ─────────────────────────────────────────────────────────
                  §05  CONTENT
                  Short description (bilingual) + Tiptap rich text
                  IMPORTANT: RichTextEditor is NOT wrapped in any container
                  that would clip or resize it. Props are passed directly.
              ───────────────────────────────────────────────────────── */}
                {activeSection === "content" && (
                  <FieldSet className="">
                    <SectionHeader
                      description="Rich text content shown on the public event detail page"
                      icon={AlignLeft}
                      number="05"
                      title="Content"
                    />

                    {/* Short description */}
                    {(() => {
                      const count = activeLocale === "en" ? shortEnLen : shortArLen;
                      return (
                        <Field className="grid gap-2">
                            <div className="mb-1.5 flex items-center justify-between">
                              <FieldLabel htmlFor={`${idPrefix}-content-short`}>
                                Short Description
                                <span className="ml-1.5 font-normal normal-case tracking-normal text-zinc-400">
                                  shown in listings
                                </span>
                              </FieldLabel>
                              <span
                                className={cn(
                                  "font-mono text-[10.5px] font-semibold",
                                  count > 144
                                    ? "text-red-500"
                                    : count > 120
                                      ? "text-amber-500"
                                      : "text-zinc-300",
                                )}
                              >
                                {count} / 160
                              </span>
                            </div>
                            <FieldContent>
                              <Textarea
                                className={cn(
                                  inputCls,
                                  "h-auto resize-none py-2",
                                )}
                                dir={activeLocale === "ar" ? "rtl" : "ltr"}
                                id={`${idPrefix}-content-short`}
                                maxLength={160}
                                placeholder={
                                  activeLocale === "en"
                                    ? "A concise summary shown in event cards and search results…"
                                    : "ملخص قصير يظهر في بطاقات الفعاليات…"
                                }
                                rows={2}
                                value={
                                  form.watch(
                                    activeLocale === "en" ? "shortEn" : "shortAr",
                                  ) ?? ""
                                }
                                onChange={(e) =>
                                  form.setValue(
                                    activeLocale === "en" ? "shortEn" : "shortAr",
                                    e.target.value,
                                    { shouldDirty: true },
                                  )
                                }
                              />
                            </FieldContent>
                            <FieldError
                              errors={[
                                activeLocale === "en"
                                  ? form.formState.errors.shortEn
                                  : form.formState.errors.shortAr,
                              ]}
                            />
                        </Field>
                      );
                    })()}

                    {/* Long description — Tiptap (unwrapped) */}
                    <Field className="grid gap-2">
                          <div className="mb-1.5 flex items-center justify-between">
                            <FieldLabel>
                              Long Description
                              <span className="ml-1.5 font-normal normal-case tracking-normal text-zinc-400">
                                Powered by Tiptap
                              </span>
                            </FieldLabel>
                          </div>
                          {/* RichTextEditor manages its own border/toolbar — no wrapper */}
                          <RichTextEditor
                            dir={activeLocale === "ar" ? "rtl" : "ltr"}
                            onChange={(value) =>
                              form.setValue(
                                activeLocale === "en" ? "contentEn" : "contentAr",
                                value,
                                { shouldDirty: true },
                              )
                            }
                            placeholder="Build the full event page content — headings, lists, tables, images…"
                            value={
                              form.watch(
                                activeLocale === "en" ? "contentEn" : "contentAr",
                              ) ?? ""
                            }
                          />
                          <FieldError
                            errors={[
                              activeLocale === "en"
                                ? form.formState.errors.contentEn
                                : form.formState.errors.contentAr,
                            ]}
                          />
                    </Field>

                    <div className="rounded-xl border border-zinc-200 bg-white p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-semibold text-zinc-800">
                            Program Gallery
                          </p>
                          <p className="text-[11.5px] text-zinc-400">
                            Photos and videos shown on the public program page.
                          </p>
                        </div>
                        <Badge variant="outline">
                          {galleryMediaIds.length} items
                        </Badge>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field className="grid gap-2">
                          <EnumSelect
                            label="Gallery Visibility"
                            onChange={(value) =>
                              form.setValue("galleryMode", value, {
                                shouldDirty: true,
                              })
                            }
                            options={{
                              always: "Show always",
                              after_passed: "Show only after program ends",
                              hidden: "Hide gallery",
                            }}
                            value={form.watch("galleryMode")}
                          />
                          <FieldError errors={[form.formState.errors.galleryMode]} />
                        </Field>
                        <Field className="space-y-1.5">
                          <FieldLabel>Add Media</FieldLabel>
                          <div className="flex flex-wrap gap-2">
                            <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-600 hover:border-zinc-300 hover:text-zinc-900">
                              <Upload className="size-3.5" />
                              Upload Files
                              <input
                                accept="image/*,video/*"
                                className="hidden"
                                multiple
                                type="file"
                                onChange={(e) =>
                                  void uploadGalleryFiles(e.target.files)
                                }
                              />
                            </label>
                            <Button
                              className="h-9 gap-1.5 text-xs"
                              disabled={galleryLibraryLoading}
                              size="sm"
                              type="button"
                              variant="outline"
                              onClick={() => void openGalleryLibrary()}
                            >
                              {galleryLibraryLoading ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Search className="size-3.5" />
                              )}
                              Browse Library
                            </Button>
                          </div>
                          <UploadProgress
                            className="mt-1"
                            isActive={isGalleryUploading}
                            percent={galleryUploadProgress}
                            status={galleryUploadStatus}
                          />
                        </Field>
                      </div>
                      {galleryMode === "hidden" ? (
                        <Note className="mt-3">
                          Gallery is currently hidden on the frontend.
                        </Note>
                      ) : null}
                      {galleryMediaIds.length > 0 ? (
                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                          {galleryMediaIds.map((id) => {
                            const media = galleryLibraryItems.find(
                              (m) => m.id === id,
                            );
                            return (
                              <div
                                className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50"
                                key={id}
                              >
                                {media ? (
                                  media.mimeType.startsWith("image/") ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      alt={media.originalName}
                                      className="h-full w-full object-cover"
                                      src={media.url}
                                    />
                                  ) : (
                                    <video
                                      className="h-full w-full object-cover"
                                      muted
                                      preload="metadata"
                                      src={media.url}
                                    />
                                  )
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[11px] text-zinc-400">
                                    Media
                                  </div>
                                )}
                                <button
                                  className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-md bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                  type="button"
                                  onClick={() =>
                                    form.setValue(
                                      "galleryMediaIds",
                                      galleryMediaIds.filter(
                                        (itemId) => itemId !== id,
                                      ),
                                      { shouldDirty: true },
                                    )
                                  }
                                >
                                  <X className="size-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-3 text-[12px] text-zinc-400">
                          No gallery media selected yet.
                        </p>
                      )}
                    </div>
                  </FieldSet>
                )}

                {/* ─────────────────────────────────────────────────────────
                  §06  AGENDA
                  Day tabs · session table (time / title / type / speaker)
              ───────────────────────────────────────────────────────── */}
                {activeSection === "agenda" && (
                  <FieldSet className="">
                    <SectionHeader
                      description="Displayed as a timetable on the public event page"
                      icon={LayoutList}
                      number="06"
                      title="Agenda"
                    />

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
                                activeDay === day
                                  ? "bg-white/25 hover:bg-white/40"
                                  : "bg-zinc-100 hover:bg-red-100 hover:text-red-500",
                              )}
                              role="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                agenda.fields
                                  .map((f, i) => (f.day === day ? i : -1))
                                  .filter((i) => i !== -1)
                                  .reverse()
                                  .forEach((i) => agenda.remove(i));
                                setManualDays((p) =>
                                  p.filter((d) => d !== day),
                                );
                                if (activeDay === day)
                                  setActiveDay(agendaDays[0] ?? 1);
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
                          <div
                            className="border-r border-zinc-100 px-3 py-2 text-[9.5px] font-bold uppercase tracking-widest text-zinc-400 last:border-none"
                            key={h}
                          >
                            {h}
                          </div>
                        ))}
                      </div>
                      {/* Rows for active day */}
                      {agenda.fields
                        .map((item, index) => ({ index, item }))
                        .filter(({ item }) => item.day === activeDay)
                        .map(({ index, item }) => (
                          <div
                            className="grid grid-cols-[88px_1fr_96px_130px_40px] border-b border-zinc-100 last:border-none hover:bg-zinc-50/60"
                            key={item.id}
                          >
                            <div className="border-r border-zinc-100">
                              <input
                                className="h-10 w-full bg-transparent px-3 font-mono text-[11.5px] text-zinc-700 outline-none focus:bg-teal-50/40"
                                type="time"
                                {...form.register(`agenda.${index}.time` as const)}
                              />
                            </div>
                            <div className="border-r border-zinc-100">
                              <input
                                className="h-10 w-full bg-transparent px-3 text-[13px] text-zinc-800 outline-none placeholder:text-zinc-300 focus:bg-teal-50/40"
                                placeholder="Session title…"
                                {...form.register(`agenda.${index}.title` as const)}
                              />
                            </div>
                            <div className="border-r border-zinc-100">
                              <Select
                                value={form.watch(`agenda.${index}.type`) ?? "talk"}
                                onValueChange={(v) =>
                                  form.setValue(`agenda.${index}.type`, (v ?? "talk") as "talk" | "break" | "workshop" | "panel", {
                                    shouldDirty: true,
                                  })
                                }
                              >
                                <SelectTrigger className="!h-10 w-full rounded-none border-0 bg-transparent px-3 text-[12px] font-medium text-zinc-600 shadow-none focus:ring-0">
                                  <span>
                                    {agendaTypeLabels[
                                      (form.watch(`agenda.${index}.type`) ??
                                        "talk") as keyof typeof agendaTypeLabels
                                    ] ?? "Talk"}
                                  </span>
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(agendaTypeLabels).map(
                                    ([v, l]) => (
                                      <SelectItem key={v} value={v}>
                                        {l}
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="border-r border-zinc-100">
                              <Select
                                value={form.watch(`agenda.${index}.trainerId`) ?? "__none__"}
                                onValueChange={(v) =>
                                  form.setValue(
                                    `agenda.${index}.trainerId`,
                                    v && v !== "__none__" ? v : undefined,
                                    { shouldDirty: true },
                                  )
                                }
                              >
                                <SelectTrigger className="!h-10 w-full rounded-none border-0 bg-transparent px-3 text-[12px] text-zinc-600 shadow-none focus:ring-0">
                                  <span>
                                    {form.watch(`agenda.${index}.trainerId`)
                                      ? (trainerOptions.find(
                                          (t) =>
                                            t.value ===
                                            form.watch(`agenda.${index}.trainerId`),
                                        )?.label ?? "Speaker")
                                      : "No speaker"}
                                  </span>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">
                                    No speaker
                                  </SelectItem>
                                  {trainerOptions.map((t) => (
                                    <SelectItem
                                      key={t.value}
                                      value={t.value}
                                    >
                                      {t.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center justify-center">
                              <button
                                className="flex size-7 items-center justify-center rounded text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-500"
                                type="button"
                                onClick={() => agenda.remove(index)}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      {/* Empty state */}
                      {agenda.fields.filter((f) => f.day === activeDay)
                        .length === 0 && (
                        <div className="flex flex-col items-center gap-1.5 py-10 text-center">
                          <LayoutList className="size-5 text-zinc-200" />
                          <p className="text-[13px] text-zinc-400">
                            No sessions for this day yet
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      className="h-9 border-dashed text-zinc-500 hover:border-teal-400 hover:text-teal-600"
                      type="button"
                      variant="outline"
                      onClick={() =>
                        agenda.append({
                          day: activeDay,
                          time: "",
                          title: "",
                          trainerId: "",
                          type: "talk",
                        })
                      }
                    >
                      <Plus className="mr-1.5 size-3.5" /> Add session
                    </Button>
                  </FieldSet>
                )}

                {/* ─────────────────────────────────────────────────────────
                  §07  TRAINERS
                  Select from existing trainers · displayed as grid cards
              ───────────────────────────────────────────────────────── */}
                {activeSection === "trainers" && (
                  <FieldSet className="">
                    <SectionHeader
                      description="People leading this event"
                      icon={Users}
                      number="07"
                      title="Trainers"
                    />

                    {/* Search + add */}
                    <div className="flex gap-2">
                      <Select
                        value={trainerCandidate}
                        onValueChange={(v) => setTrainerCandidate(v ?? "")}
                      >
                        <SelectTrigger
                          className={cn(inputCls, "flex-1 cursor-pointer h-9!")}
                        >
                          <span
                            className={
                              trainerCandidate
                                ? "text-zinc-900"
                                : "text-zinc-400"
                            }
                          >
                            {trainerCandidate
                              ? trainerOptions.find(
                                  (t) => t.value === trainerCandidate,
                                )?.label
                              : "Search existing trainers…"}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {availableTrainers.length === 0 ? (
                              <div className="px-3 py-2 text-[12px] text-zinc-400">
                                All trainers already added
                              </div>
                            ) : (
                              availableTrainers.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Button
                        className="h-9 shrink-0 bg-teal-600 text-[13px] hover:bg-teal-700"
                        disabled={
                          !trainerCandidate && availableTrainers.length === 0
                        }
                        type="button"
                        onClick={addTrainer}
                      >
                        <Plus className="mr-1.5 size-3.5" /> Add trainer
                      </Button>
                    </div>

                    {/* Cards */}
                    <DndContext
                      sensors={dndSensors}
                      onDragEnd={handleTrainerDragEnd}
                    >
                      <SortableContext
                        items={chosenTrainers.map((t) => t.value)}
                        strategy={rectSortingStrategy}
                      >
                        <div className="grid grid-cols-3 gap-3">
                          {chosenTrainers.map((trainer) => (
                            <SortableTrainerItem
                              id={trainer.value}
                              key={trainer.value}
                            >
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
                                    <p className="truncate text-[13px] font-semibold text-zinc-800">
                                      {trainer.label}
                                    </p>
                                    <p className="mt-0.5 text-[11.5px] text-zinc-400">
                                      Trainer
                                    </p>
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
                              <p className="text-[13px] text-zinc-400">
                                No trainers assigned yet
                              </p>
                            </div>
                          )}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </FieldSet>
                )}

                {/* ─────────────────────────────────────────────────────────
                  §08  CATEGORIES
                  Toggle chips — selected = filled teal pill
              ───────────────────────────────────────────────────────── */}
                {activeSection === "categories" && (
                  <FieldSet className="">
                    <SectionHeader
                      description="Tags that appear on the event page and in filters"
                      icon={Tag}
                      number="08"
                      title="Categories"
                    />
                    <div className="flex flex-wrap gap-2">
                      {categoryOptions.map((cat) => {
                        const selected = selectedCategoryIds.includes(
                          cat.value,
                        );
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
                            {selected && (
                              <span className="size-1.5 rounded-full bg-white/60" />
                            )}
                            {cat.label}
                          </button>
                        );
                      })}
                      {categoryOptions.length === 0 && (
                        <p className="text-[13px] text-zinc-400">
                          No categories configured yet.
                        </p>
                      )}
                    </div>
                  </FieldSet>
                )}

                {/* ─────────────────────────────────────────────────────────
                  §09  REGISTRATION FORM
                  Add custom fields · accordion per field
              ───────────────────────────────────────────────────────── */}
                {activeSection === "registrationForm" &&
                  registrationType === "internal" && (
                    <FieldSet className="">
                      <SectionHeader
                        description="Custom inputs shown to learners during sign-up"
                        icon={ClipboardList}
                        number="09"
                        title="Registration Form"
                      />

                      {/* Add field row */}
                      <div className="flex gap-2">
                        <div className="w-48">
                          <EnumSelect
                            onChange={setNewFieldType}
                            options={fieldTypeLabels}
                            value={newFieldType}
                          />
                        </div>
                        <Button
                          className="h-9 bg-teal-600 text-[13px] hover:bg-teal-700"
                          type="button"
                          onClick={() => addRegistrationField(newFieldType)}
                        >
                          <Plus className="mr-1.5 size-3.5" /> Add field
                        </Button>
                      </div>

                      {regFields.fields.length === 0 ? (
                        <Note>
                          No registration fields yet. Add fields to configure
                          what learners fill out during sign-up.
                        </Note>
                      ) : (
                        <DndContext
                          modifiers={[restrictToVerticalAxis]}
                          sensors={dndSensors}
                          onDragEnd={handleFieldDragEnd}
                        >
                          <SortableContext
                            items={regFields.fields.map((f) => f.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <FieldGroup className="">
                              {regFields.fields.map((regField, index) => {
                                const isOpen = openFieldId === regField.id;
                                const cur = form.getValues(
                                  `registrationFields.${index}`,
                                );
                                const activeLabel =
                                  activeLocale === "en"
                                    ? cur.labelEn
                                    : cur.labelAr;

                                return (
                                  <SortableFieldItem
                                    id={regField.id}
                                    key={regField.id}
                                  >
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
                                            onClick={() =>
                                              setOpenFieldId(
                                                isOpen ? null : regField.id,
                                              )
                                            }
                                          >
                                            <Badge
                                              className="shrink-0 rounded-full bg-zinc-100 text-[11px] font-bold text-zinc-500"
                                              variant="secondary"
                                            >
                                              Field {index + 1}
                                            </Badge>
                                            <span className="flex-1 truncate text-[13px] font-medium text-zinc-700">
                                              {activeLabel || (
                                                <span className="italic text-zinc-400">
                                                  Untitled field
                                                </span>
                                              )}
                                            </span>
                                            <Badge
                                              className="shrink-0 text-[11px]"
                                              variant="outline"
                                            >
                                              {cur.type}
                                            </Badge>
                                            <ChevronDown
                                              className={cn(
                                                "size-4 shrink-0 text-zinc-400 transition-transform",
                                                isOpen && "rotate-180",
                                              )}
                                            />
                                          </button>
                                        </div>

                                        {/* Body */}
                                        {isOpen && (
                                          <div className="border-t border-zinc-100 px-4 pb-4 pt-4">
                                            <div className="grid grid-cols-2 gap-4">
                                              <Field className="grid gap-2">
                                                <EnumSelect
                                                  label="Field Type"
                                                  onChange={(value) =>
                                                    form.setValue(
                                                      `registrationFields.${index}.type`,
                                                      value,
                                                      { shouldDirty: true },
                                                    )
                                                  }
                                                  options={fieldTypeLabels}
                                                  value={
                                                    form.watch(
                                                      `registrationFields.${index}.type`,
                                                    ) ?? "text"
                                                  }
                                                />
                                              </Field>
                                              <Field className="grid gap-2">
                                                <FieldLabel>Required</FieldLabel>
                                                <div className="flex h-9 items-center gap-2.5 rounded-md border border-zinc-200 bg-zinc-50 px-3">
                                                  <Switch
                                                    checked={
                                                      form.watch(
                                                        `registrationFields.${index}.required`,
                                                      ) ?? false
                                                    }
                                                    className="shrink-0 data-[state=checked]:bg-teal-600"
                                                    onCheckedChange={(value) =>
                                                      form.setValue(
                                                        `registrationFields.${index}.required`,
                                                        value,
                                                        { shouldDirty: true },
                                                      )
                                                    }
                                                  />
                                                  <Label className="cursor-pointer text-[13px] font-medium text-zinc-700">
                                                    Required field
                                                  </Label>
                                                </div>
                                              </Field>
                                              <Field className="grid gap-2">
                                                <FieldLabel htmlFor={`${idPrefix}-rf-${index}-label-en`}>Label (EN)</FieldLabel>
                                                <FieldContent>
                                                  <Input
                                                    className={inputCls}
                                                    id={`${idPrefix}-rf-${index}-label-en`}
                                                    {...form.register(
                                                      `registrationFields.${index}.labelEn` as const,
                                                    )}
                                                  />
                                                </FieldContent>
                                                <FieldError errors={[form.formState.errors.registrationFields?.[index]?.labelEn]} />
                                              </Field>
                                              <Field className="grid gap-2">
                                                <FieldLabel htmlFor={`${idPrefix}-rf-${index}-label-ar`}>Label (AR)</FieldLabel>
                                                <FieldContent>
                                                  <Input
                                                    className={inputCls}
                                                    dir="rtl"
                                                    id={`${idPrefix}-rf-${index}-label-ar`}
                                                    {...form.register(
                                                      `registrationFields.${index}.labelAr` as const,
                                                    )}
                                                  />
                                                </FieldContent>
                                                <FieldError errors={[form.formState.errors.registrationFields?.[index]?.labelAr]} />
                                              </Field>
                                              <Field className="grid gap-2">
                                                <FieldLabel htmlFor={`${idPrefix}-rf-${index}-placeholder-en`}>Placeholder (EN)</FieldLabel>
                                                <FieldContent>
                                                  <Input
                                                    className={inputCls}
                                                    id={`${idPrefix}-rf-${index}-placeholder-en`}
                                                    {...form.register(
                                                      `registrationFields.${index}.placeholderEn` as const,
                                                    )}
                                                  />
                                                </FieldContent>
                                                <FieldError errors={[form.formState.errors.registrationFields?.[index]?.placeholderEn]} />
                                              </Field>
                                              <Field className="grid gap-2">
                                                <FieldLabel htmlFor={`${idPrefix}-rf-${index}-placeholder-ar`}>Placeholder (AR)</FieldLabel>
                                                <FieldContent>
                                                  <Input
                                                    className={inputCls}
                                                    dir="rtl"
                                                    id={`${idPrefix}-rf-${index}-placeholder-ar`}
                                                    {...form.register(
                                                      `registrationFields.${index}.placeholderAr` as const,
                                                    )}
                                                  />
                                                </FieldContent>
                                                <FieldError errors={[form.formState.errors.registrationFields?.[index]?.placeholderAr]} />
                                              </Field>
                                              {cur.type === "select" && (
                                                <>
                                                  <Field className="grid gap-2">
                                                    <div className="mb-1.5 flex items-center justify-between">
                                                      <FieldLabel htmlFor={`${idPrefix}-rf-${index}-options-en`}>
                                                        Options (EN)
                                                      </FieldLabel>
                                                      <span className="text-[11px] text-zinc-400">
                                                        comma-separated
                                                      </span>
                                                    </div>
                                                    <FieldContent>
                                                      <Textarea
                                                        className={cn(
                                                          inputCls,
                                                          "h-auto py-2",
                                                        )}
                                                        id={`${idPrefix}-rf-${index}-options-en`}
                                                        rows={2}
                                                        {...form.register(
                                                          `registrationFields.${index}.optionsEn` as const,
                                                        )}
                                                      />
                                                    </FieldContent>
                                                    <FieldError errors={[form.formState.errors.registrationFields?.[index]?.optionsEn]} />
                                                  </Field>
                                                  <Field className="grid gap-2">
                                                    <div className="mb-1.5 flex items-center justify-between">
                                                      <FieldLabel htmlFor={`${idPrefix}-rf-${index}-options-ar`}>
                                                        Options (AR)
                                                      </FieldLabel>
                                                      <span className="text-[11px] text-zinc-400">
                                                        comma-separated
                                                      </span>
                                                    </div>
                                                    <FieldContent>
                                                      <Textarea
                                                        className={cn(
                                                          inputCls,
                                                          "h-auto py-2",
                                                        )}
                                                        dir="rtl"
                                                        id={`${idPrefix}-rf-${index}-options-ar`}
                                                        rows={2}
                                                        {...form.register(
                                                          `registrationFields.${index}.optionsAr` as const,
                                                        )}
                                                      />
                                                    </FieldContent>
                                                    <FieldError errors={[form.formState.errors.registrationFields?.[index]?.optionsAr]} />
                                                  </Field>
                                                </>
                                              )}
                                            </div>
                                            {/* Field actions */}
                                            <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-4">
                                              <Button
                                                className="h-7 text-[11.5px]"
                                                disabled={index === 0}
                                                size="sm"
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                  index > 0 &&
                                                  regFields.move(
                                                    index,
                                                    index - 1,
                                                  )
                                                }
                                              >
                                                ↑ Up
                                              </Button>
                                              <Button
                                                className="h-7 text-[11.5px]"
                                                disabled={
                                                  index ===
                                                  regFields.fields.length - 1
                                                }
                                                size="sm"
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                  index <
                                                    regFields.fields.length -
                                                      1 &&
                                                  regFields.move(
                                                    index,
                                                    index + 1,
                                                  )
                                                }
                                              >
                                                ↓ Down
                                              </Button>
                                              <Button
                                                className="ml-auto h-7 text-[11.5px] text-red-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                                size="sm"
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                  regFields.remove(index);
                                                  setOpenFieldId(null);
                                                }}
                                              >
                                                <Trash2 className="mr-1 size-3" />{" "}
                                                Remove
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </SortableFieldItem>
                                );
                              })}
                            </FieldGroup>
                          </SortableContext>
                        </DndContext>
                      )}
                    </FieldSet>
                  )}

                {/* ─────────────────────────────────────────────────────────
                  §10  REGISTRATIONS
                  Summary strip + inline table.
                  NOTE FOR DEVELOPER: pass a `registrations` prop to
                  populate the table rows. See comment inside table body.
              ───────────────────────────────────────────────────────── */}
                {activeSection === "registrations" && (
                  <FieldSet className="">
                    <SectionHeader
                      description="Attendee submissions for this event"
                      icon={ListChecks}
                      number="10"
                      title="Registrations"
                    />

                    {!eventId ? (
                      <Note>
                        Registrations become available after the event is
                        created and published.
                      </Note>
                    ) : (
                      <>
                        {/* Summary strip */}
                        <div className="flex items-center gap-5 rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-xs">
                          <div>
                            <p className="text-2xl font-bold tabular-nums text-zinc-900">
                              {registrationsCount}
                            </p>
                            <p className="mt-0.5 text-[11px] text-zinc-400">
                              Registered
                            </p>
                          </div>
                          <div className="h-8 w-px bg-zinc-100" />
                          <div>
                            <p className="text-2xl font-bold tabular-nums text-zinc-900">
                              {capacity || "—"}
                            </p>
                            <p className="mt-0.5 text-[11px] text-zinc-400">
                              Capacity
                            </p>
                          </div>
                          <div className="h-8 w-px bg-zinc-100" />
                          <div className="flex-1">
                            <div className="mb-1.5 flex justify-between text-[11px] text-zinc-400">
                              <span>Occupancy</span>
                              <span>{occupancy}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                              <div
                                className="h-full rounded-full bg-teal-500 transition-all"
                                style={{ width: `${occupancy}%` }}
                              />
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
                            {["Learner", "Registered", "Status", ""].map(
                              (h) => (
                                <div
                                  className="border-r border-zinc-100 px-3 py-2 text-[9.5px] font-bold uppercase tracking-widest text-zinc-400 last:border-none"
                                  key={h}
                                >
                                  {h}
                                </div>
                              ),
                            )}
                          </div>
                          {registrations.length === 0 ? (
                            <div className="flex flex-col items-center gap-1.5 py-12 text-center">
                              <ListChecks className="size-5 text-zinc-200" />
                              <p className="text-[13px] font-medium text-zinc-400">
                                No registrations yet
                              </p>
                              <p className="text-[11.5px] text-zinc-300">
                                Registrations will appear here once learners
                                sign up
                              </p>
                            </div>
                          ) : (
                            registrations.map((r) => (
                              <div
                                className="grid grid-cols-[1fr_140px_100px_44px] border-b border-zinc-100 last:border-none"
                                key={r.id}
                              >
                                <div className="border-r border-zinc-100 px-3 py-2.5">
                                  <p className="text-[13px] font-medium text-zinc-800">
                                    {r.registrantName}
                                  </p>
                                  <p className="text-[11px] text-zinc-400">
                                    {r.registrantEmail}
                                  </p>
                                </div>
                                <div className="border-r border-zinc-100 px-3 py-2.5 text-[12px] text-zinc-500">
                                  {r.createdAt}
                                </div>
                                <div className="border-r border-zinc-100 px-3 py-2.5">
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {r.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-center">
                                  <Link
                                    className="text-zinc-500 hover:text-zinc-800"
                                    href={`/${locale}/dashboard/registrations/${eventId}`}
                                  >
                                    →
                                  </Link>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </FieldSet>
                )}
              </div>

              {/* Prev / Next section navigation */}
              {/* <div className="mx-auto mt-10 flex max-w-2xl items-center justify-between">
                {prevSection ? (
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-[12.5px] font-medium text-zinc-500 shadow-xs transition-colors hover:border-zinc-300 hover:text-zinc-800"
                    type="button"
                    onClick={() => setActiveSection(prevSection.id)}
                  >
                    <ArrowLeft className="size-3.5" /> {prevSection.label}
                  </button>
                ) : (
                  <div />
                )}
                {nextSection ? (
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-[12.5px] font-medium text-zinc-500 shadow-xs transition-colors hover:border-zinc-300 hover:text-zinc-800"
                    type="button"
                    onClick={() => setActiveSection(nextSection.id)}
                  >
                    {nextSection.label} <ChevronRight className="size-3.5" />
                  </button>
                ) : (
                  <div />
                )}
              </div> */}
            </div>
          </main>

          {/* ════════════════════════════════════════════════════════════════
            RIGHT SETTINGS RAIL  w-72
            Wider than before so text is never squished.
            Status · Featured · Registrations open · Certificate
        ════════════════════════════════════════════════════════════════ */}
          <aside
            aria-label="Event settings"
            className="flex h-full w-72 shrink-0 flex-col overflow-y-auto border-l border-zinc-200 bg-white"
          >
            {/* Rail header */}
            <div className="border-b border-zinc-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Settings2 className="size-4 text-teal-600" />
                <h2 className="text-[13px] font-bold text-zinc-800">
                  Settings
                </h2>
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-zinc-400">
                Content type, visibility, registration and certificate controls
              </p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <FieldSet>
                <FieldLegend variant="label">
                  Program Type (Required)
                </FieldLegend>
                <Field className="grid gap-2">
                      <div className="grid gap-2">
                        <button
                          className={cn(
                            "rounded-lg border px-3 py-2.5 text-left transition-colors",
                            form.watch("eventKind") === "event"
                              ? "border-emerald-300 bg-emerald-50"
                              : "border-zinc-200 bg-white hover:bg-zinc-50",
                          )}
                          type="button"
                          onClick={() =>
                            form.setValue("eventKind", "event", {
                              shouldDirty: true,
                            })
                          }
                        >
                          <p className="text-[12px] font-semibold text-zinc-900">
                            Event
                          </p>
                          <p className="mt-0.5 text-[11px] text-zinc-500">
                            One-off or recurring event entry.
                          </p>
                        </button>
                        <button
                          className={cn(
                            "rounded-lg border px-3 py-2.5 text-left transition-colors",
                            form.watch("eventKind") === "training_course"
                              ? "border-indigo-300 bg-indigo-50"
                              : "border-zinc-200 bg-white hover:bg-zinc-50",
                          )}
                          type="button"
                          onClick={() =>
                            form.setValue("eventKind", "training_course", {
                              shouldDirty: true,
                            })
                          }
                        >
                          <p className="text-[12px] font-semibold text-zinc-900">
                            Training Course
                          </p>
                          <p className="mt-0.5 text-[11px] text-zinc-500">
                            Course-focused program shown under training courses.
                          </p>
                        </button>
                      </div>
                      <FieldError errors={[form.formState.errors.eventKind]} />
                </Field>
              </FieldSet>

              <div className="h-px border-0 bg-zinc-100" />

              {/* ── Status ── */}
              <FieldSet>
                <FieldLegend variant="label">Publication Status</FieldLegend>
                <Field className="grid gap-2">
                    <button
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors",
                        form.watch("status") === "published"
                          ? "border-teal-200 bg-teal-50/60"
                          : "border-zinc-200 bg-white hover:bg-zinc-50/80",
                      )}
                      type="button"
                      onClick={() =>
                        form.setValue(
                          "status",
                          form.watch("status") === "published"
                            ? "draft"
                            : "published",
                          { shouldDirty: true },
                        )
                      }
                    >
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-zinc-100">
                        <FileText
                          className={cn(
                            "size-4",
                            form.watch("status") === "published"
                              ? "text-teal-600"
                              : "text-zinc-400",
                          )}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-zinc-800">
                          {form.watch("status") === "published"
                            ? statusLabels.published
                            : statusLabels.draft}
                        </p>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-zinc-400">
                          {form.watch("status") === "published"
                            ? "Visible to learners"
                            : "Hidden from public"}
                        </p>
                      </div>
                      <div className="mt-0.5 shrink-0">
                        <Switch
                          checked={form.watch("status") === "published"}
                          className="pointer-events-none data-[state=checked]:bg-teal-600"
                        />
                      </div>
                    </button>
                    <FieldError errors={[form.formState.errors.status]} />
                </Field>
              </FieldSet>

              <div className="h-px border-0 bg-zinc-100" />

              {/* ── Controls ── */}
              <FieldSet>
                <FieldLegend variant="label">Controls</FieldLegend>
                <FieldGroup className="">
                  <Field className="grid gap-2">
                    <ToggleControl
                      checked={form.watch("isFeatured")}
                      description="Hero card on homepage · one event at a time"
                      iconBg={form.watch("isFeatured") ? "bg-amber-50" : "bg-zinc-100"}
                      iconEl={
                        <Star
                          className={cn(
                            "size-4",
                            form.watch("isFeatured")
                              ? "fill-amber-400 text-amber-400"
                              : "text-zinc-400",
                          )}
                        />
                      }
                      title="Featured event"
                      onCheckedChange={(v) =>
                        form.setValue("isFeatured", v, { shouldDirty: true })
                      }
                    />
                  </Field>
                  <Field className="grid gap-2">
                    <ToggleControl
                      checked={form.watch("registrationsOpen")}
                      description="Block new sign-ups without unpublishing"
                      iconBg="bg-teal-50"
                      iconEl={<Users className="size-4 text-teal-600" />}
                      title="Registrations open"
                      onCheckedChange={(v) =>
                        form.setValue("registrationsOpen", v, {
                          shouldDirty: true,
                        })
                      }
                    />
                  </Field>
                  <Field className="grid gap-2">
                    <ToggleControl
                      checked={form.watch("isCertified")}
                      description="Issued on completion of this event"
                      iconBg="bg-blue-50"
                      iconEl={<Award className="size-4 text-blue-600" />}
                      title="Issue certificate"
                      onCheckedChange={(v) =>
                        form.setValue("isCertified", v, { shouldDirty: true })
                      }
                    />
                  </Field>
                </FieldGroup>
              </FieldSet>
            </div>
          </aside>
      </form>

      <MediaLibraryDialog
        acceptedKinds={["image"]}
        emptyText="No images uploaded yet."
        initialSelectedIds={
          heroMediaTarget === "cover"
            ? (form.watch("coverImage")
                ? coverLibraryItems
                    .filter((item) => item.url === form.watch("coverImage"))
                    .map((item) => item.id)
                : [])
            : heroMediaTarget === "heroProgram"
              ? (form.watch("heroProgramLogo")
                  ? coverLibraryItems
                      .filter(
                        (item) => item.url === form.watch("heroProgramLogo"),
                      )
                      .map((item) => item.id)
                  : [])
              : coverLibraryItems
                  .filter((item) => heroCollaboratorLogos.includes(item.url))
                  .map((item) => item.id)
        }
        items={coverLibraryItems}
        loading={coverLibraryLoading}
        open={coverLibraryOpen}
        page={coverLibraryPage}
        pageLoading={coverLibraryLoading}
        totalPages={coverLibraryTotalPages}
        title={
          heroMediaTarget === "cover"
            ? "Media Library"
            : heroMediaTarget === "heroProgram"
              ? "Program Logo Library"
              : "Collaborator Logos Library"
        }
        onPageChange={loadCoverLibraryPage}
        onConfirm={(selected) => {
          if (heroMediaTarget === "cover") {
            const first = selected[0];
            if (!first) return;
            form.setValue("coverImage", first.url, { shouldDirty: true });
            return;
          }
          if (heroMediaTarget === "heroProgram") {
            const first = selected[0];
            if (!first) return;
            form.setValue("heroProgramLogo", first.url, { shouldDirty: true });
            return;
          }
          const urls = selected.map((item) => item.url);
          const merged = Array.from(new Set([...heroCollaboratorLogos, ...urls]));
          form.setValue("heroCollaboratorLogos", merged.join("\n"), {
            shouldDirty: true,
          });
        }}
        multiple={heroMediaTarget === "heroCollaborators"}
        onOpenChange={setCoverLibraryOpen}
      />

      <MediaLibraryDialog
        emptyText="No media uploaded yet."
        initialSelectedIds={galleryMediaIds}
        items={galleryLibraryItems}
        loading={galleryLibraryLoading}
        multiple
        open={galleryLibraryOpen}
        page={galleryLibraryPage}
        pageLoading={galleryLibraryLoading}
        totalPages={galleryLibraryTotalPages}
        title="Gallery Media Library"
        onPageChange={loadGalleryLibraryPage}
        onConfirm={(selected) => {
          form.setValue(
            "galleryMediaIds",
            selected.map((item) => item.id),
            { shouldDirty: true },
          );
        }}
        onOpenChange={setGalleryLibraryOpen}
      />
    </>
  );
}
