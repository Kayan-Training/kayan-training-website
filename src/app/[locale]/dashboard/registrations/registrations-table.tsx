"use client";

import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpDown,
  Ban,
  CalendarDays,
  CircleDollarSign,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  Phone,
  RotateCcw,
  Ticket,
  Upload,
  User,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UploadProgress } from "@/components/ui/upload-progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { uploadMediaFile } from "@/lib/client/media-upload";
import { cn } from "@/lib/utils";
import {
  bulkUpdateRegistrationStatus,
  cancelRegistration,
  createRegistrationAdmin,
  deleteRegistrations,
  rejectPayment,
  updateRegistrationAdmin,
  verifyPayment,
} from "./_actions";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type RegistrationRow = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventStartDate?: Date | null;
  eventEndDate?: Date | null;
  registrantName: string;
  registrantEmail: string;
  formData?: Record<string, unknown> | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentProofUrl?: string | null;
  paymentRef?: string | null;
  amount: string | null;
  createdAt: Date;
  locale: string;
};

type FormFieldSchema = {
  key: string;
  label: string;
  type:
    | "text"
    | "email"
    | "tel"
    | "number"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio"
    | "date";
  required?: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
};

type RegistrationEventOption = {
  id: string;
  title: string;
  startDate?: Date | null;
  endDate?: Date | null;
  imageUrl?: string | null;
  location?: string | null;
  price?: number | null;
  currency?: string;
  remainingSeats?: number | null;
  totalSeats?: number | null;
  formSchema?: FormFieldSchema[] | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Badge color maps
// ─────────────────────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  confirmed: "border-green-500/40 bg-green-500/10 text-green-700",
  pending: "border-yellow-500/40 bg-yellow-500/10 text-yellow-700",
  cancelled: "border-red-500/40 bg-red-500/10 text-red-600",
  attended: "border-blue-500/40 bg-blue-500/10 text-blue-700",
};

const paymentStatusColors: Record<string, string> = {
  paid: "border-green-500/40 bg-green-500/10 text-green-700",
  pending: "border-yellow-500/40 bg-yellow-500/10 text-yellow-700",
  failed: "border-red-500/40 bg-red-500/10 text-red-600",
};

const paymentMethodColors: Record<string, string> = {
  card: "border-blue-500/40 bg-blue-500/10 text-blue-700",
  bank: "border-amber-500/40 bg-amber-500/10 text-amber-700",
  free: "border-zinc-500/40 bg-zinc-500/10 text-zinc-700",
};

type SortBy = "dateDesc" | "dateAsc" | "nameAsc" | "eventAsc";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(date?: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatPrice(price?: number | null, currency = "OMR") {
  if (price == null) return null;
  return price === 0 ? "Free" : `${price.toFixed(3)} ${currency}`;
}

function isLikelyImageUrl(url: string) {
  const clean = url.split("?")[0]?.toLowerCase() ?? "";
  return (
    clean.endsWith(".jpg") ||
    clean.endsWith(".jpeg") ||
    clean.endsWith(".png") ||
    clean.endsWith(".webp") ||
    clean.endsWith(".avif") ||
    clean.endsWith(".gif")
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StyledSelect — wraps shadcn Select with proper label display
// ─────────────────────────────────────────────────────────────────────────────

type SelectOption = { value: string; label: string };

function StyledSelect({
  value,
  onValueChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}) {
  const found = options.find((o) => o.value === value);
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v ?? value)}>
      <SelectTrigger className={cn("!h-10 text-sm", className)}>
        <span className={cn(!found && "text-muted-foreground")}>
          {found?.label ?? placeholder ?? "Select…"}
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FieldLabel
// ─────────────────────────────────────────────────────────────────────────────

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DynamicFormField — renders a single field from event formSchema
// ─────────────────────────────────────────────────────────────────────────────

function DynamicFormField({
  field,
  value,
  onChange,
}: {
  field: FormFieldSchema;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.type === "select") {
    return (
      <div>
        <FieldLabel required={field.required}>{field.label}</FieldLabel>
        <StyledSelect
          value={value}
          onValueChange={onChange}
          options={(field.options ?? []).map((o) => ({ value: o, label: o }))}
          placeholder={field.placeholder ?? `Select ${field.label}`}
        />
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="sm:col-span-2">
        <FieldLabel required={field.required}>{field.label}</FieldLabel>
        <Textarea
          className="h-20 resize-none py-2.5"
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (field.type === "date") {
    return (
      <div>
        <FieldLabel required={field.required}>{field.label}</FieldLabel>
        <Input
          className="h-10"
          type="date"
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <div>
        <FieldLabel required={field.required}>{field.label}</FieldLabel>
        <Input
          className="h-10"
          type="number"
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <div className="flex items-start gap-2.5 pt-1">
        <Checkbox
          id={field.key}
          checked={value === "true"}
          onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
          className="mt-0.5"
        />
        <label
          htmlFor={field.key}
          className="text-sm leading-snug cursor-pointer"
        >
          {field.label}
          {field.required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      </div>
    );
  }

  if (field.type === "radio" && field.options) {
    return (
      <div>
        <FieldLabel required={field.required}>{field.label}</FieldLabel>
        <div className="flex flex-wrap gap-2 pt-0.5">
          {field.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                value === opt
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border/60 bg-background/60 text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <FieldLabel required={field.required}>{field.label}</FieldLabel>
      <Input
        className="h-10"
        type={field.type}
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EventPickerCard — rich card for event selection
// ─────────────────────────────────────────────────────────────────────────────

function EventPickerCard({
  event,
  selected,
  onSelect,
}: {
  event: RegistrationEventOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const start = formatDate(event.startDate);
  const end = formatDate(event.endDate);
  const price = formatPrice(event.price, event.currency);
  const seatsLeft = event.remainingSeats;
  const seatsPct =
    event.totalSeats && event.remainingSeats != null
      ? Math.max(
          0,
          Math.min(100, (event.remainingSeats / event.totalSeats) * 100),
        )
      : null;

  const seatsColor =
    seatsLeft == null
      ? "bg-zinc-400"
      : seatsLeft === 0
        ? "bg-red-500"
        : seatsLeft <= 5
          ? "bg-amber-500"
          : "bg-emerald-500";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border text-left transition-all duration-200",
        selected
          ? "border-primary/60 bg-primary/5 shadow-sm shadow-primary/10 ring-1 ring-primary/30"
          : "border-border/60 bg-card hover:border-border hover:bg-muted/30",
      )}
    >
      {/* Image strip */}
      {event.imageUrl ? (
        <div className="relative h-28 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={event.title}
            src={event.imageUrl}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          {price && (
            <span
              className={cn(
                "absolute bottom-2.5 right-2.5 rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide",
                price === "Free"
                  ? "bg-emerald-500/90 text-white"
                  : "bg-black/70 text-white backdrop-blur-sm",
              )}
            >
              {price}
            </span>
          )}
          {selected && (
            <div className="absolute left-2.5 top-2.5 flex size-5 items-center justify-center rounded-full bg-primary shadow-lg">
              <CheckCircle2 className="size-3 text-primary-foreground" />
            </div>
          )}
        </div>
      ) : (
        <div className="relative flex h-16 items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20">
          <CalendarDays className="size-7 text-muted-foreground/30" />
          {price && (
            <span
              className={cn(
                "absolute bottom-2 right-2.5 rounded-md px-2 py-0.5 text-[11px] font-bold",
                price === "Free"
                  ? "bg-emerald-500/80 text-white"
                  : "bg-muted text-foreground",
              )}
            >
              {price}
            </span>
          )}
          {selected && (
            <div className="absolute left-2.5 top-2.5 flex size-5 items-center justify-center rounded-full bg-primary">
              <CheckCircle2 className="size-3 text-primary-foreground" />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-3 space-y-2">
        <p className="text-sm font-semibold leading-snug line-clamp-2">
          {event.title}
        </p>

        <div className="space-y-1">
          {(start || end) && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="size-3 shrink-0" />
              <span className="truncate">
                {start}
                {end && start !== end ? ` → ${end}` : ""}
              </span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Globe className="size-3 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>

        {/* Seats bar */}
        {seatsPct !== null && (
          <div className="pt-0.5">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Users className="size-3" />
                <span>
                  {seatsLeft === 0
                    ? "Sold out"
                    : `${seatsLeft} seat${seatsLeft === 1 ? "" : "s"} left`}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {event.totalSeats} total
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", seatsColor)}
                style={{ width: `${seatsPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CreateRegistrationDialog — full overhaul
// ─────────────────────────────────────────────────────────────────────────────

type CreateStep = "event" | "registrant" | "payment";

function CreateRegistrationDialog({
  eventOptions,
  fixedEventId,
  locale,
  onClose,
}: {
  eventOptions: RegistrationEventOption[];
  fixedEventId?: string;
  locale: string;
  onClose: () => void;
}) {
  const proofInputRef = useRef<HTMLInputElement | null>(null);

  // Step state
  const [step, setStep] = useState<CreateStep>(
    fixedEventId ? "registrant" : "event",
  );

  // Event selection
  const [eventId, setEventId] = useState(fixedEventId ?? "");
  const [eventSearch, setEventSearch] = useState("");

  // Registrant core
  const [registrantName, setRegistrantName] = useState("");
  const [registrantEmail, setRegistrantEmail] = useState("");
  const [registrantPhone, setRegistrantPhone] = useState("");

  // Dynamic form fields from event schema
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>(
    {},
  );

  // Payment
  const [status, setStatus] = useState("pending");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [amount, setAmount] = useState("0");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [verificationNote, setVerificationNote] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofUploadProgress, setProofUploadProgress] = useState(0);
  const [proofUploadStatus, setProofUploadStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedEvent = eventOptions.find((e) => e.id === eventId);
  const formSchema: FormFieldSchema[] = selectedEvent?.formSchema ?? [];

  const filteredEvents = useMemo(() => {
    const q = eventSearch.trim().toLowerCase();
    if (!q) return eventOptions;
    return eventOptions.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.location ?? "").toLowerCase().includes(q),
    );
  }, [eventOptions, eventSearch]);

  function handleSelectEvent(id: string) {
    setEventId(id);
    // Reset dynamic fields when switching events
    setDynamicFields({});
    // Pre-fill amount from event price
    const ev = eventOptions.find((e) => e.id === id);
    if (ev?.price != null) {
      setAmount(ev.price.toFixed(3));
      if (ev.price === 0) setPaymentMethod("free");
    }
  }

  function setDynamic(key: string, val: string) {
    setDynamicFields((prev) => ({ ...prev, [key]: val }));
  }

  async function onProofFileSelected(file?: File) {
    if (!file) return;
    try {
      setIsUploadingProof(true);
      setProofUploadProgress(0);
      setProofUploadStatus("Preparing upload...");
      const uploaded = await uploadMediaFile(file, {
        onProgress: (percent) => setProofUploadProgress(percent),
        onStatus: (status) => setProofUploadStatus(status),
      });
      setPaymentProofUrl(uploaded.url);
      setProofUploadProgress(100);
      setProofUploadStatus("Proof uploaded.");
      toast.success("Proof uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
      setProofUploadStatus("Upload failed.");
    } finally {
      setIsUploadingProof(false);
    }
  }

  function validateStep(): boolean {
    if (step === "event") {
      if (!eventId) {
        toast.error("Please select an event.");
        return false;
      }
      return true;
    }
    if (step === "registrant") {
      if (!registrantName.trim()) {
        toast.error("Name is required.");
        return false;
      }
      if (!registrantEmail.trim()) {
        toast.error("Email is required.");
        return false;
      }
      // Validate required dynamic fields
      for (const field of formSchema) {
        if (field.required && !dynamicFields[field.key]?.trim()) {
          toast.error(`"${field.label}" is required.`);
          return false;
        }
      }
      return true;
    }
    return true;
  }

  function next() {
    if (!validateStep()) return;
    if (step === "event") setStep("registrant");
    else if (step === "registrant") setStep("payment");
  }

  function back() {
    if (step === "payment") setStep("registrant");
    else if (step === "registrant" && !fixedEventId) setStep("event");
  }

  function save() {
    if (!validateStep()) return;
    if (!eventId) {
      toast.error("Select an event first.");
      return;
    }
    if (!registrantName.trim() || !registrantEmail.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    startTransition(async () => {
      const result = await createRegistrationAdmin(
        {
          eventId,
          registrantName,
          registrantEmail,
          registrantPhone,
          status,
          paymentStatus,
          paymentMethod,
          amount,
          paymentReference,
          paymentProofUrl,
          verificationNote,
          cancellationReason,
          // Dynamic fields are passed as form data
          formData: dynamicFields,
        },
        locale,
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Registration created.");
        onClose();
      }
    });
  }

  const steps: CreateStep[] = fixedEventId
    ? ["registrant", "payment"]
    : ["event", "registrant", "payment"];
  const stepIdx = steps.indexOf(step);
  const isLast = stepIdx === steps.length - 1;

  const stepLabels: Record<CreateStep, string> = {
    event: "Event",
    registrant: "Registrant",
    payment: "Payment",
  };

  return (
    <DialogContent className="max-w-6xl gap-0 overflow-hidden p-0">
      {/* Header */}
      <div className="border-b border-border/60 bg-muted/20 px-6 py-4">
        <DialogTitle className="text-base font-semibold">
          Add Registration
        </DialogTitle>

        {/* Step indicator */}
        <div className="mt-3 flex items-center gap-0">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  // Only allow navigating to completed steps
                  if (i < stepIdx) setStep(s);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  s === step
                    ? "bg-primary/10 text-primary"
                    : i < stepIdx
                      ? "cursor-pointer text-foreground/70 hover:text-foreground"
                      : "cursor-default text-muted-foreground/50",
                )}
              >
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded-full text-[10px] font-bold",
                    s === step
                      ? "bg-primary text-primary-foreground"
                      : i < stepIdx
                        ? "bg-green-500/20 text-green-600"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {i < stepIdx ? "✓" : i + 1}
                </span>
                {stepLabels[s]}
              </button>
              {i < steps.length - 1 && (
                <ChevronRight className="size-3.5 text-muted-foreground/40 mx-1" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
        {/* ── STEP: EVENT ── */}
        {step === "event" && (
          <div className="space-y-4">
            <div className="relative">
              <HugeiconsIcon
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                icon={Search01Icon}
                strokeWidth={2}
              />
              <Input
                className="h-10 pl-9"
                placeholder="Search events by name or location…"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
              />
            </div>

            {eventOptions.length === 0 ? (
              <div className="flex h-32 items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading events...
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground">
                No events match your search.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((ev) => (
                  <EventPickerCard
                    key={ev.id}
                    event={ev}
                    selected={eventId === ev.id}
                    onSelect={() => handleSelectEvent(ev.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP: REGISTRANT ── */}
        {step === "registrant" && (
          <div className="space-y-5">
            {/* Selected event summary */}
            {selectedEvent && (
              <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                {selectedEvent.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={selectedEvent.title}
                    src={selectedEvent.imageUrl}
                    className="size-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Ticket className="size-5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {selectedEvent.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDate(selectedEvent.startDate) ?? "Date TBD"}
                    {selectedEvent.price != null && (
                      <>
                        {" "}
                        ·{" "}
                        {formatPrice(
                          selectedEvent.price,
                          selectedEvent.currency,
                        )}
                      </>
                    )}
                  </p>
                </div>
                {!fixedEventId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 shrink-0 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setStep("event")}
                  >
                    Change
                  </Button>
                )}
              </div>
            )}

            {/* Core registrant fields */}
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                Registrant Info
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel required>Full Name</FieldLabel>
                  <div className="relative">
                    <Input
                      className="h-10 pr-9"
                      placeholder="e.g. Ahmed Al-Rashdi"
                      value={registrantName}
                      onChange={(e) => setRegistrantName(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel required>Email Address</FieldLabel>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
                    <Input
                      className="h-10 pl-9"
                      type="email"
                      placeholder="email@example.com"
                      value={registrantEmail}
                      onChange={(e) => setRegistrantEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
                    <Input
                      className="h-10 pl-9"
                      placeholder="+968 9XXX XXXX"
                      value={registrantPhone}
                      onChange={(e) => setRegistrantPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic schema fields from event */}
            {formSchema.length > 0 && (
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Event Form Fields
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {formSchema.map((field) => (
                    <DynamicFormField
                      key={field.key}
                      field={field}
                      value={
                        dynamicFields[field.key] ?? field.defaultValue ?? ""
                      }
                      onChange={(v) => setDynamic(field.key, v)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP: PAYMENT ── */}
        {step === "payment" && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Registration Status */}
              <div>
                <FieldLabel>Registration Status</FieldLabel>
                <StyledSelect
                  value={status}
                  onValueChange={setStatus}
                  options={[
                    { value: "submitted", label: "Submitted" },
                    { value: "pending", label: "Pending" },
                    { value: "confirmed", label: "Confirmed" },
                    { value: "cancelled", label: "Cancelled" },
                    { value: "attended", label: "Attended" },
                  ]}
                />
              </div>

              {/* Payment Status */}
              <div>
                <FieldLabel>Payment Status</FieldLabel>
                <StyledSelect
                  value={paymentStatus}
                  onValueChange={setPaymentStatus}
                  options={[
                    { value: "pending", label: "Pending" },
                    { value: "paid", label: "Paid" },
                    { value: "verified", label: "Verified" },
                    { value: "failed", label: "Failed" },
                  ]}
                />
              </div>

              {/* Payment Method */}
              <div>
                <FieldLabel>Payment Method</FieldLabel>
                <StyledSelect
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  options={[
                    { value: "card", label: "Card" },
                    { value: "bank", label: "Bank Transfer" },
                    { value: "free", label: "Free / Complimentary" },
                  ]}
                />
              </div>

              {/* Amount */}
              <div>
                <FieldLabel>Amount (OMR)</FieldLabel>
                <div className="relative">
                  <CreditCard className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    className="h-10 pl-9"
                    type="number"
                    min="0"
                    step="0.001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Payment Reference */}
              <div className="sm:col-span-2">
                <FieldLabel>Payment Reference</FieldLabel>
                <Input
                  className="h-10 font-mono text-xs"
                  placeholder="Bank ref / transaction ID"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>

              {/* Verification Note */}
              <div className="sm:col-span-2">
                <FieldLabel>Verification Note</FieldLabel>
                <Input
                  className="h-10"
                  placeholder="Internal note for this registration"
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                />
              </div>

              {/* Cancellation Reason (conditional) */}
              {status === "cancelled" && (
                <div className="sm:col-span-2">
                  <FieldLabel>Cancellation Reason</FieldLabel>
                  <Input
                    className="h-10"
                    placeholder="Reason for cancellation"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Payment Proof */}
            <div>
              <FieldLabel>Payment Proof</FieldLabel>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                {paymentProofUrl ? (
                  <div className="space-y-3">
                    <a
                      className="block overflow-hidden rounded-lg border border-border/60 bg-muted"
                      href={paymentProofUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Payment proof"
                        className="max-h-48 w-full object-contain"
                        src={paymentProofUrl}
                      />
                    </a>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => proofInputRef.current?.click()}
                      >
                        <Upload className="mr-1.5 size-3.5" />
                        Replace
                      </Button>
                      <a
                        className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
                        href={paymentProofUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <ExternalLink className="mr-1.5 size-3.5" />
                        Open
                      </a>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => setPaymentProofUrl("")}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => proofInputRef.current?.click()}
                      className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-border/60 bg-background/40 px-4 py-6 transition-colors hover:bg-muted/30"
                    >
                      <Upload className="size-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Click to upload proof image
                      </span>
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-border/40" />
                      <span className="text-[10px] text-muted-foreground">
                        or paste URL
                      </span>
                      <div className="h-px flex-1 bg-border/40" />
                    </div>
                    <Input
                      className="h-9 text-xs"
                      placeholder="https://…"
                      value={paymentProofUrl}
                      onChange={(e) => setPaymentProofUrl(e.target.value)}
                    />
                  </div>
                )}
                <input
                  ref={proofInputRef}
                  className="hidden"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    void onProofFileSelected(e.target.files?.[0])
                  }
                />
                <UploadProgress
                  className="mt-2"
                  isActive={isUploadingProof || proofUploadProgress > 0}
                  percent={proofUploadProgress}
                  status={proofUploadStatus}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/60 bg-muted/10 px-6 py-4">
        <div className="flex items-center gap-2">
          {stepIdx > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={back}
            >
              Back
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {!isLast ? (
            <Button
              size="sm"
              className="h-9 px-5 text-xs"
              onClick={next}
              disabled={step === "event" && !eventId}
            >
              Continue
              <ChevronRight className="ml-1 size-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-9 px-5 text-xs"
              disabled={isPending || isUploadingProof}
              onClick={save}
            >
              {isPending ? "Creating…" : "Create Registration"}
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PaymentDialog
// ─────────────────────────────────────────────────────────────────────────────

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
      else {
        toast.success("Payment verified — registration confirmed.");
        onClose();
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectPayment(row.id, note, locale);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Payment rejected — registration cancelled.");
        onClose();
      }
    });
  }

  const canAct = row.paymentStatus === "pending";

  return (
    <DialogContent className="max-w-6xl">
      <DialogHeader>
        <DialogTitle>Payment — {row.registrantName}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-muted/20 p-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Method
            </p>
            <p className="capitalize">{row.paymentMethod}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </p>
            <p className="capitalize">{row.paymentStatus}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Amount
            </p>
            <p>{row.amount ? `${row.amount} OMR` : "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Reference
            </p>
            <p className="font-mono text-xs">{row.paymentRef ?? "—"}</p>
          </div>
        </div>
        {row.paymentProofUrl && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Proof
            </p>
            {isLikelyImageUrl(row.paymentProofUrl) ? (
              <a
                className="block overflow-hidden rounded-md border border-border/60"
                href={row.paymentProofUrl}
                rel="noreferrer"
                target="_blank"
              >
                <img
                  alt="Payment proof"
                  className="max-h-48 w-full object-contain bg-muted"
                  src={row.paymentProofUrl}
                />
              </a>
            ) : (
              <a
                className="inline-flex h-9 items-center rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
                href={row.paymentProofUrl}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink className="mr-1.5 size-3.5" />
                Open payment proof
              </a>
            )}
          </div>
        )}
        {canAct && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Note / Reason
            </p>
            <Input
              placeholder="Optional note for verification or rejection reason"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        )}
        {canAct && (
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1"
              disabled={isPending}
              onClick={handleVerify}
            >
              <CheckCircle2 className="mr-1.5 size-3.5" />
              {isPending ? "Processing…" : "Verify Payment"}
            </Button>
            <Button
              className="flex-1"
              disabled={isPending}
              variant="destructive"
              onClick={handleReject}
            >
              <XCircle className="mr-1.5 size-3.5" />
              Reject
            </Button>
          </div>
        )}
        {!canAct && (
          <p className="text-xs text-muted-foreground">
            Payment already processed ({row.paymentStatus}). Use bulk status
            controls to update if needed.
          </p>
        )}
      </div>
    </DialogContent>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ManageRegistrationDialog
// ─────────────────────────────────────────────────────────────────────────────

function ManageRegistrationDialog({
  row,
  locale,
  onClose,
}: {
  row: RegistrationRow;
  locale: string;
  onClose: () => void;
}) {
  const proofInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState(row.status);
  const [paymentStatus, setPaymentStatus] = useState(row.paymentStatus);
  const [paymentMethod, setPaymentMethod] = useState(row.paymentMethod);
  const [paymentReference, setPaymentReference] = useState(
    row.paymentRef ?? "",
  );
  const [paymentProofUrl, setPaymentProofUrl] = useState(
    row.paymentProofUrl ?? "",
  );
  const [verificationNote, setVerificationNote] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofUploadProgress, setProofUploadProgress] = useState(0);
  const [proofUploadStatus, setProofUploadStatus] = useState("");

  async function onProofFileSelected(file?: File) {
    if (!file) return;
    try {
      setIsUploadingProof(true);
      setProofUploadProgress(0);
      setProofUploadStatus("");
      const uploaded = await uploadMediaFile(file, {
        onProgress: (percent) => setProofUploadProgress(percent),
        onStatus: (status) => setProofUploadStatus(status),
      });
      setPaymentProofUrl(uploaded.url);
      toast.success("Proof uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploadingProof(false);
    }
  }

  function save() {
    startTransition(async () => {
      const result = await updateRegistrationAdmin(
        {
          id: row.id,
          status,
          paymentStatus,
          paymentMethod,
          paymentReference,
          paymentProofUrl,
          verificationNote,
          cancellationReason,
        },
        locale,
      );
      if (result.error) toast.error(result.error);
      else {
        toast.success("Registration updated.");
        onClose();
      }
    });
  }

  return (
    <DialogContent className="max-w-6xl">
      <DialogHeader>
        <DialogTitle>Manage Registration — {row.registrantName}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Event
          </p>
          <p className="text-sm font-medium">{row.eventTitle}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Registrant
          </p>
          <p className="text-sm font-medium">{row.registrantName}</p>
          <p className="text-xs text-muted-foreground">{row.registrantEmail}</p>
        </div>
        <div>
          <FieldLabel>Registration Status</FieldLabel>
          <StyledSelect
            value={status}
            onValueChange={setStatus}
            options={[
              { value: "pending", label: "Pending" },
              { value: "confirmed", label: "Confirmed" },
              { value: "cancelled", label: "Cancelled" },
              { value: "attended", label: "Attended" },
              { value: "submitted", label: "Submitted" },
            ]}
          />
        </div>
        <div>
          <FieldLabel>Payment Status</FieldLabel>
          <StyledSelect
            value={paymentStatus}
            onValueChange={setPaymentStatus}
            options={[
              { value: "pending", label: "Pending" },
              { value: "paid", label: "Paid" },
              { value: "failed", label: "Failed" },
              { value: "verified", label: "Verified" },
            ]}
          />
        </div>
        <div>
          <FieldLabel>Payment Method</FieldLabel>
          <StyledSelect
            value={paymentMethod}
            onValueChange={setPaymentMethod}
            options={[
              { value: "card", label: "Card" },
              { value: "bank", label: "Bank Transfer" },
              { value: "free", label: "Free / Complimentary" },
            ]}
          />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Payment Reference
          </p>
          <Input
            className="h-10"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Payment Proof
          </p>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            {paymentProofUrl ? (
              <div className="space-y-2">
                {isLikelyImageUrl(paymentProofUrl) ? (
                  <a
                    className="block overflow-hidden rounded-md border border-border/60 bg-muted"
                    href={paymentProofUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="Payment proof"
                      className="max-h-56 w-full object-contain"
                      src={paymentProofUrl}
                    />
                  </a>
                ) : (
                  <a
                    className="inline-flex h-9 items-center rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
                    href={paymentProofUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink className="mr-1.5 size-3.5" />
                    Open payment proof
                  </a>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    className="h-8 text-xs"
                    onClick={() => proofInputRef.current?.click()}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Upload className="mr-1.5 size-3.5" />
                    Replace
                  </Button>
                  <a
                    className={cn(
                      "inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium hover:bg-muted",
                    )}
                    href={paymentProofUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink className="mr-1.5 size-3.5" />
                    Open
                  </a>
                  <Button
                    className="h-8 text-xs"
                    onClick={() => setPaymentProofUrl("")}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  className="h-8 text-xs"
                  onClick={() => proofInputRef.current?.click()}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Upload className="mr-1.5 size-3.5" />
                  Upload proof
                </Button>
                <span className="text-xs text-muted-foreground">
                  No proof uploaded yet.
                </span>
              </div>
            )}
            <input
              ref={proofInputRef}
              className="hidden"
              type="file"
              accept="image/*"
              onChange={(e) => void onProofFileSelected(e.target.files?.[0])}
            />
            <div className="mt-3">
              <Input
                className="h-10"
                placeholder="Or paste proof URL manually"
                value={paymentProofUrl}
                onChange={(e) => setPaymentProofUrl(e.target.value)}
              />
              <UploadProgress
                isActive={isUploadingProof}
                percent={proofUploadProgress}
                status={proofUploadStatus}
              />
            </div>
          </div>
        </div>
        <div className="sm:col-span-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Verification Note
          </p>
          <Input
            className="h-10"
            value={verificationNote}
            onChange={(e) => setVerificationNote(e.target.value)}
          />
        </div>
        {status === "cancelled" ? (
          <div className="sm:col-span-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Cancellation Reason
            </p>
            <Input
              className="h-10"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
          </div>
        ) : null}
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button disabled={isPending || isUploadingProof} onClick={save}>
          {isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </DialogContent>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ExportSchemaDialog
// ─────────────────────────────────────────────────────────────────────────────

function ExportSchemaDialog() {
  const columns = [
    "event_name",
    "event_start_date",
    "event_end_date",
    "registrant_name",
    "registrant_email",
    "payment_method",
    "payment_status",
    "amount",
    "status",
    "created_at",
    "confirmed_at",
    "cancelled_at",
    "cancellation_reason",
    "form_data",
    "form_<dynamic_field_key>",
  ];

  return (
    <DialogContent className="max-w-6xl">
      <DialogHeader>
        <DialogTitle>CSV Export Columns</DialogTitle>
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        {columns.map((col) => (
          <div
            className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs font-medium text-foreground"
            key={col}
          >
            {col}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        `form_data` contains the raw JSON payload. `form_...` columns are
        flattened per form key and generated automatically from registration
        submissions.
      </p>
    </DialogContent>
  );
}

function RegistrationDetailsDialog({
  row,
}: {
  row: RegistrationRow;
}) {
  const dynamicEntries = Object.entries(row.formData ?? {}).filter(
    ([key]) => !["name", "email", "phone"].includes(key.toLowerCase()),
  );
  return (
    <DialogContent className="max-w-6xl">
      <DialogHeader>
        <DialogTitle>Registration Details</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Registrant
          </p>
          <p className="text-sm font-semibold">{row.registrantName}</p>
          <p className="text-xs text-muted-foreground">{row.registrantEmail}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Event
          </p>
          <p className="text-sm font-semibold">{row.eventTitle}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(row.eventStartDate)}{row.eventEndDate ? ` → ${formatDate(row.eventEndDate)}` : ""}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Registration
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("border capitalize", statusColors[row.status] ?? "")} variant="outline">
              {row.status}
            </Badge>
            <Badge
              className={cn(
                "border capitalize",
                paymentStatusColors[row.paymentStatus] ?? "border-border bg-muted text-muted-foreground",
              )}
              variant="outline"
            >
              {row.paymentStatus}
            </Badge>
            <Badge
              className={cn(
                "border uppercase",
                paymentMethodColors[row.paymentMethod] ?? "border-border bg-muted text-muted-foreground",
              )}
              variant="outline"
            >
              {row.paymentMethod}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Created: {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(row.createdAt)}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Payment
          </p>
          <p className="text-xs text-muted-foreground">Reference: {row.paymentRef ?? "—"}</p>
          <p className="text-xs text-muted-foreground">Amount: {row.amount ? `${row.amount} OMR` : "—"}</p>
          {row.paymentProofUrl ? (
            <a className="mt-2 inline-flex text-xs font-medium text-primary underline" href={row.paymentProofUrl} rel="noreferrer" target="_blank">
              Open payment proof
            </a>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card">
        <div className="border-b border-border/60 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Submitted form data</p>
        </div>
        {dynamicEntries.length > 0 ? (
          <div className="grid gap-2 p-3 sm:grid-cols-2">
            {dynamicEntries.map(([key, value]) => (
              <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2" key={key}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{key}</p>
                <p className="mt-1 break-words text-xs">{String(value ?? "—")}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-3 py-5 text-sm text-muted-foreground">No additional form fields submitted.</p>
        )}
      </div>
    </DialogContent>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RegistrationsTable
// ─────────────────────────────────────────────────────────────────────────────

export function RegistrationsTable({
  eventOptions,
  initialCreateOpen = false,
  locale,
  registrations,
  fixedEventId,
}: {
  eventOptions: RegistrationEventOption[];
  initialCreateOpen?: boolean;
  locale: string;
  registrations: RegistrationRow[];
  fixedEventId?: string;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("dateDesc");
  const [exportEventId, setExportEventId] = useState(fixedEventId ?? "all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [paymentRow, setPaymentRow] = useState<RegistrationRow | null>(null);
  const [manageRow, setManageRow] = useState<RegistrationRow | null>(null);
  const [detailsRow, setDetailsRow] = useState<RegistrationRow | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(initialCreateOpen);
  const [isSchemaOpen, setIsSchemaOpen] = useState(false);
  const [cancelRow, setCancelRow] = useState<RegistrationRow | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const onOpen = () => setIsCreateOpen(true);
    window.addEventListener(
      "dashboard:open-create-registration",
      onOpen as EventListener,
    );
    return () => {
      window.removeEventListener(
        "dashboard:open-create-registration",
        onOpen as EventListener,
      );
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = registrations.filter((r) => {
      const matchesQuery =
        !q ||
        r.registrantName.toLowerCase().includes(q) ||
        r.registrantEmail.toLowerCase().includes(q) ||
        r.eventTitle.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesPayment =
        paymentFilter === "all" || r.paymentStatus === paymentFilter;
      const matchesMethod =
        methodFilter === "all" || r.paymentMethod === methodFilter;
      return matchesQuery && matchesStatus && matchesPayment && matchesMethod;
    });
    const sorted = [...list];
    if (sortBy === "dateAsc")
      sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    else if (sortBy === "nameAsc")
      sorted.sort((a, b) => a.registrantName.localeCompare(b.registrantName));
    else if (sortBy === "eventAsc")
      sorted.sort((a, b) => a.eventTitle.localeCompare(b.eventTitle));
    else sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return sorted;
  }, [registrations, query, statusFilter, paymentFilter, methodFilter, sortBy]);

  const allSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  const rowEventOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of registrations) {
      if (!map.has(row.eventId)) map.set(row.eventId, row.eventTitle);
    }
    return [...map.entries()]
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [registrations]);

  const effectiveEventOptions =
    eventOptions.length > 0 ? eventOptions : rowEventOptions;

  function exportRegistrations() {
    const eventId =
      fixedEventId ?? (exportEventId === "all" ? "" : exportEventId);
    const q = eventId ? `?eventId=${encodeURIComponent(eventId)}` : "";
    window.location.href = `/api/admin/exports/registrations${q}`;
  }

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

  function handleCancelRegistration() {
    if (!cancelRow) return;
    startTransition(async () => {
      const result = await cancelRegistration(
        cancelRow.id,
        cancelReason,
        locale,
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Registration cancelled.");
      setCancelRow(null);
      setCancelReason("");
      setSelected(new Set());
    });
  }

  return (
    <>
      <Dialog
        open={!!paymentRow}
        onOpenChange={(open) => {
          if (!open) setPaymentRow(null);
        }}
      >
        {paymentRow && (
          <PaymentDialog
            locale={locale}
            row={paymentRow}
            onClose={() => setPaymentRow(null)}
          />
        )}
      </Dialog>
      <Dialog
        open={!!manageRow}
        onOpenChange={(open) => {
          if (!open) setManageRow(null);
        }}
      >
        {manageRow ? (
          <ManageRegistrationDialog
            locale={locale}
            row={manageRow}
            onClose={() => setManageRow(null)}
          />
        ) : null}
      </Dialog>
      <Dialog
        open={!!detailsRow}
        onOpenChange={(open) => {
          if (!open) setDetailsRow(null);
        }}
      >
        {detailsRow ? <RegistrationDetailsDialog row={detailsRow} /> : null}
      </Dialog>
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        {isCreateOpen ? (
          <CreateRegistrationDialog
            eventOptions={effectiveEventOptions as RegistrationEventOption[]}
            fixedEventId={fixedEventId}
            locale={locale}
            onClose={() => setIsCreateOpen(false)}
          />
        ) : null}
      </Dialog>
      <Dialog open={isSchemaOpen} onOpenChange={setIsSchemaOpen}>
        {isSchemaOpen ? <ExportSchemaDialog /> : null}
      </Dialog>
      <Dialog
        open={!!cancelRow}
        onOpenChange={(open) => {
          if (!open) {
            setCancelRow(null);
            setCancelReason("");
          }
        }}
      >
        {cancelRow && (
          <DialogContent className="max-w-6xl">
            <DialogHeader>
              <DialogTitle>Cancel registration</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {cancelRow.registrantName} will be marked as cancelled.
              </p>
              <Input
                placeholder="Optional cancellation reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCancelRow(null);
                    setCancelReason("");
                  }}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  disabled={isPending}
                  onClick={handleCancelRegistration}
                >
                  {isPending ? "Cancelling…" : "Confirm cancel"}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <div className="grid gap-4">
        {/* Filters */}
        <div className="rounded-xl border border-border/70 bg-card p-4">
          <div className="flex flex-wrap items-start gap-3">
            <div className="relative min-w-[280px] flex-[1.6_1_360px]">
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
            <StyledSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={[
                { value: "all", label: "All statuses" },
                { value: "pending", label: "Pending" },
                { value: "confirmed", label: "Confirmed" },
                { value: "cancelled", label: "Cancelled" },
                { value: "attended", label: "Attended" },
              ]}
              className="min-w-[160px] flex-1"
            />
            <StyledSelect
              value={paymentFilter}
              onValueChange={setPaymentFilter}
              options={[
                { value: "all", label: "All payments" },
                { value: "pending", label: "Pending" },
                { value: "paid", label: "Paid" },
                { value: "failed", label: "Failed" },
              ]}
              className="min-w-[150px] flex-1"
            />
            <StyledSelect
              value={methodFilter}
              onValueChange={setMethodFilter}
              options={[
                { value: "all", label: "All methods" },
                { value: "card", label: "Card" },
                { value: "bank", label: "Bank" },
                { value: "free", label: "Free" },
              ]}
              className="min-w-[140px] flex-1"
            />
            <StyledSelect
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortBy)}
              options={[
                { value: "dateDesc", label: "Newest first" },
                { value: "dateAsc", label: "Oldest first" },
                { value: "nameAsc", label: "Name (A–Z)" },
                { value: "eventAsc", label: "Event (A–Z)" },
              ]}
              className="min-w-[170px] flex-1"
            />
            {!fixedEventId && (
              <StyledSelect
                value={exportEventId}
                onValueChange={setExportEventId}
                options={[
                  { value: "all", label: "Export: All events" },
                  ...(effectiveEventOptions as RegistrationEventOption[]).map(
                    (e) => ({
                      value: e.id,
                      label: `Export: ${e.title}`,
                    }),
                  ),
                ]}
                className="min-w-[220px] flex-[1.2_1_220px]"
              />
            )}
            <div className="flex w-full flex-wrap items-center gap-2">
            <Button
              className="h-10 shrink-0 text-xs"
              onClick={() => setIsSchemaOpen(true)}
              size="sm"
              variant="outline"
            >
              <CircleHelp className="mr-1.5 size-3.5" />
              CSV Columns
            </Button>
            <Button
              className="h-10 shrink-0 text-xs"
              onClick={exportRegistrations}
              size="sm"
              variant="outline"
            >
              <Download className="mr-1.5 size-3.5" />
              {fixedEventId || exportEventId !== "all" ? "Export selected event CSV" : "Export all events CSV"}
            </Button>
            <Button
              className="h-10 shrink-0 gap-1.5 text-xs"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
                setPaymentFilter("all");
                setMethodFilter("all");
                setSortBy("dateDesc");
              }}
              type="button"
              variant="outline"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {filtered.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {registrations.length}
            </span>{" "}
            registrations
          </p>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3">
            <span className="text-sm font-medium">
              {selected.size} selected
            </span>
            <div className="flex gap-2">
              {["confirmed", "pending", "cancelled"].map((s) => (
                <Button
                  disabled={isPending}
                  key={s}
                  onClick={() => handleBulkStatus(s)}
                  size="sm"
                  variant="outline"
                >
                  <CheckCircle2 className="mr-1.5 size-3.5" />
                  Mark {s}
                </Button>
              ))}
              <AlertDialog>
                <AlertDialogTrigger
                  className={buttonVariants({
                    size: "sm",
                    variant: "destructive",
                  })}
                  disabled={isPending}
                >
                  Delete
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete {selected.size} registration(s)?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete([...selected])}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        {/* Table */}
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="py-10 text-center text-sm text-muted-foreground"
                    colSpan={7}
                  >
                    No registrations found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(r.id)}
                        onCheckedChange={() => toggle(r.id)}
                      />
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
                      <p className="text-xs text-muted-foreground">
                        {r.registrantEmail}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "border capitalize",
                          statusColors[r.status] ?? "",
                        )}
                        variant="outline"
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          className={cn(
                            "border capitalize",
                            paymentStatusColors[r.paymentStatus] ??
                              "border-border bg-muted text-muted-foreground",
                          )}
                          variant="outline"
                        >
                          {r.paymentStatus}
                        </Badge>
                        <Badge
                          className={cn(
                            "border uppercase",
                            paymentMethodColors[r.paymentMethod] ??
                              "border-border bg-muted text-muted-foreground",
                          )}
                          variant="outline"
                        >
                          {r.paymentMethod}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("en-GB", {
                        dateStyle: "medium",
                      }).format(r.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 rounded-md border border-input bg-transparent px-3 text-xs font-medium hover:bg-muted">
                          Actions
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-fit min-w-0">
                          <DropdownMenuItem onClick={() => setDetailsRow(r)}>
                            <User className="mr-1.5 size-3.5" />
                            Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPaymentRow(r)}>
                            <CircleDollarSign className="mr-1.5 size-3.5" />
                            Payment
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setManageRow(r)}>
                            Manage
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={r.status === "cancelled"}
                            onClick={() => setCancelRow(r)}
                            variant="destructive"
                          >
                            <Ban className="mr-1.5 size-3.5" />
                            Cancel registration
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
