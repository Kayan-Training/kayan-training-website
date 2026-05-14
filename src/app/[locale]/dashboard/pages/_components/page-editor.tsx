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
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  BrushIcon,
  Copy01Icon,
  Delete02Icon,
  DragDropVerticalIcon,
  FloppyDiskIcon,
  Image01Icon,
  Image02Icon,
  PaintBoardIcon,
  Redo02Icon,
  Undo02Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertTriangle,
  AlignLeft,
  ArrowLeft,
  ChevronDown,
  ClipboardPaste,
  Copy,
  FileText,
  GripVertical,
  ImageIcon,
  Languages,
  Loader2,
  MoreHorizontal,
  Plus,
  Redo2,
  Search,
  Undo2,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { DashboardSectionHeading } from "@/components/dashboard/editor-primitives";
import { RichTextEditor } from "@/components/dashboard/rich-text-editor";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImagePickerField } from "@/components/ui/image-picker-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type LinkPickerEntities,
  LinkPickerInput,
} from "@/components/ui/link-picker-input";
import { MediaLibraryDialog } from "@/components/ui/media-library-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UploadProgress } from "@/components/ui/upload-progress";
import { uploadMediaFile } from "@/lib/client/media-upload";
import type { Block, HeroMedia } from "@/lib/pages/block-types";
import { migrateBlocks } from "@/lib/pages/migrate-blocks";
import { cn } from "@/lib/utils";
import {
  fetchMediaAction,
  fetchMediaPageAction,
  translateBlockAction,
  updatePageAction,
} from "../_actions";

export type { Block };

export type PageData = {
  id: string;
  slug: string;
  status: string;
  titleEn: string;
  titleAr: string;
  seoTitleEn: string;
  seoTitleAr: string;
  seoDescriptionEn: string;
  seoDescriptionAr: string;
  blocksEn: Block[];
  blocksAr: Block[];
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
  "h-10 w-full rounded-lg border border-input/80  px-3 text-sm text-foreground shadow-sm " +
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 " +
  "outline-none transition-colors";

const labelCls =
  "mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

// ─── Primitives ───────────────────────────────────────────────────────────────

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 lg:grid-cols-2">{children}</div>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const child = isValidElement(children)
    ? cloneElement(
        children as React.ReactElement<
          React.HTMLAttributes<HTMLElement> & { id?: string; title?: string }
        >,
        { id, title: label },
      )
    : children;
  return (
    <div className="space-y-0.5">
      <label className={labelCls} htmlFor={id}>
        {label}
      </label>
      {child}
    </div>
  );
}

function NumberStepper({
  value,
  onChange,
  min = 1,
  max,
  step = 1,
  presets = [],
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  presets?: number[];
}) {
  const clamp = (n: number) => {
    const withMin = Math.max(min, n);
    return typeof max === "number" ? Math.min(max, withMin) : withMin;
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[auto_1fr_auto] gap-1">
        <Button
          className="h-10 w-10 rounded-[4px]"
          onClick={() => onChange(clamp(value - step))}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          -
        </Button>
        <input
          className={cn(inputCls, "text-center")}
          min={min}
          max={max}
          step={step}
          type="number"
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value) || min))}
        />
        <Button
          className="h-10 w-10 rounded-[4px]"
          onClick={() => onChange(clamp(value + step))}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          +
        </Button>
      </div>
      {presets.length ? (
        <div className="flex flex-wrap gap-1">
          {presets.map((preset) => (
            <Button
              key={preset}
              className="h-7 rounded-[4px] px-2 text-[11px]"
              onClick={() => onChange(clamp(preset))}
              size="sm"
              type="button"
              variant={value === preset ? "default" : "outline"}
            >
              {preset}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LinkFieldWithMode({
  dir,
  entities,
  value,
  onChange,
  internalPlaceholder = "/en/contact",
}: {
  dir: "ltr" | "rtl";
  entities: LinkPickerEntities;
  value?: string;
  onChange: (url: string) => void;
  internalPlaceholder?: string;
}) {
  const modeId = useId();
  const detectMode = (url: string): "internal" | "external" | "anchor" => {
    if (url.startsWith("#")) return "anchor";
    if (/^https?:\/\//i.test(url) || url.startsWith("mailto:"))
      return "external";
    return "internal";
  };

  const safeValue = value ?? "";
  const [mode, setMode] = useState<"internal" | "external" | "anchor">(
    detectMode(safeValue),
  );

  useEffect(() => {
    setMode(detectMode(safeValue));
  }, [safeValue]);

  return (
    <div className="space-y-2">
      <RadioGroup
        className="grid w-full grid-cols-3 gap-0 rounded-md shadow-xs"
        value={mode}
        onValueChange={(next) => {
          const m = next as "internal" | "external" | "anchor";
          setMode(m);
          if (m === "external" && !safeValue) onChange("https://");
          if (m === "anchor" && (!safeValue || !safeValue.startsWith("#")))
            onChange("#section-id");
          if (
            m === "internal" &&
            (safeValue.startsWith("#") ||
              /^https?:\/\//i.test(safeValue) ||
              safeValue.startsWith("mailto:"))
          ) {
            onChange("");
          }
        }}
      >
        <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-center border p-2 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
          <RadioGroupItem
            className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
            id={`${modeId}-internal`}
            value="internal"
            aria-label="Internal link"
          />
          <Label
            className="cursor-pointer text-xs"
            htmlFor={`${modeId}-internal`}
          >
            Internal
          </Label>
        </div>
        <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-center border p-2 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
          <RadioGroupItem
            className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
            id={`${modeId}-external`}
            value="external"
            aria-label="External link"
          />
          <Label
            className="cursor-pointer text-xs"
            htmlFor={`${modeId}-external`}
          >
            External
          </Label>
        </div>
        <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-center border p-2 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
          <RadioGroupItem
            className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
            id={`${modeId}-anchor`}
            value="anchor"
            aria-label="Anchor link"
          />
          <Label
            className="cursor-pointer text-xs"
            htmlFor={`${modeId}-anchor`}
          >
            Anchor
          </Label>
        </div>
      </RadioGroup>

      {mode === "internal" ? (
        <LinkPickerInput
          dir={dir}
          entities={entities}
          placeholder={internalPlaceholder}
          value={safeValue}
          onChange={onChange}
        />
      ) : (
        <input
          className={cn(inputCls, dir === "rtl" && "text-right")}
          dir={dir}
          placeholder={
            mode === "external" ? "https://example.com" : "#section-id"
          }
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function ArrayItemRow({
  index,
  title,
  badges,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
  children,
}: {
  index: number;
  title?: string;
  badges?: string[];
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate?: () => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="group rounded-[8px] border border-border/60 bg-card/70 shadow overflow-hidden">
      <div className="flex items-center justify-between gap-2 py-2 px-3 border-b bg-secondary/5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-sm font-semibold text-primary p-1.5">
            {String(index + 1).padStart(2, "0")}
          </span>
          {title ? (
            <span className="truncate text-xs font-medium text-foreground/90">
              {title}
            </span>
          ) : null}
          {badges?.length
            ? badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-[4px] border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  {badge}
                </span>
              ))
            : null}
        </div>

        <ButtonGroup
          className={cn(
            "rounded-[4px] transition-all duration-150",
            "opacity-100 md:opacity-0 md:group-hover:opacity-100",
          )}
          style={{ "--radius": "4px" } as React.CSSProperties}
        >
          {onMoveUp ? (
            <Button
              aria-label={`Move item ${index + 1} up`}
              onClick={onMoveUp}
              size="icon-sm"
              variant="outline"
              className="cursor-pointer rounded-[4px]"
            >
              <HugeiconsIcon icon={ArrowUp01Icon} size={14} />
            </Button>
          ) : null}
          {onMoveDown ? (
            <Button
              aria-label={`Move item ${index + 1} down`}
              onClick={onMoveDown}
              size="icon-sm"
              variant="outline"
              className="cursor-pointer rounded-[4px]"
            >
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
            </Button>
          ) : null}
          {onDuplicate ? (
            <Button
              aria-label={`Duplicate item ${index + 1}`}
              onClick={onDuplicate}
              size="icon-sm"
              variant="outline"
              className="cursor-pointer rounded-[4px]"
            >
              <HugeiconsIcon icon={Copy01Icon} size={14} />
            </Button>
          ) : null}
          <Button
            variant="destructive"
            size="icon-sm"
            onClick={onRemove}
            aria-label={`Remove item ${index + 1}`}
            className="cursor-pointer border-border"
          >
            <HugeiconsIcon
              icon={Delete02Icon}
              size={14}
              className="text-destructive"
            />
          </Button>
        </ButtonGroup>
      </div>
      {children}
    </div>
  );
}

function displayModeLabel(value: "original" | "mono" | undefined) {
  return value === "mono" ? "Mono" : "Original Colors";
}

function logoSizeLabel(value: "sm" | "md" | "lg" | undefined) {
  if (value === "sm") return "Small";
  if (value === "lg") return "Large";
  return "Medium";
}

function AddItemButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/70 bg-card/70 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
      type="button"
      onClick={onClick}
    >
      <Plus className="size-3" />
      {label}
    </button>
  );
}

function BlockSubsection({
  title,
  hint,
  defaultOpen = true,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-xl border border-border/60 bg-card/70 shadow-[inset_0_1px_0_hsl(var(--background)/0.7)]">
      <button
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
      >
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            !open && "-rotate-90",
          )}
        />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
            {title}
          </p>
          {hint ? (
            <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
          ) : null}
        </div>
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden border-t border-border/50 px-4 py-4">
          {children}
        </div>
      </div>
    </section>
  );
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Block wireframes ─────────────────────────────────────────────────────────

// ─── Block wireframes ─────────────────────────────────────────────────────────

type BlockType = Block["type"];
type BlockNavFilter = "all" | "needs-attention" | "untranslated";

function BlockWireframe({ type }: { type: BlockType }) {
  const bg = "#ffffff";
  const panel = "#f8fafc";
  const line = "#cbd5e1";
  const lineStrong = "#94a3b8";
  const accent = "#22c55e";
  const accentSoft = "#dcfce7";

  const frames: Record<BlockType, React.ReactNode> = {
    page_hero: (
      <>
        <rect width="120" height="68" fill={bg} />
        <rect x="0" y="0" width="120" height="68" fill="#e2e8f0" />
        <rect
          x="0"
          y="36"
          width="120"
          height="32"
          fill="#0f172a"
          opacity="0.35"
        />
        <rect
          x="12"
          y="12"
          width="24"
          height="3"
          rx="1.5"
          fill={accent}
          opacity="0.8"
        />
        <rect
          x="18"
          y="21"
          width="84"
          height="6"
          rx="2"
          fill="white"
          opacity="0.85"
        />
        <rect
          x="26"
          y="30"
          width="68"
          height="4"
          rx="1.5"
          fill="#e2e8f0"
          opacity="0.9"
        />
        <rect
          x="41"
          y="46"
          width="38"
          height="10"
          rx="3"
          fill={accent}
          opacity="0.9"
        />
      </>
    ),
    about_intro: (
      <>
        <rect width="120" height="68" fill={bg} />
        <rect x="8" y="10" width="58" height="4" rx="1.5" fill={lineStrong} />
        <rect x="8" y="18" width="52" height="3" rx="1" fill={line} />
        <rect x="8" y="24" width="55" height="3" rx="1" fill={line} />
        <rect x="8" y="30" width="45" height="3" rx="1" fill={line} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect
              x={8 + i * 32}
              y="42"
              width="28"
              height="14"
              rx="2"
              fill={accentSoft}
            />
            <rect
              x={14 + i * 32}
              y="46"
              width="16"
              height="2.5"
              rx="1"
              fill={accent}
              opacity="0.8"
            />
          </g>
        ))}
      </>
    ),
    mission_vision: (
      <>
        <rect width="120" height="68" fill={bg} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect
              x={6 + i * 38}
              y="10"
              width="32"
              height="48"
              rx="3"
              fill={panel}
              stroke={line}
            />
            <rect
              x={12 + i * 38}
              y="18"
              width="20"
              height="3"
              rx="1"
              fill={lineStrong}
            />
            <rect
              x={12 + i * 38}
              y="25"
              width="20"
              height="2"
              rx="1"
              fill={line}
            />
            <rect
              x={12 + i * 38}
              y="30"
              width="16"
              height="2"
              rx="1"
              fill={line}
            />
            <rect
              x={10 + i * 38}
              y="40"
              width="24"
              height="12"
              rx="2"
              fill={accentSoft}
            />
          </g>
        ))}
      </>
    ),
    process_steps: (
      <>
        <rect width="120" height="68" fill={bg} />
        <rect
          x="8"
          y="8"
          width="42"
          height="52"
          rx="3"
          fill={panel}
          stroke={line}
        />
        <rect x="13" y="14" width="32" height="5" rx="1.5" fill={lineStrong} />
        <rect x="13" y="23" width="28" height="3" rx="1" fill={line} />
        <rect x="13" y="29" width="24" height="3" rx="1" fill={line} />
        <rect x="13" y="38" width="20" height="12" rx="2.5" fill={accentSoft} />

        <rect
          x="56"
          y="8"
          width="56"
          height="52"
          rx="3"
          fill={panel}
          stroke={line}
        />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(0, ${i * 14})`}>
            <rect x="62" y="14" width="8" height="8" rx="4" fill={accent} />
            <rect
              x="74"
              y="16"
              width="26"
              height="3"
              rx="1"
              fill={lineStrong}
            />
            <rect x="74" y="21" width="30" height="2" rx="1" fill={line} />
          </g>
        ))}
      </>
    ),
    values_list: (
      <>
        <rect width="120" height="68" fill={bg} />
        {[0, 1, 2].map((row) =>
          [0, 1].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={8 + col * 56}
              y={8 + row * 18}
              width="48"
              height="14"
              rx="2"
              fill={panel}
              stroke={line}
            />
          )),
        )}
        {[0, 1, 2].map((row) =>
          [0, 1].map((col) => (
            <g key={`t-${row}-${col}`}>
              <rect
                x={14 + col * 56}
                y={13 + row * 18}
                width={28}
                height="2.5"
                rx="1"
                fill={lineStrong}
              />
              <rect
                x={14 + col * 56}
                y={17 + row * 18}
                width={22}
                height="2"
                rx="1"
                fill={line}
              />
            </g>
          )),
        )}
      </>
    ),
    accreditation: (
      <>
        <rect width="120" height="68" fill={bg} />
        <rect
          x="8"
          y="10"
          width="40"
          height="48"
          rx="3"
          fill={panel}
          stroke={line}
        />
        <rect x="16" y="20" width="24" height="24" rx="12" fill={accentSoft} />
        <rect
          x="19"
          y="23"
          width="18"
          height="18"
          rx="9"
          fill={accent}
          opacity="0.25"
        />
        <rect x="18" y="48" width="20" height="2" rx="1" fill={line} />
        <rect x="54" y="12" width="58" height="5" rx="1.5" fill={lineStrong} />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect
              x="54"
              y={22 + i * 10}
              width="8"
              height="6"
              rx="1.5"
              fill={accent}
            />
            <rect
              x="66"
              y={24 + i * 10}
              width="42"
              height="2.5"
              rx="1"
              fill={line}
            />
            <rect
              x="66"
              y={27 + i * 10}
              width="30"
              height="1.8"
              rx="1"
              fill={line}
              opacity="0.7"
            />
          </g>
        ))}
      </>
    ),
    service_cards: (
      <>
        <rect width="120" height="68" fill={bg} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect
              x={6 + i * 38}
              y="8"
              width="32"
              height="52"
              rx="3"
              fill={panel}
              stroke={line}
            />
            <rect
              x={6 + i * 38}
              y="8"
              width="32"
              height="28"
              rx="3"
              fill="#e2e8f0"
            />
            <rect
              x={11 + i * 38}
              y="41"
              width="22"
              height="3"
              rx="1"
              fill={lineStrong}
            />
            <rect
              x={11 + i * 38}
              y="47"
              width="18"
              height="2"
              rx="1"
              fill={line}
            />
            <rect
              x={11 + i * 38}
              y="52"
              width="14"
              height="2"
              rx="1"
              fill={line}
            />
          </g>
        ))}
      </>
    ),
    training_domains: (
      <>
        <rect width="120" height="68" fill={bg} />
        {[0, 1, 2, 3].map((col) =>
          [0, 1].map((row) => (
            <rect
              key={`${col}-${row}`}
              x={6 + col * 27}
              y={8 + row * 28}
              width="22"
              height="22"
              rx="3"
              fill={col % 2 === 0 ? accentSoft : panel}
              stroke={line}
            />
          )),
        )}
        {[0, 1, 2, 3].map((col) =>
          [0, 1].map((row) => (
            <rect
              key={`t-${col}-${row}`}
              x={10 + col * 27}
              y={20 + row * 28}
              width="14"
              height="2"
              rx="1"
              fill={col % 2 === 0 ? accent : lineStrong}
            />
          )),
        )}
      </>
    ),
    cta_banner: (
      <>
        <rect width="120" height="68" fill="#f0fdf4" />
        <rect x="20" y="14" width="80" height="6" rx="2" fill={lineStrong} />
        <rect x="32" y="24" width="56" height="4" rx="1.5" fill={line} />
        <rect x="36" y="32" width="48" height="3" rx="1.5" fill={line} />
        <rect x="38" y="44" width="44" height="12" rx="4" fill={accent} />
        <rect x="46" y="49" width="28" height="2.5" rx="1" fill={accentSoft} />
      </>
    ),
    richtext: (
      <>
        <rect width="120" height="68" fill={bg} />
        {[8, 14, 20, 26, 36, 42, 48, 54].map((y, i) => (
          <rect
            key={y}
            x="8"
            y={y}
            width={[100, 88, 95, 60, 100, 72, 90, 50][i]}
            height="3"
            rx="1"
            fill={i === 3 || i === 7 ? line : lineStrong}
          />
        ))}
      </>
    ),
    hero: (
      <>
        <rect width="120" height="68" fill="#e2e8f0" />
        <rect
          x="0"
          y="0"
          width="120"
          height="68"
          fill="#0f172a"
          opacity="0.35"
        />
        <rect x="8" y="9" width="52" height="3.5" rx="1.5" fill={accent} />
        <rect x="20" y="20" width="80" height="8" rx="2" fill="white" />
        <rect x="30" y="32" width="60" height="5" rx="1.5" fill="#e2e8f0" />
        <rect
          x="42"
          y="46"
          width="36"
          height="10"
          rx="3"
          fill={accent}
          stroke={accentSoft}
          strokeWidth="0.8"
        />
      </>
    ),
    cta: (
      <>
        <rect width="120" height="68" fill={bg} />
        <rect x="16" y="12" width="88" height="7" rx="2" fill={lineStrong} />
        <rect x="24" y="23" width="72" height="4" rx="1.5" fill={line} />
        <rect x="28" y="30" width="64" height="4" rx="1.5" fill={line} />
        <rect
          x="34"
          y="44"
          width="52"
          height="14"
          rx="4"
          fill={accent}
          stroke={accentSoft}
          strokeWidth="0.8"
        />
        <rect x="46" y="50" width="28" height="2.5" rx="1" fill={accentSoft} />
      </>
    ),
    listing_config: (
      <>
        <rect width="120" height="68" fill={bg} />
        <rect x="8" y="8" width="70" height="7" rx="2" fill={lineStrong} />
        <rect x="8" y="19" width="90" height="4" rx="1.5" fill={line} />
        <rect x="8" y="27" width="70" height="3" rx="1.5" fill={line} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect
              x="8"
              y={36 + i * 9}
              width="104"
              height="6"
              rx="1.5"
              fill={panel}
              stroke={line}
            />
            <rect
              x="12"
              y={38 + i * 9}
              width="40"
              height="2"
              rx="1"
              fill={lineStrong}
            />
          </g>
        ))}
      </>
    ),
    accreditation_bar: (
      <>
        <rect width="120" height="68" fill={bg} />
        <rect x="8" y="10" width="30" height="6" rx="2" fill={accent} />
        <rect x="8" y="20" width="50" height="4" rx="1.5" fill={lineStrong} />
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={8 + i * 29}
            y="32"
            width="24"
            height="22"
            rx="2"
            fill={panel}
            stroke={line}
          />
        ))}
      </>
    ),
    home_events_carousel: (
      <>
        <rect width="120" height="68" fill={bg} />
        <rect x="8" y="7" width="34" height="4" rx="1.5" fill={accent} />
        <rect x="8" y="14" width="58" height="3" rx="1.5" fill={line} />
        <rect
          x="12"
          y="22"
          width="30"
          height="40"
          rx="2.5"
          fill={panel}
          stroke={line}
        />
        <rect
          x="45"
          y="22"
          width="30"
          height="40"
          rx="2.5"
          fill={panel}
          stroke={line}
        />
        <rect
          x="78"
          y="22"
          width="30"
          height="40"
          rx="2.5"
          fill={panel}
          stroke={line}
        />
        <rect x="16" y="51" width="13" height="2" rx="1" fill={accent} />
        <rect x="49" y="51" width="13" height="2" rx="1" fill={accent} />
        <rect x="82" y="51" width="13" height="2" rx="1" fill={accent} />
      </>
    ),
    home_posts_grid: (
      <>
        <rect width="120" height="68" fill={bg} />
        <rect x="8" y="7" width="30" height="4" rx="1.5" fill={accent} />
        <rect x="8" y="14" width="52" height="3" rx="1.5" fill={line} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect
              x={8 + i * 38}
              y="24"
              width="34"
              height="36"
              rx="3"
              fill={panel}
              stroke={line}
            />
            <rect
              x={10 + i * 38}
              y="27"
              width="30"
              height="12"
              rx="2"
              fill="#e2e8f0"
            />
            <rect
              x={10 + i * 38}
              y="42"
              width="24"
              height="2.6"
              rx="1"
              fill={accent}
            />
            <rect
              x={10 + i * 38}
              y="47"
              width="27"
              height="2"
              rx="1"
              fill={line}
            />
            <rect
              x={10 + i * 38}
              y="51"
              width="20"
              height="2"
              rx="1"
              fill={line}
            />
          </g>
        ))}
      </>
    ),
  };

  return (
    <svg
      className="h-20 w-36 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-white"
      viewBox="0 0 120 68"
    >
      {frames[type] ?? <rect width="120" height="68" fill="#ffffff" />}
    </svg>
  );
}

// ─── Add-block dropdown ───────────────────────────────────────────────────────

const ADD_BLOCK_OPTIONS: { label: string; type: BlockType }[] = [
  { type: "page_hero", label: "Page Hero" },
  { type: "about_intro", label: "About Intro" },
  { type: "mission_vision", label: "Mission / Vision" },
  { type: "process_steps", label: "Process Steps" },
  { type: "values_list", label: "Values List" },
  { type: "accreditation", label: "Accreditation" },
  { type: "service_cards", label: "Service Cards" },
  { type: "training_domains", label: "Training Domains" },
  { type: "cta_banner", label: "CTA Banner" },
  { type: "richtext", label: "Rich Text" },
  { type: "hero", label: "Hero (simple)" },
  { type: "cta", label: "CTA (simple)" },
  { type: "listing_config", label: "Listing Config" },
  { type: "accreditation_bar", label: "Accreditation Bar" },
  { type: "home_events_carousel", label: "Events Carousel" },
  { type: "home_posts_grid", label: "Posts Grid" },
];

const ADD_BLOCK_GROUPS: {
  group: string;
  types: BlockType[];
}[] = [
  {
    group: "Core Content",
    types: [
      "page_hero",
      "about_intro",
      "mission_vision",
      "process_steps",
      "values_list",
      "richtext",
    ],
  },
  {
    group: "Trust & Authority",
    types: ["accreditation", "accreditation_bar"],
  },
  {
    group: "Offer & Conversion",
    types: ["service_cards", "training_domains", "cta_banner", "cta"],
  },
  {
    group: "Homepage Dynamic",
    types: [
      "home_events_carousel",
      "home_posts_grid",
      "listing_config",
      "hero",
    ],
  },
];

const BLOCK_LABELS: Record<BlockType, string> = Object.fromEntries(
  ADD_BLOCK_OPTIONS.map(({ type, label }) => [type, label]),
) as Record<BlockType, string>;

type BlockDiagnostics = {
  mediaCount: number;
  missingRequiredContent: boolean;
  untranslated: boolean;
};

function hasMissingRequiredContent(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;

  if (Array.isArray(value)) {
    if (value.length === 0) return true;
    return value.some((item) => hasMissingRequiredContent(item));
  }

  for (const [key, fieldValue] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (
      /(id|slug|href|url|src|variant|style|theme|position|align|mode|type)/i.test(
        key,
      )
    ) {
      continue;
    }
    if (
      /(title|heading|eyebrow|body|description|label|text|name|alt|caption|cta)/i.test(
        key,
      )
    ) {
      if (typeof fieldValue === "string" && fieldValue.trim().length === 0) {
        return true;
      }
    }
    if (fieldValue && typeof fieldValue === "object") {
      if (hasMissingRequiredContent(fieldValue)) return true;
    }
  }

  return false;
}

function countMediaReferences(value: unknown): number {
  if (!value || typeof value !== "object") return 0;
  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + countMediaReferences(item), 0);
  }

  let count = 0;
  for (const [key, fieldValue] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (/(image|video|media|logo|poster|thumbnail|file|asset)/i.test(key)) {
      if (Array.isArray(fieldValue)) {
        count += fieldValue.length;
      } else if (fieldValue) {
        count += 1;
      }
    }
    if (typeof fieldValue === "string" && /^https?:\/\//.test(fieldValue)) {
      count += 1;
    } else if (fieldValue && typeof fieldValue === "object") {
      count += countMediaReferences(fieldValue);
    }
  }
  return count;
}

function BlockNavSidebar({
  blocks,
  diagnostics,
  selectedBlockId,
  onSelectBlock,
}: {
  blocks: Block[];
  diagnostics: Record<string, BlockDiagnostics>;
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
}) {
  const [filter, setFilter] = useState<BlockNavFilter>("all");
  if (blocks.length === 0) return null;

  const counts = blocks.reduce(
    (acc, block) => {
      const diag = diagnostics[block.id];
      if (!diag) return acc;
      if (diag.missingRequiredContent) acc.needsAttention += 1;
      if (diag.untranslated) acc.untranslated += 1;
      return acc;
    },
    { needsAttention: 0, untranslated: 0 },
  );

  const filteredBlocks = blocks.filter((block) => {
    const diag = diagnostics[block.id];
    if (!diag) return true;
    if (filter === "needs-attention") return diag.missingRequiredContent;
    if (filter === "untranslated") return diag.untranslated;
    return true;
  });

  return (
    <aside className="sticky top-24 hidden h-fit w-full px-3 shrink-0 self-start xl:block">
      <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
        Blocks
      </p>
      <div className="mb-2 flex flex-wrap gap-1">
        {[
          { id: "all" as const, label: "All", value: blocks.length },
          {
            id: "needs-attention" as const,
            label: "Needs",
            value: counts.needsAttention,
          },
          {
            id: "untranslated" as const,
            label: "Locale",
            value: counts.untranslated,
          },
        ].map((chip) => (
          <button
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors",
              filter === chip.id
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border/70 text-muted-foreground hover:bg-muted",
            )}
            key={chip.id}
            type="button"
            onClick={() => setFilter(chip.id)}
          >
            {chip.label} {chip.value}
          </button>
        ))}
      </div>
      <nav className="space-y-0.5">
        {filteredBlocks.map((block, i) => {
          const diag = diagnostics[block.id];
          const isSelected = selectedBlockId === block.id;
          return (
            <button
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] transition-colors",
                isSelected
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              key={block.id}
              type="button"
              onClick={() => {
                onSelectBlock(block.id);
                document
                  .querySelector(`[data-block-id="${block.id}"]`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <span className="shrink-0 font-mono text-[9px] text-muted-foreground/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="truncate">{BLOCK_LABELS[block.type]}</span>
              {diag?.missingRequiredContent ? (
                <AlertTriangle className="ml-auto size-3 shrink-0 text-amber-500" />
              ) : diag?.untranslated ? (
                <Languages className="ml-auto size-3 shrink-0 text-blue-500" />
              ) : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function AddBlockMenu({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const visibleGroups = ADD_BLOCK_GROUPS.map((group) => ({
    ...group,
    types: group.types.filter((type) => {
      const label = BLOCK_LABELS[type].toLowerCase();
      const description = BLOCK_DESCRIPTIONS[type].toLowerCase();
      return (
        normalizedQuery.length === 0 ||
        label.includes(normalizedQuery) ||
        description.includes(normalizedQuery)
      );
    }),
  })).filter((group) => group.types.length > 0);
  const firstVisibleType = visibleGroups[0]?.types[0];

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger
        render={
          <button
            className="inline-flex h-9 items-center gap-2 rounded-[4px] border border-primary/30 bg-primary/5 px-3 text-xs font-semibold text-primary transition-colors hover:border-primary/60 hover:bg-primary/10 cursor-pointer"
            type="button"
          >
            <Plus className="size-3.5" />
            Add Block
          </button>
        }
      ></DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[30rem] max-h-[76vh] overflow-y-auto border border-zinc-200 bg-white p-2 text-zinc-900 shadow-xl"
        sideOffset={6}
        onKeyDownCapture={(event) => {
          const target = event.target as HTMLElement | null;
          if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
            event.stopPropagation();
          }
        }}
      >
        <div className="sticky top-0 z-10 -mx-2 -mt-2 mb-2 border-b border-zinc-200 bg-white/95 px-2 py-2 backdrop-blur-sm">
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Choose a block type
          </p>
          <Input
            autoFocus
            className="h-8"
            placeholder="Search block types..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter" && firstVisibleType) {
                e.preventDefault();
                onAdd(firstVisibleType);
                setOpen(false);
                setQuery("");
              }
            }}
          />
        </div>
        {visibleGroups.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-200 px-3 py-4 text-xs text-zinc-500">
            No block types match this search.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleGroups.map((group) => (
              <div key={group.group}>
                <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {group.group}
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {group.types.map((type) => (
                    <button
                      className="group flex w-full items-start gap-3 rounded-[8px] border border-zinc-200 bg-white px-2.5 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-primary/5 cursor-pointer"
                      key={type}
                      type="button"
                      onClick={() => {
                        onAdd(type);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <div className="mt-0.5">
                        <BlockWireframe type={type} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 group-hover:text-primary">
                          {BLOCK_LABELS[type]}
                        </p>
                        <p className="line-clamp-2 text-[11px] text-zinc-500 group-hover:text-zinc-700">
                          {BLOCK_DESCRIPTIONS[type]}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const BLOCK_DESCRIPTIONS: Record<BlockType, string> = {
  page_hero:
    "Full-width hero banner with heading, subheading, and background image",
  about_intro: "Introductory section with body text, metrics, and a CTA link",
  mission_vision: "Three-card layout for Mission, Vision, and Method",
  process_steps: "Numbered step-by-step process with heading and description",
  values_list: "Grid of value/principle cards with title and description",
  accreditation:
    "Two-column accreditation block with featured organizations and logo marquee",
  service_cards:
    "Three service offering cards with image, badge, and description",
  training_domains:
    "Auto-populated grid of training categories from the database",
  cta_banner: "Full-width call-to-action banner with button and secondary link",
  richtext: "Free-form rich text area for editorial content",
  hero: "Simple hero block with heading, subheading, image, and CTA",
  cta: "Compact call-to-action with heading, body text, and button",
  listing_config:
    "Configure heading, subheading, and results per page for listing pages",
  accreditation_bar: "Horizontal bar with accreditation badge and client logos",
  home_events_carousel: "Auto-populated horizontal scroll of upcoming events",
  home_posts_grid: "Auto-populated 3-column grid of recent blog posts",
};

const BLOCK_CLIPBOARD_KEY = "kayan.pageEditor.blockClipboard.v1";
const ENABLE_BLOCK_TRANSLATION =
  process.env.NEXT_PUBLIC_ENABLE_BLOCK_TRANSLATION === "1";

// ─── Sortable block wrapper ───────────────────────────────────────────────────

function SortableBlock({
  children,
  id,
  order,
  label,
  health,
  untranslated,
  isDimmed,
  copyLabel,
  translateLabel,
  isSelected,
  onSelect,
  onTranslateToOtherLocale,
  isTranslating,
  onCopyToOtherLocale,
  onRemove,
}: {
  children: React.ReactNode;
  id: string;
  order: number;
  label: string;
  health: "healthy" | "needs-attention";
  untranslated: boolean;
  isDimmed: boolean;
  copyLabel: string;
  translateLabel: string;
  isSelected: boolean;
  onSelect: () => void;
  onTranslateToOtherLocale: () => void;
  isTranslating: boolean;
  onCopyToOtherLocale: () => void;
  onRemove: () => void;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      data-block-id={id}
      style={style}
      className={cn(
        isDragging && "opacity-50 z-50",
        isDimmed && "opacity-45 saturate-50",
      )}
      onClick={onSelect}
    >
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border/70 bg-card transition-all duration-200",
          isSelected && "ring-1 ring-primary/35",
          isDragging && "shadow-2xl ring-1 ring-primary/20",
        )}
      >
        {/* Block header */}
        <div className="group/block-header flex h-12 items-center gap-2 border-b border-border/50 bg-muted/20 px-3 relative transition-all duration-300">
          <Button
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab"
            aria-label="Drag to reorder"
            variant="ghost"
            size="icon"
            {...attributes}
            {...listeners}
          >
            <HugeiconsIcon icon={DragDropVerticalIcon} className="size-4" />
          </Button>
          <span className="shrink-0 font-mono text-sm text-secondary font-semibold">
            {String(order).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {label}
            </span>
          </div>
          {health === "needs-attention" ? (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              Needs work
            </span>
          ) : null}
          {untranslated ? (
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              Missing locale
            </span>
          ) : null}
          <div
            className="flex items-center -right-[52px] group-hover/block-header:right-0 transition-all duration-400 relative"
            style={{ "--radius": "4px" } as React.CSSProperties}
          >
            <Button
              aria-label={collapsed ? "Expand block" : "Collapse block"}
              className="cursor-pointer"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setCollapsed((v) => !v);
              }}
            >
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                className={cn(
                  "size-4 transition-transform duration-150",
                  collapsed && "-rotate-90",
                )}
              />
            </Button>
            <div className="flex items-center group-hover/block-header:opacity-100 opacity-0 transition-all duration-300">
              {ENABLE_BLOCK_TRANSLATION ? (
                <Button
                  aria-label={`Translate ${label} block to ${translateLabel}`}
                  className="cursor-pointer"
                  disabled={isTranslating}
                  title={`Translate to ${translateLabel}`}
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTranslateToOtherLocale();
                  }}
                >
                  {isTranslating ? (
                    <Spinner className="size-3.5" />
                  ) : (
                    <Languages className="size-3.5" />
                  )}
                </Button>
              ) : null}
              <Button
                aria-label={`Copy ${label} block to ${copyLabel}`}
                className="cursor-pointer"
                title={`Copy to ${copyLabel}`}
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyToOtherLocale();
                }}
              >
                <Copy className="size-3.5" />
              </Button>
              <Button
                aria-label={`Remove ${label} block`}
                className="cursor-pointer rounded"
                variant="destructive"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <HugeiconsIcon
                  icon={Delete02Icon}
                  size={14}
                  className="text-destructive"
                />
              </Button>
            </div>
          </div>
        </div>

        {/* Block fields */}
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200",
            collapsed
              ? "grid-rows-[0fr] opacity-0"
              : "grid-rows-[1fr] opacity-100",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="space-y-4 bg-background/40 p-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Block field editors ──────────────────────────────────────────────────────

// ─── Media carousel editor ────────────────────────────────────────────────────

function MediaCarouselEditor({
  media,
  onChange,
}: {
  media: HeroMedia[];
  onChange: (media: HeroMedia[]) => void;
}) {
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browsePage, setBrowsePage] = useState(1);
  const [browseTotalPages, setBrowseTotalPages] = useState(1);
  const [browseItems, setBrowseItems] = useState<
    { id: string; originalName: string; url: string; mimeType: string }[]
  >([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");

  async function openBrowse() {
    setBrowseLoading(true);
    try {
      const result = await fetchMediaPageAction(1, 24);
      setBrowseItems(result.items);
      setBrowsePage(result.page);
      setBrowseTotalPages(result.totalPages);
    } finally {
      setBrowseLoading(false);
    }
    setBrowseOpen(true);
  }

  async function loadBrowsePage(page: number) {
    setBrowseLoading(true);
    try {
      const result = await fetchMediaPageAction(page, 24);
      setBrowseItems(result.items);
      setBrowsePage(result.page);
      setBrowseTotalPages(result.totalPages);
    } finally {
      setBrowseLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadStatus("");
    try {
      const uploadedItems: HeroMedia[] = [];
      for (const [index, file] of files.entries()) {
        const uploaded = await uploadMediaFile(file, {
          onProgress: (percent) =>
            setUploadProgress(
              Math.min(
                100,
                Math.round(((index + percent / 100) / files.length) * 100),
              ),
            ),
          onStatus: (status) =>
            setUploadStatus(
              files.length > 1
                ? `${status} (${index + 1}/${files.length})`
                : status,
            ),
        });
        const kind: "image" | "video" = file.type.startsWith("video/")
          ? "video"
          : "image";
        uploadedItems.push({ id: makeId(), url: uploaded.url, kind });
      }
      onChange([...media, ...uploadedItems]);
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function remove(id: string) {
    onChange(media.filter((m) => m.id !== id));
  }

  function truncateUrlMiddle(url: string, start = 18, end = 10) {
    if (url.length <= start + end + 3) return url;
    return `${url.slice(0, start)}...${url.slice(-end)}`;
  }

  return (
    <>
      <div className="grid gap-2 xl:grid-cols-2">
        {media.length === 0 && (
          <p className="rounded-lg border border-dashed border-border/50 py-4 text-center text-xs text-muted-foreground">
            No media added yet — upload or browse the library below.
          </p>
        )}
        {media.map((item, i) => (
          <div
            className="relative min-h-[120px] overflow-hidden rounded-xl border border-border/60 bg-card/70 shadow-[inset_0_1px_0_hsl(var(--background)/0.7)]"
            key={item.id}
            style={{ "--radius": "4px" } as React.CSSProperties}
          >
            {item.kind === "image" ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                alt="media preview"
                className="absolute inset-0 h-full w-full object-cover"
                src={item.url}
              />
            ) : null}
            <div
              className={cn(
                "absolute inset-0",
                item.kind === "image"
                  ? "bg-linear-to-t from-black/80 via-black/35 to-black/10"
                  : "bg-linear-to-t from-slate-900 via-slate-800 to-slate-700",
              )}
            />
            {item.kind === "video" ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full border border-white/30 bg-white/10 p-3 backdrop-blur-sm">
                  <Video className="size-4 text-white" />
                </div>
              </div>
            ) : null}
            <div className="relative z-10 flex h-full flex-col justify-between group">
              <div className="flex items-center justify-between gap-2 p-3 group-hover:bg-linear-to-l group-hover:from-white group-hover:via-transparent group-hover:to-transparent duration-150 transition-all">
                <span className="font-mono text-sm font-semibold text-white drop-shadow-sm">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Button
                  aria-label="Remove media"
                  variant="destructive"
                  size="icon-sm"
                  title="Remove"
                  onClick={() => remove(item.id)}
                  className="cursor-pointer rounded-[4px] opacity-0 transition-all duration-150 group-hover:opacity-100"
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    size={14}
                    className="text-destructive"
                  />
                </Button>
              </div>
              <div className="space-y-1 p-3">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                    item.kind === "video"
                      ? "border-blue-300/40 bg-blue-400/20 text-blue-100"
                      : "border-white/30 bg-black/25 text-white",
                  )}
                >
                  {item.kind}
                </span>
                <p
                  className="font-mono text-[11px] text-white/85"
                  title={item.url}
                >
                  {truncateUrlMiddle(item.url)}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div
          className="relative min-h-[120px] overflow-hidden rounded-xl border-2 border-dashed border-border/60 bg-card/70 hover:bg-primary/10 hover:border-primary hover:text-primary grid place-items-center"
          style={{ "--radius": "4px" } as React.CSSProperties}
        >
          <button
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/70 bg-card px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            disabled={browseLoading}
            type="button"
            onClick={openBrowse}
          >
            {browseLoading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <ImageIcon className="size-3" />
            )}
            Browse Library
          </button>
          <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border/70 bg-card px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            {uploading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Plus className="size-3" />
            )}
            {uploading ? `Uploading… ${uploadProgress}%` : "Upload"}
            <input
              accept="image/*,video/*"
              className="sr-only"
              disabled={uploading}
              multiple
              type="file"
              onChange={handleUpload}
            />
          </label>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/70 bg-card px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          disabled={browseLoading}
          type="button"
          onClick={openBrowse}
        >
          {browseLoading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <ImageIcon className="size-3" />
          )}
          Browse Library
        </button>
        <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border/70 bg-card px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
          {uploading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Plus className="size-3" />
          )}
          {uploading ? `Uploading… ${uploadProgress}%` : "Upload"}
          <input
            accept="image/*,video/*"
            className="sr-only"
            disabled={uploading}
            multiple
            type="file"
            onChange={handleUpload}
          />
        </label>
      </div>
      <UploadProgress
        isActive={uploading}
        percent={uploadProgress}
        status={uploadStatus}
      />
      <MediaLibraryDialog
        emptyText="No media uploaded yet."
        items={browseItems}
        loading={browseLoading}
        multiple
        open={browseOpen}
        page={browsePage}
        pageLoading={browseLoading}
        totalPages={browseTotalPages}
        title="Media Library"
        onPageChange={loadBrowsePage}
        onConfirm={(selected) => {
          const appended: HeroMedia[] = selected.map((item) => ({
            id: makeId(),
            url: item.url,
            kind: item.mimeType.startsWith("video/") ? "video" : "image",
          }));
          onChange([...media, ...appended]);
        }}
        onOpenChange={setBrowseOpen}
      />
    </>
  );
}

// ─── Overlay + viewport controls ─────────────────────────────────────────────

function OverlayControls({
  backgroundColor,
  fullViewport,
  overlayColor,
  overlayOpacity,
  onChange,
}: {
  backgroundColor: string;
  fullViewport: boolean;
  overlayColor: string;
  overlayOpacity: number;
  onChange: (patch: {
    backgroundColor?: string;
    fullViewport?: boolean;
    overlayColor?: string;
    overlayOpacity?: number;
  }) => void;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/70 p-4 shadow-[inset_0_1px_0_hsl(var(--background)/0.7)] space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Display Options
      </p>
      <div className="flex items-center justify-between">
        <label className="text-sm text-foreground" htmlFor="full-viewport">
          Full viewport height
        </label>
        <Switch
          checked={fullViewport}
          id="full-viewport"
          onCheckedChange={(v) => onChange({ fullViewport: v })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Background color (no media)</label>
          <div className="flex items-center gap-2">
            <input
              className="h-9 w-12 cursor-pointer rounded-md border border-border/70 bg-card p-1"
              title="Background color"
              type="color"
              value={backgroundColor}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
            />
            <span className="font-mono text-xs text-muted-foreground">
              {backgroundColor}
            </span>
          </div>
        </div>
        <div>
          <label className={labelCls}>Overlay color</label>
          <div className="flex items-center gap-2">
            <input
              className="h-9 w-12 cursor-pointer rounded-md border border-border/70 bg-card p-1"
              title="Overlay color"
              type="color"
              value={overlayColor}
              onChange={(e) => onChange({ overlayColor: e.target.value })}
            />
            <span className="font-mono text-xs text-muted-foreground">
              {overlayColor}
            </span>
          </div>
        </div>
        <div>
          <label className={labelCls}>
            Overlay opacity — {overlayOpacity}%
          </label>
          <input
            className="h-9 w-full accent-primary"
            max={100}
            min={0}
            title="Overlay opacity"
            type="range"
            value={overlayOpacity}
            onChange={(e) =>
              onChange({ overlayOpacity: Number(e.target.value) })
            }
          />
        </div>
      </div>
    </div>
  );
}

// ─── Block field editors ──────────────────────────────────────────────────────

function PageHeroFields({
  block,
  dir,
  onChange,
  entities,
}: {
  block: Extract<Block, { type: "page_hero" }>;
  dir: "ltr" | "rtl";
  onChange: (patch: Partial<typeof block>) => void;
  entities: LinkPickerEntities;
}) {
  const moveSlide = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= block.slides.length) return;
    onChange({ slides: arrayMove(block.slides, fromIndex, toIndex) });
  };

  return (
    <div className="space-y-4">
      <BlockSubsection hint="Eyebrow and visual treatment" title="Hero Basics">
        <div className="space-y-4">
          <Field label="Eyebrow">
            <input
              className={cn(inputCls, dir === "rtl" && "text-right")}
              dir={dir}
              placeholder="e.g. Trust & Method"
              value={block.eyebrow}
              onChange={(e) => onChange({ eyebrow: e.target.value })}
            />
          </Field>
          <OverlayControls
            backgroundColor={block.backgroundColor}
            fullViewport={block.fullViewport}
            overlayColor={block.overlayColor}
            overlayOpacity={block.overlayOpacity}
            onChange={onChange}
          />
        </div>
      </BlockSubsection>

      <BlockSubsection
        hint={`${block.media.length} item(s)`}
        title="Background Media"
      >
        <MediaCarouselEditor
          media={block.media}
          onChange={(media) => onChange({ media })}
        />
      </BlockSubsection>

      <BlockSubsection
        defaultOpen={false}
        hint={`${block.slides.length} slide(s)`}
        title="Slides Content"
      >
        <div className="space-y-2">
          {block.slides.map((slide, i) => (
            <ArrayItemRow
              index={i}
              key={slide.id}
              title={slide.heading?.trim() || "Untitled slide"}
              badges={slide.ctaText?.trim() ? ["cta"] : undefined}
              onMoveDown={() => moveSlide(i, i + 1)}
              onMoveUp={() => moveSlide(i, i - 1)}
              onRemove={() => {
                if (block.slides.length <= 1) return;
                onChange({
                  slides: block.slides.filter((_, j) => j !== i),
                });
              }}
            >
              <div className="space-y-2 p-3">
                <FieldRow>
                  <Field label="Heading">
                    <input
                      className={cn(inputCls, dir === "rtl" && "text-right")}
                      dir={dir}
                      placeholder="Page heading"
                      title="Heading"
                      value={slide.heading}
                      onChange={(e) =>
                        onChange({
                          slides: block.slides.map((s, j) =>
                            j === i ? { ...s, heading: e.target.value } : s,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field label="Subheading">
                    <input
                      className={cn(inputCls, dir === "rtl" && "text-right")}
                      dir={dir}
                      placeholder="Supporting text"
                      title="Subheading"
                      value={slide.subheading}
                      onChange={(e) =>
                        onChange({
                          slides: block.slides.map((s, j) =>
                            j === i ? { ...s, subheading: e.target.value } : s,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field label="CTA Text (optional)">
                    <input
                      className={cn(inputCls, dir === "rtl" && "text-right")}
                      dir={dir}
                      placeholder="Learn More"
                      title="CTA Text"
                      value={slide.ctaText ?? ""}
                      onChange={(e) =>
                        onChange({
                          slides: block.slides.map((s, j) =>
                            j === i ? { ...s, ctaText: e.target.value } : s,
                          ),
                        })
                      }
                    />
                  </Field>
                  <div>
                    <label className={labelCls}>CTA URL (optional)</label>
                    <LinkFieldWithMode
                      dir={dir}
                      entities={entities}
                      internalPlaceholder="/en/contact"
                      value={slide.ctaUrl ?? ""}
                      onChange={(ctaUrl) =>
                        onChange({
                          slides: block.slides.map((s, j) =>
                            j === i ? { ...s, ctaUrl } : s,
                          ),
                        })
                      }
                    />
                  </div>
                </FieldRow>
              </div>
            </ArrayItemRow>
          ))}
        </div>
        <AddItemButton
          label="Add slide"
          onClick={() =>
            onChange({
              slides: [
                ...block.slides,
                { id: makeId(), heading: "", subheading: "" },
              ],
            })
          }
        />
      </BlockSubsection>
    </div>
  );
}

function AboutIntroFields({
  block,
  dir,
  onChange,
  entities,
}: {
  block: Extract<Block, { type: "about_intro" }>;
  dir: "ltr" | "rtl";
  onChange: (patch: Partial<typeof block>) => void;
  entities: LinkPickerEntities;
}) {
  const moveMetric = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= block.metrics.length) return;
    onChange({ metrics: arrayMove(block.metrics, fromIndex, toIndex) });
  };

  return (
    <>
      <Field label="Body (Rich Text)">
        <RichTextEditor
          dir={dir}
          key={block.id}
          value={block.body}
          onChange={(html) => onChange({ body: html })}
        />
      </Field>
      <FieldRow>
        <Field label="Metrics Heading">
          <input
            className={cn(inputCls, dir === "rtl" && "text-right")}
            dir={dir}
            title="Metrics Heading"
            value={block.metricsHeading}
            onChange={(e) => onChange({ metricsHeading: e.target.value })}
          />
        </Field>
        <div />
        <Field label="CTA Text">
          <input
            className={cn(inputCls, dir === "rtl" && "text-right")}
            dir={dir}
            placeholder="Explore Services"
            value={block.ctaText}
            onChange={(e) => onChange({ ctaText: e.target.value })}
          />
        </Field>
        <div>
          <label className={labelCls}>CTA URL</label>
          <LinkFieldWithMode
            dir={dir}
            entities={entities}
            internalPlaceholder="/en/services"
            value={block.ctaUrl}
            onChange={(url) => onChange({ ctaUrl: url })}
          />
        </div>
      </FieldRow>
      <div>
        <label className={labelCls}>Metrics</label>
        <div className="grid gap-2 xl:grid-cols-2">
          {block.metrics.map((m, i) => (
            <ArrayItemRow
              index={i}
              key={i}
              title={m.label?.trim() || "Untitled metric"}
              badges={[m.value?.trim() || "no value"]}
              onMoveDown={() => moveMetric(i, i + 1)}
              onMoveUp={() => moveMetric(i, i - 1)}
              onRemove={() =>
                onChange({ metrics: block.metrics.filter((_, j) => j !== i) })
              }
            >
              <div className="space-y-2 p-3">
                <Field label="Metric Label">
                  <input
                    className={cn(inputCls, dir === "rtl" && "text-right")}
                    dir={dir}
                    placeholder="Years of Experience"
                    value={m.label}
                    onChange={(e) =>
                      onChange({
                        metrics: block.metrics.map((x, j) =>
                          j === i ? { ...x, label: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </Field>
                <div className="space-y-1.5">
                  <div className={labelCls}>Metric Value</div>
                  <input
                    className={cn(inputCls, "font-semibold")}
                    placeholder="+9"
                    value={m.value}
                    onChange={(e) =>
                      onChange({
                        metrics: block.metrics.map((x, j) =>
                          j === i ? { ...x, value: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </div>
              </div>
            </ArrayItemRow>
          ))}
        </div>
        <AddItemButton
          label="Add metric"
          onClick={() =>
            onChange({ metrics: [...block.metrics, { label: "", value: "" }] })
          }
        />
      </div>
    </>
  );
}

function MissionVisionFields({
  block,
  dir,
  onChange,
}: {
  block: Extract<Block, { type: "mission_vision" }>;
  dir: "ltr" | "rtl";
  onChange: (patch: Partial<typeof block>) => void;
}) {
  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= block.items.length) return;
    onChange({ items: arrayMove(block.items, fromIndex, toIndex) });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2 xl:grid-cols-2">
        {block.items.map((item, i) => {
          const bodyLength = (item.body ?? "").trim().length;
          return (
            <ArrayItemRow
              index={i}
              key={i}
              title={item.title?.trim() || "Untitled item"}
              badges={[bodyLength > 0 ? `${bodyLength} chars` : "empty body"]}
              onMoveDown={() => moveItem(i, i + 1)}
              onMoveUp={() => moveItem(i, i - 1)}
              onRemove={() => {
                if (block.items.length <= 1) return;
                onChange({ items: block.items.filter((_, j) => j !== i) });
              }}
            >
              <div className="p-3 space-y-2">
                <Field label="Title">
                  <input
                    className={cn(inputCls, dir === "rtl" && "text-right")}
                    dir={dir}
                    title="Title"
                    value={item.title}
                    onChange={(e) =>
                      onChange({
                        items: block.items.map((x, j) =>
                          j === i ? { ...x, title: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Body">
                  <Textarea
                    className={cn(
                      "min-h-24 w-full rounded-lg border border-input/80 px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                      dir === "rtl" && "text-right",
                    )}
                    dir={dir}
                    title="Body"
                    value={item.body}
                    onChange={(e) =>
                      onChange({
                        items: block.items.map((x, j) =>
                          j === i ? { ...x, body: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </Field>
              </div>
            </ArrayItemRow>
          );
        })}
      </div>
      <AddItemButton
        label="Add item"
        onClick={() =>
          onChange({ items: [...block.items, { title: "", body: "" }] })
        }
      />
    </div>
  );
}

function ProcessStepsFields({
  block,
  dir,
  onChange,
}: {
  block: Extract<Block, { type: "process_steps" }>;
  dir: "ltr" | "rtl";
  onChange: (patch: Partial<typeof block>) => void;
}) {
  const mediaSelection =
    block.mediaUrl && block.mediaUrl.trim().length > 0
      ? [
          {
            id: "process-steps-media",
            url: block.mediaUrl,
            kind: (block.mediaKind ?? "image") as "image" | "video",
          },
        ]
      : [];
  return (
    <>
      <FieldRow>
        <Field label="Heading">
          <input
            className={cn(inputCls, dir === "rtl" && "text-right")}
            dir={dir}
            title="Heading"
            value={block.heading}
            onChange={(e) => onChange({ heading: e.target.value })}
          />
        </Field>
        <Field label="Body">
          <input
            className={cn(inputCls, dir === "rtl" && "text-right")}
            dir={dir}
            title="Body"
            value={block.body}
            onChange={(e) => onChange({ body: e.target.value })}
          />
        </Field>
      </FieldRow>
      <FieldRow>
        <Field label="Media Size">
          <RadioGroup
            className="grid w-full grid-cols-3 gap-0 rounded-md shadow-xs"
            value={block.mediaSize ?? "md"}
            onValueChange={(value) =>
              onChange({ mediaSize: value as "sm" | "md" | "lg" })
            }
          >
            <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-center border p-2.5 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
              <RadioGroupItem
                className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
                id="process-steps-media-size-sm"
                value="sm"
                aria-label="Small media"
              />
              <Label
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs"
                htmlFor="process-steps-media-size-sm"
              >
                <HugeiconsIcon icon={Image01Icon} className="size-3" />
                Small
              </Label>
            </div>
            <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-center border p-2.5 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
              <RadioGroupItem
                className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
                id="process-steps-media-size-md"
                value="md"
                aria-label="Medium media"
              />
              <Label
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs"
                htmlFor="process-steps-media-size-md"
              >
                <HugeiconsIcon icon={Image01Icon} className="size-3.5" />
                Medium
              </Label>
            </div>
            <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-center border p-2.5 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
              <RadioGroupItem
                className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
                id="process-steps-media-size-lg"
                value="lg"
                aria-label="Large media"
              />
              <Label
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs"
                htmlFor="process-steps-media-size-lg"
              >
                <HugeiconsIcon icon={Image01Icon} className="size-4" />
                Large
              </Label>
            </div>
          </RadioGroup>
        </Field>
        <div></div>
        <div></div>
        <div></div>
      </FieldRow>
      <div>
        <label className={labelCls}>Media (optional)</label>
        <MediaCarouselEditor
          media={mediaSelection}
          onChange={(media) => {
            const first = media[0];
            onChange({
              mediaUrl: first?.url ?? "",
              mediaKind: (first?.kind ?? "image") as "image" | "video",
            });
          }}
        />
      </div>
      <div>
        <label className={labelCls}>Steps</label>
        <div className="grid gap-2 xl:grid-cols-2">
          {block.steps.map((step, i) => (
            <ArrayItemRow
              index={i}
              key={i}
              title={step.title?.trim() || "Untitled step"}
              onMoveDown={() => {
                const next = i + 1;
                if (next >= block.steps.length) return;
                onChange({ steps: arrayMove(block.steps, i, next) });
              }}
              onMoveUp={() => {
                const next = i - 1;
                if (next < 0) return;
                onChange({ steps: arrayMove(block.steps, i, next) });
              }}
              onRemove={() =>
                onChange({ steps: block.steps.filter((_, j) => j !== i) })
              }
            >
              <div className="space-y-2 p-3">
                <Field label="Step Title">
                  <input
                    className={cn(inputCls, dir === "rtl" && "text-right")}
                    dir={dir}
                    placeholder="Step title"
                    value={step.title}
                    onChange={(e) =>
                      onChange({
                        steps: block.steps.map((x, j) =>
                          j === i ? { ...x, title: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Step Description">
                  <input
                    className={cn(inputCls, dir === "rtl" && "text-right")}
                    dir={dir}
                    placeholder="Short description"
                    value={step.desc}
                    onChange={(e) =>
                      onChange({
                        steps: block.steps.map((x, j) =>
                          j === i ? { ...x, desc: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </Field>
              </div>
            </ArrayItemRow>
          ))}
        </div>
        <AddItemButton
          label="Add step"
          onClick={() =>
            onChange({ steps: [...block.steps, { title: "", desc: "" }] })
          }
        />
      </div>
    </>
  );
}

function ValuesListFields({
  block,
  dir,
  onChange,
}: {
  block: Extract<Block, { type: "values_list" }>;
  dir: "ltr" | "rtl";
  onChange: (patch: Partial<typeof block>) => void;
}) {
  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= block.items.length) return;
    onChange({ items: arrayMove(block.items, fromIndex, toIndex) });
  };

  return (
    <>
      <FieldRow>
        <Field label="Eyebrow">
          <input
            className={cn(inputCls, dir === "rtl" && "text-right")}
            dir={dir}
            title="Eyebrow"
            value={block.eyebrow}
            onChange={(e) => onChange({ eyebrow: e.target.value })}
          />
        </Field>
        <Field label="Heading">
          <input
            className={cn(inputCls, dir === "rtl" && "text-right")}
            dir={dir}
            title="Heading"
            value={block.heading}
            onChange={(e) => onChange({ heading: e.target.value })}
          />
        </Field>
      </FieldRow>
      <div>
        <label className={labelCls}>Values</label>
        <div className="grid gap-2 xl:grid-cols-2">
          {block.items.map((item, i) => (
            <ArrayItemRow
              index={i}
              key={i}
              title={item.title?.trim() || "Untitled value"}
              onMoveDown={() => moveItem(i, i + 1)}
              onMoveUp={() => moveItem(i, i - 1)}
              onRemove={() =>
                onChange({ items: block.items.filter((_, j) => j !== i) })
              }
            >
              <div className="space-y-2 p-3">
                <Field label="Value Title">
                  <input
                    className={cn(inputCls, dir === "rtl" && "text-right")}
                    dir={dir}
                    placeholder="Value title"
                    value={item.title}
                    onChange={(e) =>
                      onChange({
                        items: block.items.map((x, j) =>
                          j === i ? { ...x, title: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Value Description">
                  <input
                    className={cn(inputCls, dir === "rtl" && "text-right")}
                    dir={dir}
                    placeholder="Description"
                    value={item.desc}
                    onChange={(e) =>
                      onChange({
                        items: block.items.map((x, j) =>
                          j === i ? { ...x, desc: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </Field>
              </div>
            </ArrayItemRow>
          ))}
        </div>
        <AddItemButton
          label="Add value"
          onClick={() =>
            onChange({ items: [...block.items, { title: "", desc: "" }] })
          }
        />
      </div>
    </>
  );
}

function AccreditationFields({
  block,
  dir,
  onChange,
}: {
  block: Extract<Block, { type: "accreditation" }>;
  dir: "ltr" | "rtl";
  onChange: (patch: Partial<typeof block>) => void;
}) {
  const moveFeaturedOrg = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= block.featuredOrgs.length) return;
    onChange({
      featuredOrgs: arrayMove(block.featuredOrgs, fromIndex, toIndex),
    });
  };

  const moveLogo = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= block.logos.length) return;
    onChange({ logos: arrayMove(block.logos, fromIndex, toIndex) });
  };

  return (
    <div className="space-y-4">
      <BlockSubsection
        hint={`${block.featuredOrgs.length} organization(s)`}
        title="Featured Organizations"
      >
        <div className="space-y-4">
          <FieldRow>
            <Field label="Heading">
              <Input
                className={cn(inputCls, dir === "rtl" && "text-right")}
                dir={dir}
                title="Heading"
                value={block.heading}
                onChange={(e) => onChange({ heading: e.target.value })}
              />
            </Field>
            <Field label="Description">
              <Input
                className={cn(inputCls, dir === "rtl" && "text-right")}
                dir={dir}
                title="Description"
                value={block.description}
                onChange={(e) => onChange({ description: e.target.value })}
              />
            </Field>
          </FieldRow>
          <div className="grid gap-2 xl:grid-cols-2">
            {block.featuredOrgs.map((org, i) => (
              <ArrayItemRow
                index={i}
                key={i}
                title={org.name?.trim() || "Untitled organization"}
                badges={[
                  displayModeLabel(org.displayMode),
                  logoSizeLabel(org.size),
                ]}
                onDuplicate={() =>
                  onChange({
                    featuredOrgs: [
                      ...block.featuredOrgs.slice(0, i + 1),
                      { ...org },
                      ...block.featuredOrgs.slice(i + 1),
                    ],
                  })
                }
                onMoveDown={() => moveFeaturedOrg(i, i + 1)}
                onMoveUp={() => moveFeaturedOrg(i, i - 1)}
                onRemove={() =>
                  onChange({
                    featuredOrgs: block.featuredOrgs.filter((_, j) => j !== i),
                  })
                }
              >
                <div className="space-y-2 grid grid-cols-2 gap-2 p-3">
                  <div className="space-y-2">
                    <Input
                      className={inputCls}
                      placeholder="Organization name"
                      value={org.name}
                      onChange={(e) =>
                        onChange({
                          featuredOrgs: block.featuredOrgs.map((x, j) =>
                            j === i ? { ...x, name: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <Input
                      className={cn(inputCls, dir === "rtl" && "text-right")}
                      dir={dir}
                      placeholder="Short text"
                      value={org.summary}
                      onChange={(e) =>
                        onChange({
                          featuredOrgs: block.featuredOrgs.map((x, j) =>
                            j === i ? { ...x, summary: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <div className="space-y-1.5">
                      <div className={labelCls}>Display Options</div>
                      <RadioGroup
                        className="grid w-full grid-cols-2 gap-0 shadow-xs"
                        value={org.displayMode ?? "original"}
                        onValueChange={(value) =>
                          onChange({
                            featuredOrgs: block.featuredOrgs.map((x, j) =>
                              j === i
                                ? {
                                    ...x,
                                    displayMode: value as "original" | "mono",
                                  }
                                : x,
                            ),
                          })
                        }
                      >
                        <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-between border p-2.5 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
                          <RadioGroupItem
                            className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
                            id={`featured-org-${i}-display-original`}
                            value="original"
                            aria-label="Original colors"
                          />
                          <Label
                            className="inline-flex cursor-pointer items-center gap-1.5 text-xs"
                            htmlFor={`featured-org-${i}-display-original`}
                          >
                            <HugeiconsIcon
                              icon={PaintBoardIcon}
                              className="size-3.5"
                            />
                            Original
                          </Label>
                        </div>
                        <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-between border p-2.5 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
                          <RadioGroupItem
                            className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
                            id={`featured-org-${i}-display-mono`}
                            value="mono"
                            aria-label="Mono"
                          />
                          <Label
                            className="inline-flex cursor-pointer items-center gap-1.5 text-xs"
                            htmlFor={`featured-org-${i}-display-mono`}
                          >
                            <HugeiconsIcon
                              icon={BrushIcon}
                              className="size-3.5"
                            />
                            Mono
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-1.5">
                      <RadioGroup
                        className="grid w-full grid-cols-3 gap-0 rounded-md shadow-xs"
                        value={org.size ?? "md"}
                        onValueChange={(value) =>
                          onChange({
                            featuredOrgs: block.featuredOrgs.map((x, j) =>
                              j === i
                                ? { ...x, size: value as "sm" | "md" | "lg" }
                                : x,
                            ),
                          })
                        }
                      >
                        <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-center border p-2.5 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
                          <RadioGroupItem
                            className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
                            id={`featured-org-${i}-size-sm`}
                            value="sm"
                            aria-label="Small logo"
                          />
                          <Label
                            className="inline-flex cursor-pointer items-center gap-1.5 text-xs"
                            htmlFor={`featured-org-${i}-size-sm`}
                          >
                            <HugeiconsIcon
                              icon={Image01Icon}
                              className="size-3"
                            />
                            Small
                          </Label>
                        </div>
                        <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-center border p-2.5 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
                          <RadioGroupItem
                            className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
                            id={`featured-org-${i}-size-md`}
                            value="md"
                            aria-label="Medium logo"
                          />
                          <Label
                            className="inline-flex cursor-pointer items-center gap-1.5 text-xs"
                            htmlFor={`featured-org-${i}-size-md`}
                          >
                            <HugeiconsIcon
                              icon={Image01Icon}
                              className="size-3.5"
                            />
                            Medium
                          </Label>
                        </div>
                        <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-center border p-2.5 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
                          <RadioGroupItem
                            className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
                            id={`featured-org-${i}-size-lg`}
                            value="lg"
                            aria-label="Large logo"
                          />
                          <Label
                            className="inline-flex cursor-pointer items-center gap-1.5 text-xs"
                            htmlFor={`featured-org-${i}-size-lg`}
                          >
                            <HugeiconsIcon
                              icon={Image01Icon}
                              className="size-4"
                            />
                            Large
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  <div>
                    {/* <label className={labelCls}>Logo</label> */}
                    <ImagePickerField
                      fetchMedia={fetchMediaAction}
                      previewFit="contain"
                      value={org.logo ?? ""}
                      onChange={(url) =>
                        onChange({
                          featuredOrgs: block.featuredOrgs.map((x, j) =>
                            j === i ? { ...x, logo: url } : x,
                          ),
                        })
                      }
                    />
                  </div>
                </div>
              </ArrayItemRow>
            ))}
          </div>
          <AddItemButton
            label="Add featured organization"
            onClick={() =>
              onChange({
                featuredOrgs: [
                  ...block.featuredOrgs,
                  {
                    name: "",
                    summary: "",
                    logo: "",
                    displayMode: "original",
                    size: "md",
                  },
                ],
              })
            }
          />
        </div>
      </BlockSubsection>

      <BlockSubsection
        defaultOpen={false}
        hint={`${block.logos.length} logo(s)`}
        title="Logos Marquee"
      >
        <div className="space-y-4">
          <FieldRow>
            <Field label="Logos Heading">
              <Input
                className={cn(inputCls, dir === "rtl" && "text-right")}
                dir={dir}
                title="Logos Heading"
                value={block.logosHeading}
                onChange={(e) => onChange({ logosHeading: e.target.value })}
              />
            </Field>
            <Field label="Logos Description">
              <Input
                className={cn(inputCls, dir === "rtl" && "text-right")}
                dir={dir}
                title="Logos Description"
                value={block.logosDescription}
                onChange={(e) => onChange({ logosDescription: e.target.value })}
              />
            </Field>
          </FieldRow>
          <div className="grid gap-2 xl:grid-cols-2">
            {block.logos.map((p, i) => (
              <ArrayItemRow
                index={i}
                key={i}
                title={p.name?.trim() || "Untitled logo"}
                badges={[
                  displayModeLabel(p.displayMode),
                  logoSizeLabel(p.size),
                ]}
                onDuplicate={() =>
                  onChange({
                    logos: [
                      ...block.logos.slice(0, i + 1),
                      { ...p },
                      ...block.logos.slice(i + 1),
                    ],
                  })
                }
                onMoveDown={() => moveLogo(i, i + 1)}
                onMoveUp={() => moveLogo(i, i - 1)}
                onRemove={() =>
                  onChange({ logos: block.logos.filter((_, j) => j !== i) })
                }
              >
                <div className="space-y-2 grid grid-cols-2 gap-2 p-3">
                  <div className="space-y-2">
                    <Input
                      className={inputCls}
                      placeholder="Logo name"
                      value={p.name}
                      onChange={(e) =>
                        onChange({
                          logos: block.logos.map((x, j) =>
                            j === i ? { ...x, name: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <div className="space-y-1.5">
                      <div className={labelCls}>Display Options</div>
                      <RadioGroup
                        className="grid w-full grid-cols-2 gap-0 shadow-xs"
                        value={p.displayMode ?? "original"}
                        onValueChange={(value) =>
                          onChange({
                            logos: block.logos.map((x, j) =>
                              j === i
                                ? {
                                    ...x,
                                    displayMode: value as "original" | "mono",
                                  }
                                : x,
                            ),
                          })
                        }
                      >
                        <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-between border p-2.5 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
                          <RadioGroupItem
                            className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
                            id={`logo-${i}-display-original`}
                            value="original"
                            aria-label="Original colors"
                          />
                          <Label
                            className="inline-flex cursor-pointer items-center gap-1.5 text-xs"
                            htmlFor={`logo-${i}-display-original`}
                          >
                            <HugeiconsIcon
                              icon={PaintBoardIcon}
                              className="size-3.5"
                            />
                            Original
                          </Label>
                        </div>
                        <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-between border p-2.5 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
                          <RadioGroupItem
                            className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
                            id={`logo-${i}-display-mono`}
                            value="mono"
                            aria-label="Mono"
                          />
                          <Label
                            className="inline-flex cursor-pointer items-center gap-1.5 text-xs"
                            htmlFor={`logo-${i}-display-mono`}
                          >
                            <HugeiconsIcon
                              icon={BrushIcon}
                              className="size-3.5"
                            />
                            Mono
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-1.5">
                      <RadioGroup
                        className="grid w-full grid-cols-3 gap-0 rounded-md shadow-xs"
                        value={p.size ?? "md"}
                        onValueChange={(value) =>
                          onChange({
                            logos: block.logos.map((x, j) =>
                              j === i
                                ? { ...x, size: value as "sm" | "md" | "lg" }
                                : x,
                            ),
                          })
                        }
                      >
                        <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-center border p-2.5 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
                          <RadioGroupItem
                            className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
                            id={`logo-${i}-size-sm`}
                            value="sm"
                            aria-label="Small logo"
                          />
                          <Label
                            className="inline-flex cursor-pointer items-center gap-1.5 text-xs"
                            htmlFor={`logo-${i}-size-sm`}
                          >
                            <HugeiconsIcon
                              icon={Image01Icon}
                              className="size-3"
                            />
                            Small
                          </Label>
                        </div>
                        <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-center border p-2.5 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
                          <RadioGroupItem
                            className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
                            id={`logo-${i}-size-md`}
                            value="md"
                            aria-label="Medium logo"
                          />
                          <Label
                            className="inline-flex cursor-pointer items-center gap-1.5 text-xs"
                            htmlFor={`logo-${i}-size-md`}
                          >
                            <HugeiconsIcon
                              icon={Image01Icon}
                              className="size-3.5"
                            />
                            Medium
                          </Label>
                        </div>
                        <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-center border p-2.5 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
                          <RadioGroupItem
                            className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
                            id={`logo-${i}-size-lg`}
                            value="lg"
                            aria-label="Large logo"
                          />
                          <Label
                            className="inline-flex cursor-pointer items-center gap-1.5 text-xs"
                            htmlFor={`logo-${i}-size-lg`}
                          >
                            <HugeiconsIcon
                              icon={Image01Icon}
                              className="size-4"
                            />
                            Large
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  <div>
                    <ImagePickerField
                      fetchMedia={fetchMediaAction}
                      previewFit="contain"
                      value={p.logo ?? ""}
                      onChange={(url) =>
                        onChange({
                          logos: block.logos.map((x, j) =>
                            j === i ? { ...x, logo: url } : x,
                          ),
                        })
                      }
                    />
                  </div>
                </div>
              </ArrayItemRow>
            ))}
          </div>
          <AddItemButton
            label="Add logo"
            onClick={() =>
              onChange({
                logos: [
                  ...block.logos,
                  { name: "", logo: "", displayMode: "mono", size: "md" },
                ],
              })
            }
          />
        </div>
      </BlockSubsection>
    </div>
  );
}

function ServiceCardsFields({
  block,
  dir,
  onChange,
}: {
  block: Extract<Block, { type: "service_cards" }>;
  dir: "ltr" | "rtl";
  onChange: (patch: Partial<typeof block>) => void;
}) {
  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= block.items.length) return;
    onChange({ items: arrayMove(block.items, fromIndex, toIndex) });
  };

  return (
    <div className="space-y-4">
      <BlockSubsection
        hint={`${block.items.length} card(s)`}
        title="Service Cards Content"
      >
        <div className="space-y-3">
          {block.items.map((item, i) => (
            <ArrayItemRow
              index={i}
              key={i}
              title={item.title?.trim() || "Untitled service card"}
              onDuplicate={() =>
                onChange({
                  items: [
                    ...block.items.slice(0, i + 1),
                    { ...item },
                    ...block.items.slice(i + 1),
                  ],
                })
              }
              onMoveDown={() => moveItem(i, i + 1)}
              onMoveUp={() => moveItem(i, i - 1)}
              onRemove={() =>
                onChange({ items: block.items.filter((_, j) => j !== i) })
              }
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Card Badge">
                  <input
                    className={cn(inputCls, dir === "rtl" && "text-right")}
                    dir={dir}
                    placeholder="e.g. Corporate Track"
                    value={item.badge}
                    onChange={(e) =>
                      onChange({
                        items: block.items.map((x, j) =>
                          j === i ? { ...x, badge: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Card Title">
                  <input
                    className={cn(inputCls, dir === "rtl" && "text-right")}
                    dir={dir}
                    placeholder="e.g. Executive Training"
                    value={item.title}
                    onChange={(e) =>
                      onChange({
                        items: block.items.map((x, j) =>
                          j === i ? { ...x, title: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Card Description">
                    <input
                      className={cn(inputCls, dir === "rtl" && "text-right")}
                      dir={dir}
                      placeholder="Short supporting copy for this card"
                      value={item.desc}
                      onChange={(e) =>
                        onChange({
                          items: block.items.map((x, j) =>
                            j === i ? { ...x, desc: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Card Image</label>
                  <ImagePickerField
                    fetchMedia={fetchMediaAction}
                    value={item.image}
                    onChange={(url) =>
                      onChange({
                        items: block.items.map((x, j) =>
                          j === i ? { ...x, image: url } : x,
                        ),
                      })
                    }
                  />
                </div>
              </div>
            </ArrayItemRow>
          ))}
          <AddItemButton
            label="Add service card"
            onClick={() =>
              onChange({
                items: [
                  ...block.items,
                  { badge: "", title: "", desc: "", image: "" },
                ],
              })
            }
          />
        </div>
      </BlockSubsection>
    </div>
  );
}

function TrainingDomainsFields({
  block,
  dir,
  onChange,
}: {
  block: Extract<Block, { type: "training_domains" }>;
  dir: "ltr" | "rtl";
  onChange: (patch: Partial<typeof block>) => void;
}) {
  return (
    <div className="space-y-4">
      <BlockSubsection hint="Section headline and copy" title="Domain Section">
        <FieldRow>
          <Field label="Section Eyebrow">
            <input
              className={cn(inputCls, dir === "rtl" && "text-right")}
              dir={dir}
              title="Eyebrow"
              value={block.eyebrow}
              onChange={(e) => onChange({ eyebrow: e.target.value })}
            />
          </Field>
          <Field label="Section Heading">
            <input
              className={cn(inputCls, dir === "rtl" && "text-right")}
              dir={dir}
              title="Heading"
              value={block.heading}
              onChange={(e) => onChange({ heading: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Section Description">
              <input
                className={cn(inputCls, dir === "rtl" && "text-right")}
                dir={dir}
                title="Description"
                value={block.description}
                onChange={(e) => onChange({ description: e.target.value })}
              />
            </Field>
          </div>
        </FieldRow>
      </BlockSubsection>

      <BlockSubsection
        defaultOpen={false}
        hint="Typography controls"
        title="Description Display"
      >
        <FieldRow>
          <Field label="Description Size Preset">
            <select
              className={inputCls}
              value={block.descriptionSize}
              onChange={(e) =>
                onChange({
                  descriptionSize: e.target.value as
                    | "sm"
                    | "md"
                    | "lg"
                    | "xl"
                    | "custom",
                })
              }
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">Extra Large</option>
              <option value="custom">Custom (px)</option>
            </select>
          </Field>
          {block.descriptionSize === "custom" ? (
            <Field label="Custom Size (px)">
              <div className="space-y-2">
                <input
                  className="w-full accent-primary"
                  max={40}
                  min={12}
                  step={1}
                  type="range"
                  value={block.customDescriptionSize}
                  onChange={(e) =>
                    onChange({
                      customDescriptionSize: Number(e.target.value) || 16,
                    })
                  }
                />
                <NumberStepper
                  max={40}
                  min={12}
                  presets={[14, 16, 18, 20, 24]}
                  step={1}
                  value={block.customDescriptionSize}
                  onChange={(next) =>
                    onChange({
                      customDescriptionSize: next,
                    })
                  }
                />
              </div>
            </Field>
          ) : (
            <div />
          )}
        </FieldRow>
        <p className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
          Domain cards are auto-populated from Categories. This block controls
          display only.
        </p>
      </BlockSubsection>
    </div>
  );
}

function CtaBannerFields({
  block,
  dir,
  onChange,
  entities,
}: {
  block: Extract<Block, { type: "cta_banner" }>;
  dir: "ltr" | "rtl";
  onChange: (patch: Partial<typeof block>) => void;
  entities: LinkPickerEntities;
}) {
  return (
    <div className="space-y-4">
      <BlockSubsection hint="Primary message content" title="Banner Content">
        <FieldRow>
          <Field label="Eyebrow">
            <input
              className={cn(inputCls, dir === "rtl" && "text-right")}
              dir={dir}
              title="Eyebrow"
              value={block.eyebrow}
              onChange={(e) => onChange({ eyebrow: e.target.value })}
            />
          </Field>
          <Field label="Heading">
            <input
              className={cn(inputCls, dir === "rtl" && "text-right")}
              dir={dir}
              title="Heading"
              value={block.heading}
              onChange={(e) => onChange({ heading: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Supporting Body Copy">
              <input
                className={cn(inputCls, dir === "rtl" && "text-right")}
                dir={dir}
                title="Body"
                value={block.body}
                onChange={(e) => onChange({ body: e.target.value })}
              />
            </Field>
          </div>
        </FieldRow>
      </BlockSubsection>

      <BlockSubsection
        defaultOpen={false}
        hint="Primary and secondary links"
        title="Calls To Action"
      >
        <FieldRow>
          <Field label="Primary Button Text">
            <input
              className={cn(inputCls, dir === "rtl" && "text-right")}
              dir={dir}
              title="Button Text"
              value={block.buttonText}
              onChange={(e) => onChange({ buttonText: e.target.value })}
            />
          </Field>
          <div>
            <label className={labelCls}>Primary Button URL</label>
            <LinkFieldWithMode
              dir={dir}
              entities={entities}
              internalPlaceholder="/en/contact"
              value={block.buttonUrl}
              onChange={(url) => onChange({ buttonUrl: url })}
            />
          </div>
          <Field label="Secondary Link Text">
            <input
              className={cn(inputCls, dir === "rtl" && "text-right")}
              dir={dir}
              title="Link Text"
              value={block.linkText}
              onChange={(e) => onChange({ linkText: e.target.value })}
            />
          </Field>
          <div>
            <label className={labelCls}>Secondary Link URL</label>
            <LinkFieldWithMode
              dir={dir}
              entities={entities}
              internalPlaceholder="/en/services"
              value={block.linkUrl}
              onChange={(url) => onChange({ linkUrl: url })}
            />
          </div>
        </FieldRow>
      </BlockSubsection>
    </div>
  );
}

function RichTextFields({
  block,
  dir,
  onChange,
}: {
  block: Extract<Block, { type: "richtext" }>;
  dir: "ltr" | "rtl";
  onChange: (patch: Partial<typeof block>) => void;
}) {
  return (
    <div className="space-y-4">
      <BlockSubsection
        hint="Long-form editorial content"
        title="Rich Text Content"
      >
        <RichTextEditor
          dir={dir}
          key={block.id}
          value={block.html}
          onChange={(html) => onChange({ html })}
        />
      </BlockSubsection>
    </div>
  );
}

function HeroBlockFields({
  block,
  dir,
  onChange,
  entities,
}: {
  block: Extract<Block, { type: "hero" }>;
  dir: "ltr" | "rtl";
  onChange: (patch: Partial<typeof block>) => void;
  entities: LinkPickerEntities;
}) {
  const moveSlide = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= block.slides.length) return;
    onChange({ slides: arrayMove(block.slides, fromIndex, toIndex) });
  };

  return (
    <div className="space-y-4">
      <BlockSubsection hint="Hero viewport and overlays" title="Hero Display">
        <OverlayControls
          backgroundColor={block.backgroundColor}
          fullViewport={block.fullViewport}
          overlayColor={block.overlayColor}
          overlayOpacity={block.overlayOpacity}
          onChange={onChange}
        />
      </BlockSubsection>

      <BlockSubsection
        hint={`${block.media.length} media item(s)`}
        title="Hero Media"
      >
        <MediaCarouselEditor
          media={block.media}
          onChange={(media) => onChange({ media })}
        />
      </BlockSubsection>

      <BlockSubsection
        defaultOpen={false}
        hint={`${block.slides.length} slide(s)`}
        title="Slides & CTAs"
      >
        <div className="space-y-2">
          {block.slides.map((slide, i) => (
            <ArrayItemRow
              index={i}
              key={slide.id}
              title={slide.heading?.trim() || "Untitled slide"}
              badges={
                (slide.ctas ?? []).length
                  ? [`${(slide.ctas ?? []).length} cta`]
                  : undefined
              }
              onMoveDown={() => moveSlide(i, i + 1)}
              onMoveUp={() => moveSlide(i, i - 1)}
              onRemove={() => {
                if (block.slides.length <= 1) return;
                onChange({
                  slides: block.slides.filter((_, j) => j !== i),
                });
              }}
            >
              <div className="space-y-2 p-3">
                <FieldRow>
                  <Field label="Eyebrow">
                    <input
                      className={cn(inputCls, dir === "rtl" && "text-right")}
                      dir={dir}
                      placeholder="Small heading above the hero title"
                      title="Slide eyebrow"
                      value={slide.eyebrow ?? ""}
                      onChange={(e) =>
                        onChange({
                          slides: block.slides.map((s, j) =>
                            j === i ? { ...s, eyebrow: e.target.value } : s,
                          ),
                        })
                      }
                    />
                  </Field>
                </FieldRow>

                <FieldRow>
                  <Field label="Heading">
                    <input
                      className={cn(inputCls, dir === "rtl" && "text-right")}
                      dir={dir}
                      placeholder="Heading"
                      title="Heading"
                      value={slide.heading}
                      onChange={(e) =>
                        onChange({
                          slides: block.slides.map((s, j) =>
                            j === i ? { ...s, heading: e.target.value } : s,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field label="Subheading">
                    <input
                      className={cn(inputCls, dir === "rtl" && "text-right")}
                      dir={dir}
                      placeholder="Subheading"
                      title="Subheading"
                      value={slide.subheading}
                      onChange={(e) =>
                        onChange({
                          slides: block.slides.map((s, j) =>
                            j === i ? { ...s, subheading: e.target.value } : s,
                          ),
                        })
                      }
                    />
                  </Field>
                </FieldRow>
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/70 p-4 shadow-[inset_0_1px_0_hsl(var(--background)/0.7)]">
                  <Switch
                    checked={!!slide.showCategoryIcons}
                    id={`showCategoryIcons-${slide.id}`}
                    onCheckedChange={(v) =>
                      onChange({
                        slides: block.slides.map((s, j) =>
                          j === i ? { ...s, showCategoryIcons: v } : s,
                        ),
                      })
                    }
                  />
                  <label
                    className="cursor-pointer text-sm"
                    htmlFor={`showCategoryIcons-${slide.id}`}
                  >
                    Show category icon set on this slide
                  </label>
                </div>

                <div className="mt-2 space-y-2">
                  <span className={labelCls}>CTAs</span>
                  <div className="grid gap-2 lg:grid-cols-2">
                    {(slide.ctas ?? []).map((cta, ci) => (
                      <div
                        className="flex items-start gap-2 rounded-md border border-border/40 bg-background/50 p-2"
                        key={cta.id}
                      >
                        <div className="flex-1 space-y-1.5">
                          <input
                            className={cn(
                              inputCls,
                              dir === "rtl" && "text-right",
                            )}
                            dir={dir}
                            placeholder="Button label"
                            value={cta.text}
                            onChange={(e) =>
                              onChange({
                                slides: block.slides.map((s, j) =>
                                  j === i
                                    ? {
                                        ...s,
                                        ctas: s.ctas.map((c, k) =>
                                          k === ci
                                            ? { ...c, text: e.target.value }
                                            : c,
                                        ),
                                      }
                                    : s,
                                ),
                              })
                            }
                          />
                          <LinkFieldWithMode
                            dir={dir}
                            entities={entities}
                            internalPlaceholder="/en/contact"
                            value={cta.url}
                            onChange={(url) =>
                              onChange({
                                slides: block.slides.map((s, j) =>
                                  j === i
                                    ? {
                                        ...s,
                                        ctas: s.ctas.map((c, k) =>
                                          k === ci ? { ...c, url } : c,
                                        ),
                                      }
                                    : s,
                                ),
                              })
                            }
                          />
                        </div>
                        <div className="flex w-[178px] shrink-0 flex-col gap-2">
                          <div className="rounded-md border border-border/60 bg-muted/30 p-1">
                            <div className="grid grid-cols-2 gap-1">
                              <button
                                className={cn(
                                  "rounded px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                                  cta.style === "primary"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-background",
                                )}
                                title="Primary style"
                                type="button"
                                onClick={() =>
                                  onChange({
                                    slides: block.slides.map((s, j) =>
                                      j === i
                                        ? {
                                            ...s,
                                            ctas: s.ctas.map((c, k) =>
                                              k === ci
                                                ? {
                                                    ...c,
                                                    style: "primary" as const,
                                                  }
                                                : c,
                                            ),
                                          }
                                        : s,
                                    ),
                                  })
                                }
                              >
                                Primary
                              </button>
                              <button
                                className={cn(
                                  "rounded px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                                  cta.style === "secondary"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-background",
                                )}
                                title="Secondary style"
                                type="button"
                                onClick={() =>
                                  onChange({
                                    slides: block.slides.map((s, j) =>
                                      j === i
                                        ? {
                                            ...s,
                                            ctas: s.ctas.map((c, k) =>
                                              k === ci
                                                ? {
                                                    ...c,
                                                    style: "secondary" as const,
                                                  }
                                                : c,
                                            ),
                                          }
                                        : s,
                                    ),
                                  })
                                }
                              >
                                Secondary
                              </button>
                            </div>
                          </div>
                          <div className="rounded-md border border-border/50 bg-background px-2 py-1.5 text-[10px] text-muted-foreground">
                            Preview:{" "}
                            <span
                              className={cn(
                                "inline-flex items-center rounded px-1.5 py-0.5 font-semibold uppercase tracking-wide",
                                cta.style === "primary"
                                  ? "bg-primary text-primary-foreground"
                                  : "border border-border text-foreground",
                              )}
                            >
                              {cta.style}
                            </span>
                          </div>
                          <button
                            aria-label="Remove CTA"
                            className="inline-flex h-7 items-center justify-center rounded border border-border/60 text-muted-foreground transition-colors hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
                            type="button"
                            onClick={() =>
                              onChange({
                                slides: block.slides.map((s, j) =>
                                  j === i
                                    ? {
                                        ...s,
                                        ctas: s.ctas.filter((_, k) => k !== ci),
                                      }
                                    : s,
                                ),
                              })
                            }
                          >
                            <HugeiconsIcon
                              icon={Delete02Icon}
                              size={14}
                              strokeWidth={1.9}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <AddItemButton
                    label="Add CTA"
                    onClick={() =>
                      onChange({
                        slides: block.slides.map((s, j) =>
                          j === i
                            ? {
                                ...s,
                                ctas: [
                                  ...(s.ctas ?? []),
                                  {
                                    id: makeId(),
                                    text: "",
                                    url: "",
                                    style: "primary" as const,
                                  },
                                ],
                              }
                            : s,
                        ),
                      })
                    }
                  />
                </div>
              </div>
            </ArrayItemRow>
          ))}
        </div>
        <AddItemButton
          label="Add slide"
          onClick={() =>
            onChange({
              slides: [
                ...block.slides,
                {
                  id: makeId(),
                  eyebrow: "",
                  showCategoryIcons: false,
                  heading: "",
                  subheading: "",
                  ctas: [],
                },
              ],
            })
          }
        />
      </BlockSubsection>

      <BlockSubsection
        defaultOpen={false}
        hint="Optional hero behaviors"
        title="Advanced Options"
      >
        <div className="space-y-3">
          <div className="flex min-h-11 items-center gap-3 rounded-xl border border-border/60 bg-card/70 p-4 shadow-[inset_0_1px_0_hsl(var(--background)/0.7)]">
            <Switch
              checked={!!block.showFeaturedEvent}
              id="showFeaturedEvent"
              onCheckedChange={(v) => onChange({ showFeaturedEvent: v })}
            />
            <label
              className="cursor-pointer text-sm"
              htmlFor="showFeaturedEvent"
            >
              Show featured event card under hero
            </label>
          </div>

          <div className="flex min-h-11 items-center gap-3 rounded-xl border border-border/60 bg-card/70 p-4 shadow-[inset_0_1px_0_hsl(var(--background)/0.7)]">
            <Switch
              checked={!!block.grayscaleMedia}
              id="grayscaleMedia"
              onCheckedChange={(v) => onChange({ grayscaleMedia: v })}
            />
            <label className="cursor-pointer text-sm" htmlFor="grayscaleMedia">
              Apply grayscale treatment to background media
            </label>
          </div>
        </div>
      </BlockSubsection>
    </div>
  );
}

function CtaBlockFields({
  block,
  dir,
  onChange,
  entities,
}: {
  block: Extract<Block, { type: "cta" }>;
  dir: "ltr" | "rtl";
  onChange: (patch: Partial<typeof block>) => void;
  entities: LinkPickerEntities;
}) {
  return (
    <FieldRow>
      <Field label="Heading">
        <input
          className={cn(inputCls, dir === "rtl" && "text-right")}
          dir={dir}
          title="Heading"
          value={block.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
        />
      </Field>
      <Field label="Body Text">
        <input
          className={cn(inputCls, dir === "rtl" && "text-right")}
          dir={dir}
          title="Body Text"
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      </Field>
      <Field label="Button Text">
        <input
          className={cn(inputCls, dir === "rtl" && "text-right")}
          dir={dir}
          title="Button Text"
          value={block.buttonText}
          onChange={(e) => onChange({ buttonText: e.target.value })}
        />
      </Field>
      <div>
        <label className={labelCls}>Button URL</label>
        <LinkFieldWithMode
          dir={dir}
          entities={entities}
          internalPlaceholder="/en/contact"
          value={block.buttonUrl}
          onChange={(url) => onChange({ buttonUrl: url })}
        />
      </div>
    </FieldRow>
  );
}

function ListingConfigFields({
  block,
  dir,
  onChange,
}: {
  block: Extract<Block, { type: "listing_config" }>;
  dir: "ltr" | "rtl";
  onChange: (patch: Partial<typeof block>) => void;
}) {
  return (
    <div className="space-y-4">
      <BlockSubsection hint="Listing header content" title="Content">
        <FieldRow>
          <Field label="Eyebrow">
            <input
              className={cn(inputCls, dir === "rtl" && "text-right")}
              dir={dir}
              title="Eyebrow"
              value={block.eyebrow}
              onChange={(e) => onChange({ eyebrow: e.target.value })}
            />
          </Field>
          <Field label="Heading">
            <input
              className={cn(inputCls, dir === "rtl" && "text-right")}
              dir={dir}
              title="Heading"
              value={block.heading}
              onChange={(e) => onChange({ heading: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Subheading">
              <input
                className={cn(inputCls, dir === "rtl" && "text-right")}
                dir={dir}
                title="Subheading"
                value={block.subheading}
                onChange={(e) => onChange({ subheading: e.target.value })}
              />
            </Field>
          </div>
        </FieldRow>
      </BlockSubsection>
      <BlockSubsection
        defaultOpen={false}
        hint="Pagination and density"
        title="Display Settings"
      >
        <FieldRow>
          <Field label="Results Per Page">
            <NumberStepper
              min={1}
              presets={[6, 9, 12, 18]}
              step={1}
              value={block.resultsPerPage}
              onChange={(next) => onChange({ resultsPerPage: next })}
            />
          </Field>
        </FieldRow>
      </BlockSubsection>
    </div>
  );
}

function AccreditationBarFields({
  block,
  dir,
  onChange,
}: {
  block: Extract<Block, { type: "accreditation_bar" }>;
  dir: "ltr" | "rtl";
  onChange: (patch: Partial<typeof block>) => void;
}) {
  return (
    <div className="space-y-4">
      <BlockSubsection hint="Topline and badge copy" title="Badge & Context">
        <div className="space-y-4">
          <FieldRow>
            <Field label="Eyebrow">
              <input
                className={cn(inputCls, dir === "rtl" && "text-right")}
                dir={dir}
                placeholder="e.g. Accredited by"
                title="Eyebrow"
                value={block.eyebrow}
                onChange={(e) => onChange({ eyebrow: e.target.value })}
              />
            </Field>
            <Field label="Badge Label">
              <input
                className={inputCls}
                placeholder="e.g. QABA"
                title="Badge Label"
                value={block.badgeLabel}
                onChange={(e) => onChange({ badgeLabel: e.target.value })}
              />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Badge Title">
              <input
                className={cn(inputCls, dir === "rtl" && "text-right")}
                dir={dir}
                placeholder="Quality Assurance Body"
                title="Badge Title"
                value={block.badgeTitle}
                onChange={(e) => onChange({ badgeTitle: e.target.value })}
              />
            </Field>
            <Field label="Badge Subtitle">
              <input
                className={cn(inputCls, dir === "rtl" && "text-right")}
                dir={dir}
                placeholder="Certified Training Provider"
                title="Badge Subtitle"
                value={block.badgeSub}
                onChange={(e) => onChange({ badgeSub: e.target.value })}
              />
            </Field>
          </FieldRow>
          <Field label="Clients Heading">
            <input
              className={cn(inputCls, dir === "rtl" && "text-right")}
              dir={dir}
              placeholder="Our clients"
              title="Clients Heading"
              value={block.clientsHeading}
              onChange={(e) => onChange({ clientsHeading: e.target.value })}
            />
          </Field>
        </div>
      </BlockSubsection>

      <BlockSubsection
        defaultOpen={false}
        hint={`${(block.clients ?? []).length} organization(s)`}
        title="Organization Logos"
      >
        <div className="grid gap-3 xl:grid-cols-2">
          {(block.clients ?? []).map((client, i) => (
            <ArrayItemRow
              index={i}
              key={client.id || i}
              title={client.name?.trim() || "Untitled organization"}
              onDuplicate={() =>
                onChange({
                  clients: [
                    ...block.clients.slice(0, i + 1),
                    { ...client, id: makeId() },
                    ...block.clients.slice(i + 1),
                  ],
                })
              }
              onMoveDown={() =>
                i < block.clients.length - 1
                  ? onChange({
                      clients: arrayMove(block.clients, i, i + 1),
                    })
                  : undefined
              }
              onMoveUp={() =>
                i > 0
                  ? onChange({
                      clients: arrayMove(block.clients, i, i - 1),
                    })
                  : undefined
              }
              onRemove={() =>
                onChange({
                  clients: block.clients.filter((_, idx) => idx !== i),
                })
              }
            >
              <div className="space-y-3">
                <Field label="Organization Name">
                  <input
                    className={cn(inputCls, dir === "rtl" && "text-right")}
                    dir={dir}
                    placeholder="e.g. Ministry of Education"
                    value={client.name}
                    onChange={(e) =>
                      onChange({
                        clients: block.clients.map((item, idx) =>
                          idx === i ? { ...item, name: e.target.value } : item,
                        ),
                      })
                    }
                  />
                </Field>
                <div>
                  <label className={labelCls}>Logo</label>
                  <ImagePickerField
                    dir={dir}
                    fetchMedia={fetchMediaAction}
                    value={client.logo ?? ""}
                    onChange={(url) =>
                      onChange({
                        clients: block.clients.map((item, idx) =>
                          idx === i ? { ...item, logo: url } : item,
                        ),
                      })
                    }
                  />
                </div>
              </div>
            </ArrayItemRow>
          ))}
          <AddItemButton
            label="Add organization"
            onClick={() =>
              onChange({
                clients: [
                  ...block.clients,
                  { id: makeId(), name: "", logo: "" },
                ],
              })
            }
          />
        </div>
      </BlockSubsection>
    </div>
  );
}

function HomeEventsCarouselFields({
  block,
  dir,
  onChange,
}: {
  block: Extract<Block, { type: "home_events_carousel" }>;
  dir: "ltr" | "rtl";
  onChange: (patch: Partial<typeof block>) => void;
}) {
  return (
    <FieldRow>
      <Field label="Eyebrow">
        <input
          className={cn(inputCls, dir === "rtl" && "text-right")}
          dir={dir}
          placeholder="Upcoming events"
          title="Eyebrow"
          value={block.eyebrow}
          onChange={(e) => onChange({ eyebrow: e.target.value })}
        />
      </Field>
      <Field label="Heading">
        <input
          className={cn(inputCls, dir === "rtl" && "text-right")}
          dir={dir}
          placeholder="Explore our events"
          title="Heading"
          value={block.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
        />
      </Field>
      <Field label="Max Events">
        <NumberStepper
          min={1}
          presets={[3, 6, 9, 12]}
          step={1}
          value={block.limit}
          onChange={(next) => onChange({ limit: next })}
        />
      </Field>
      <Field label="Content Source">
        <RadioGroup
          className="grid w-full grid-cols-1 gap-0 rounded-md shadow-xs sm:grid-cols-3"
          value={block.source ?? "mixed"}
          onValueChange={(value) =>
            onChange({
              source: value as "events" | "training_courses" | "mixed",
            })
          }
        >
          <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -mt-px flex items-center justify-center border p-2.5 outline-none first:mt-0 first:rounded-t-[4px] last:rounded-b-[4px] has-data-checked:z-10 sm:-ml-px sm:mt-0 sm:first:ml-0 sm:first:rounded-l-[4px] sm:first:rounded-t-none sm:last:rounded-b-none sm:last:rounded-r-[4px]">
            <RadioGroupItem
              className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
              id="upcoming-events-source-mixed"
              value="mixed"
              aria-label="Mixed content source"
            />
            <Label
              className="inline-flex cursor-pointer items-center gap-1.5 text-center text-xs"
              htmlFor="upcoming-events-source-mixed"
            >
              Mixed
            </Label>
          </div>
          <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -mt-px flex items-center justify-center border p-2.5 outline-none first:mt-0 first:rounded-t-[4px] last:rounded-b-[4px] has-data-checked:z-10 sm:-ml-px sm:mt-0 sm:first:ml-0 sm:first:rounded-l-[4px] sm:first:rounded-t-none sm:last:rounded-b-none sm:last:rounded-r-[4px]">
            <RadioGroupItem
              className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
              id="upcoming-events-source-events"
              value="events"
              aria-label="Events only"
            />
            <Label
              className="inline-flex cursor-pointer items-center gap-1.5 text-center text-xs"
              htmlFor="upcoming-events-source-events"
            >
              Events
            </Label>
          </div>
          <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -mt-px flex items-center justify-center border p-2.5 outline-none first:mt-0 first:rounded-t-[4px] last:rounded-b-[4px] has-data-checked:z-10 sm:-ml-px sm:mt-0 sm:first:ml-0 sm:first:rounded-l-[4px] sm:first:rounded-t-none sm:last:rounded-b-none sm:last:rounded-r-[4px]">
            <RadioGroupItem
              className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
              id="upcoming-events-source-training-courses"
              value="training_courses"
              aria-label="Training courses only"
            />
            <Label
              className="inline-flex cursor-pointer items-center gap-1.5 text-center text-xs"
              htmlFor="upcoming-events-source-training-courses"
            >
              Training
            </Label>
          </div>
        </RadioGroup>
      </Field>
      <Field label="Show View More">
        <RadioGroup
          className="grid w-full grid-cols-2 gap-0 rounded-md shadow-xs"
          value={block.showViewMore === false ? "no" : "yes"}
          onValueChange={(value) => onChange({ showViewMore: value === "yes" })}
        >
          <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-center border p-2.5 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
            <RadioGroupItem
              className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
              id="upcoming-events-show-view-more-yes"
              value="yes"
              aria-label="Show view more"
            />
            <Label
              className="inline-flex cursor-pointer items-center gap-1.5 text-xs"
              htmlFor="upcoming-events-show-view-more-yes"
            >
              Show
            </Label>
          </div>
          <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-center border p-2.5 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
            <RadioGroupItem
              className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
              id="upcoming-events-show-view-more-no"
              value="no"
              aria-label="Hide view more"
            />
            <Label
              className="inline-flex cursor-pointer items-center gap-1.5 text-xs"
              htmlFor="upcoming-events-show-view-more-no"
            >
              Hide
            </Label>
          </div>
        </RadioGroup>
      </Field>
      <Field label="Quick Presets">
        <div className="flex flex-wrap gap-1">
          <Button
            className="h-8 rounded-[4px] px-2 text-[11px]"
            size="sm"
            type="button"
            variant="outline"
            onClick={() =>
              onChange({ limit: 6, source: "mixed", showViewMore: true })
            }
          >
            Balanced
          </Button>
          <Button
            className="h-8 rounded-[4px] px-2 text-[11px]"
            size="sm"
            type="button"
            variant="outline"
            onClick={() =>
              onChange({ limit: 9, source: "events", showViewMore: true })
            }
          >
            Event-heavy
          </Button>
          <Button
            className="h-8 rounded-[4px] px-2 text-[11px]"
            size="sm"
            type="button"
            variant="outline"
            onClick={() =>
              onChange({
                limit: 6,
                source: "training_courses",
                showViewMore: false,
              })
            }
          >
            Courses focus
          </Button>
        </div>
      </Field>
    </FieldRow>
  );
}

function HomePostsGridFields({
  block,
  dir,
  onChange,
}: {
  block: Extract<Block, { type: "home_posts_grid" }>;
  dir: "ltr" | "rtl";
  onChange: (patch: Partial<typeof block>) => void;
}) {
  return (
    <FieldRow>
      <Field label="Eyebrow">
        <input
          className={cn(inputCls, dir === "rtl" && "text-right")}
          dir={dir}
          placeholder="Latest articles"
          title="Eyebrow"
          value={block.eyebrow}
          onChange={(e) => onChange({ eyebrow: e.target.value })}
        />
      </Field>
      <Field label="Heading">
        <input
          className={cn(inputCls, dir === "rtl" && "text-right")}
          dir={dir}
          placeholder="From the blog"
          title="Heading"
          value={block.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
        />
      </Field>
      <Field label="Max Posts">
        <NumberStepper
          min={1}
          presets={[3, 6, 9, 12]}
          step={1}
          value={block.limit}
          onChange={(next) => onChange({ limit: next })}
        />
      </Field>
    </FieldRow>
  );
}

// ─── Block fields dispatcher ──────────────────────────────────────────────────

function renderBlockFields(
  block: Block,
  dir: "ltr" | "rtl",
  onChange: (patch: Partial<Block>) => void,
  entities: LinkPickerEntities,
): React.ReactNode {
  switch (block.type) {
    case "page_hero":
      return (
        <PageHeroFields
          block={block}
          dir={dir}
          entities={entities}
          onChange={onChange as (p: Partial<typeof block>) => void}
        />
      );
    case "about_intro":
      return (
        <AboutIntroFields
          block={block}
          dir={dir}
          entities={entities}
          onChange={onChange as (p: Partial<typeof block>) => void}
        />
      );
    case "mission_vision":
      return (
        <MissionVisionFields
          block={block}
          dir={dir}
          onChange={onChange as (p: Partial<typeof block>) => void}
        />
      );
    case "process_steps":
      return (
        <ProcessStepsFields
          block={block}
          dir={dir}
          onChange={onChange as (p: Partial<typeof block>) => void}
        />
      );
    case "values_list":
      return (
        <ValuesListFields
          block={block}
          dir={dir}
          onChange={onChange as (p: Partial<typeof block>) => void}
        />
      );
    case "accreditation":
      return (
        <AccreditationFields
          block={block}
          dir={dir}
          onChange={onChange as (p: Partial<typeof block>) => void}
        />
      );
    case "service_cards":
      return (
        <ServiceCardsFields
          block={block}
          dir={dir}
          onChange={onChange as (p: Partial<typeof block>) => void}
        />
      );
    case "training_domains":
      return (
        <TrainingDomainsFields
          block={block}
          dir={dir}
          onChange={onChange as (p: Partial<typeof block>) => void}
        />
      );
    case "cta_banner":
      return (
        <CtaBannerFields
          block={block}
          dir={dir}
          entities={entities}
          onChange={onChange as (p: Partial<typeof block>) => void}
        />
      );
    case "richtext":
      return (
        <RichTextFields
          block={block}
          dir={dir}
          onChange={onChange as (p: Partial<typeof block>) => void}
        />
      );
    case "hero":
      return (
        <HeroBlockFields
          block={block}
          dir={dir}
          entities={entities}
          onChange={onChange as (p: Partial<typeof block>) => void}
        />
      );
    case "cta":
      return (
        <CtaBlockFields
          block={block}
          dir={dir}
          entities={entities}
          onChange={onChange as (p: Partial<typeof block>) => void}
        />
      );
    case "listing_config":
      return (
        <ListingConfigFields
          block={block}
          dir={dir}
          onChange={onChange as (p: Partial<typeof block>) => void}
        />
      );
    case "accreditation_bar":
      return (
        <AccreditationBarFields
          block={block}
          dir={dir}
          onChange={onChange as (p: Partial<typeof block>) => void}
        />
      );
    case "home_events_carousel":
      return (
        <HomeEventsCarouselFields
          block={block}
          dir={dir}
          onChange={onChange as (p: Partial<typeof block>) => void}
        />
      );
    case "home_posts_grid":
      return (
        <HomePostsGridFields
          block={block}
          dir={dir}
          onChange={onChange as (p: Partial<typeof block>) => void}
        />
      );
    default:
      return null;
  }
}

// ─── Block factory ────────────────────────────────────────────────────────────

function makeBlock(type: BlockType): Block {
  const id = makeId();
  switch (type) {
    case "page_hero":
      return {
        id,
        type,
        eyebrow: "",
        fullViewport: false,
        backgroundColor: "#121414",
        overlayColor: "#000000",
        overlayOpacity: 40,
        media: [],
        slides: [{ id: makeId(), heading: "", subheading: "" }],
      };
    case "about_intro":
      return {
        id,
        type,
        body: "",
        metricsHeading: "",
        metrics: [],
        ctaText: "",
        ctaUrl: "",
      };
    case "mission_vision":
      return {
        id,
        type,
        items: [{ title: "", body: "" }],
      };
    case "process_steps":
      return {
        id,
        type,
        heading: "",
        body: "",
        mediaUrl: "",
        mediaKind: "image",
        mediaSize: "md",
        steps: [],
      };
    case "values_list":
      return { id, type, eyebrow: "", heading: "", items: [] };
    case "accreditation":
      return {
        id,
        type,
        heading: "",
        description: "",
        featuredOrgs: [],
        logosHeading: "",
        logosDescription: "",
        logos: [],
      };
    case "service_cards":
      return { id, type, items: [] };
    case "training_domains":
      return {
        id,
        type,
        eyebrow: "",
        heading: "",
        description: "",
        descriptionSize: "md",
        customDescriptionSize: 16,
      };
    case "cta_banner":
      return {
        id,
        type,
        eyebrow: "",
        heading: "",
        body: "",
        buttonText: "",
        buttonUrl: "",
        linkText: "",
        linkUrl: "",
      };
    case "richtext":
      return { id, type, html: "" };
    case "hero":
      return {
        id,
        type,
        fullViewport: true,
        backgroundColor: "#121414",
        overlayColor: "#000000",
        overlayOpacity: 40,
        media: [],
        slides: [
          {
            id: makeId(),
            eyebrow: "",
            showCategoryIcons: false,
            heading: "",
            subheading: "",
            ctas: [],
          },
        ],
        showCategoryIcons: false,
      };
    case "cta":
      return { id, type, heading: "", text: "", buttonText: "", buttonUrl: "" };
    case "listing_config":
      return {
        id,
        type,
        eyebrow: "",
        heading: "",
        subheading: "",
        resultsPerPage: 12,
      };
    case "accreditation_bar":
      return {
        id,
        type,
        eyebrow: "",
        badgeLabel: "QABA",
        badgeTitle: "",
        badgeSub: "",
        clientsHeading: "",
        clients: [],
      };
    case "home_events_carousel":
      return {
        id,
        type,
        eyebrow: "",
        heading: "",
        limit: 6,
        source: "mixed",
        showViewMore: false,
      };
    case "home_posts_grid":
      return { id, type, eyebrow: "", heading: "", limit: 6 };
  }
}

function cloneBlockWithFreshIds(block: Block): Block {
  const cloned = JSON.parse(JSON.stringify(block)) as Block;
  cloned.id = makeId();

  if (cloned.type === "hero") {
    cloned.media = (cloned.media ?? []).map((m) => ({ ...m, id: makeId() }));
    cloned.slides = (cloned.slides ?? []).map((s) => ({
      ...s,
      id: makeId(),
      ctas: (s.ctas ?? []).map((c) => ({ ...c, id: makeId() })),
    }));
  }

  if (cloned.type === "page_hero") {
    cloned.media = (cloned.media ?? []).map((m) => ({ ...m, id: makeId() }));
    cloned.slides = (cloned.slides ?? []).map((s) => ({ ...s, id: makeId() }));
  }

  if (cloned.type === "accreditation_bar") {
    cloned.clients = (cloned.clients ?? []).map((c) => ({
      ...c,
      id: makeId(),
    }));
  }

  return cloned;
}

// ─── PageEditor ───────────────────────────────────────────────────────────────

type SectionId = "identity" | "blocks" | "seo";

const sectionNav: { icon: React.ElementType; id: SectionId; label: string }[] =
  [
    { id: "identity", label: "Identity", icon: FileText },
    { id: "blocks", label: "Content Blocks", icon: AlignLeft },
    { id: "seo", label: "SEO", icon: Search },
  ];

export function PageEditor({
  locale,
  pageData,
  entities,
}: {
  locale: string;
  pageData: PageData;
  entities?: LinkPickerEntities;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeLocale, setActiveLocale] = useState<"ar" | "en">("en");
  const [activeSection, setActiveSection] = useState<SectionId>("identity");
  const [viewMode, setViewMode] = useState<"editor" | "preview">("editor");
  const [focusMode, setFocusMode] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [hasClipboardBlock, setHasClipboardBlock] = useState(false);
  const [translatingBlockId, setTranslatingBlockId] = useState<string | null>(
    null,
  );
  const [isBulkTranslating, setIsBulkTranslating] = useState(false);
  const [previewNonce, setPreviewNonce] = useState(() => Date.now());
  const [isPreviewSyncing, setIsPreviewSyncing] = useState(false);
  const [previewAutoSync, setPreviewAutoSync] = useState(true);
  const previewSyncQueuedRef = useRef(false);

  const [titleEn, setTitleEn] = useState(pageData.titleEn);
  const [titleAr, setTitleAr] = useState(pageData.titleAr);
  const [seoTitleEn, setSeoTitleEn] = useState(pageData.seoTitleEn);
  const [seoTitleAr, setSeoTitleAr] = useState(pageData.seoTitleAr);
  const [seoDescEn, setSeoDescEn] = useState(pageData.seoDescriptionEn);
  const [seoDescAr, setSeoDescAr] = useState(pageData.seoDescriptionAr);
  const [status, setStatus] = useState(pageData.status);
  const [blocksEn, setBlocksEn] = useState<Block[]>(() =>
    migrateBlocks(pageData.blocksEn),
  );
  const [blocksAr, setBlocksAr] = useState<Block[]>(() =>
    migrateBlocks(pageData.blocksAr),
  );
  type EditorSnapshot = {
    blocksAr: Block[];
    blocksEn: Block[];
    seoDescAr: string;
    seoDescEn: string;
    seoTitleAr: string;
    seoTitleEn: string;
    status: string;
    titleAr: string;
    titleEn: string;
  };
  const toSnapshot = (): EditorSnapshot => ({
    status,
    titleEn,
    titleAr,
    seoTitleEn,
    seoTitleAr,
    seoDescEn,
    seoDescAr,
    blocksEn,
    blocksAr,
  });
  const applySnapshot = (snapshot: EditorSnapshot) => {
    setStatus(snapshot.status);
    setTitleEn(snapshot.titleEn);
    setTitleAr(snapshot.titleAr);
    setSeoTitleEn(snapshot.seoTitleEn);
    setSeoTitleAr(snapshot.seoTitleAr);
    setSeoDescEn(snapshot.seoDescEn);
    setSeoDescAr(snapshot.seoDescAr);
    setBlocksEn(snapshot.blocksEn);
    setBlocksAr(snapshot.blocksAr);
  };
  const serializeSnapshot = (snapshot: EditorSnapshot) =>
    JSON.stringify(snapshot);
  const initialSnapshotRef = useRef<EditorSnapshot>({
    status: pageData.status,
    titleEn: pageData.titleEn,
    titleAr: pageData.titleAr,
    seoTitleEn: pageData.seoTitleEn,
    seoTitleAr: pageData.seoTitleAr,
    seoDescEn: pageData.seoDescriptionEn,
    seoDescAr: pageData.seoDescriptionAr,
    blocksEn: migrateBlocks(pageData.blocksEn),
    blocksAr: migrateBlocks(pageData.blocksAr),
  });
  const historyRef = useRef<EditorSnapshot[]>([initialSnapshotRef.current]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isApplyingHistoryRef = useRef(false);

  const currentSnapshot = toSnapshot();
  const currentSerialized = serializeSnapshot(currentSnapshot);
  const initialSerialized = serializeSnapshot(initialSnapshotRef.current);
  const isDirty = currentSerialized !== initialSerialized;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyRef.current.length - 1;

  const pickerEntities: LinkPickerEntities = entities ?? {
    pages: [],
    posts: [],
    events: [],
  };

  const blocks = activeLocale === "en" ? blocksEn : blocksAr;
  const setBlocks = activeLocale === "en" ? setBlocksEn : setBlocksAr;
  const targetLocaleBlockIds = useMemo(
    () =>
      new Set(
        (activeLocale === "en" ? blocksAr : blocksEn).map((block) => block.id),
      ),
    [activeLocale, blocksAr, blocksEn],
  );
  const blockDiagnostics = useMemo<Record<string, BlockDiagnostics>>(
    () =>
      Object.fromEntries(
        blocks.map((block) => [
          block.id,
          {
            mediaCount: countMediaReferences(block),
            missingRequiredContent: hasMissingRequiredContent(block),
            untranslated: !targetLocaleBlockIds.has(block.id),
          },
        ]),
      ),
    [blocks, targetLocaleBlockIds],
  );
  const qualityCounts = useMemo(
    () =>
      blocks.reduce(
        (acc, block) => {
          const diag = blockDiagnostics[block.id];
          if (!diag) return acc;
          if (diag.missingRequiredContent) acc.needsAttention += 1;
          if (diag.untranslated) acc.untranslated += 1;
          return acc;
        },
        { needsAttention: 0, untranslated: 0 },
      ),
    [blockDiagnostics, blocks],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((prev) => {
        const oldIndex = prev.findIndex((b) => b.id === active.id);
        const newIndex = prev.findIndex((b) => b.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  function updateBlock(id: string, patch: Partial<Block>) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)),
    );
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  function addBlock(type: BlockType) {
    setBlocks((prev) => [...prev, makeBlock(type)]);
  }

  function copyBlockToClipboard(blockId: string) {
    const source = blocks.find((b) => b.id === blockId);
    if (!source) return;
    const payload = {
      copiedAt: Date.now(),
      block: source,
    };
    localStorage.setItem(BLOCK_CLIPBOARD_KEY, JSON.stringify(payload));
    setHasClipboardBlock(true);
    toast.success("Block copied. Use Paste Block on any page.");
  }

  function pasteBlockFromClipboard() {
    const raw = localStorage.getItem(BLOCK_CLIPBOARD_KEY);
    if (!raw) {
      toast.error("No copied block found.");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { block?: Block };
      if (!parsed.block) {
        toast.error("Clipboard block is invalid.");
        return;
      }
      const newBlock = cloneBlockWithFreshIds(parsed.block);
      setBlocks((prev) => [...prev, newBlock]);
      setSelectedBlockId(newBlock.id);
      toast.success("Block pasted.");
    } catch {
      toast.error("Clipboard block is invalid.");
    }
  }

  function copyBlockToOtherLocale(blockId: string) {
    const sourceBlocks = activeLocale === "en" ? blocksEn : blocksAr;
    const sourceBlock = sourceBlocks.find((block) => block.id === blockId);
    if (!sourceBlock) return;

    const copiedBlock = JSON.parse(JSON.stringify(sourceBlock)) as Block;
    if (activeLocale === "en") {
      setBlocksAr((prev) => {
        const existingIndex = prev.findIndex(
          (block) => block.id === copiedBlock.id,
        );
        if (existingIndex === -1) return [...prev, copiedBlock];
        return prev.map((block, index) =>
          index === existingIndex ? copiedBlock : block,
        );
      });
      toast.success("Block copied to Arabic locale.");
      return;
    }

    setBlocksEn((prev) => {
      const existingIndex = prev.findIndex(
        (block) => block.id === copiedBlock.id,
      );
      if (existingIndex === -1) return [...prev, copiedBlock];
      return prev.map((block, index) =>
        index === existingIndex ? copiedBlock : block,
      );
    });
    toast.success("Block copied to English locale.");
  }

  async function translateBlockToOtherLocale(blockId: string) {
    if (!ENABLE_BLOCK_TRANSLATION) {
      toast.error("Block translation is disabled.");
      return;
    }
    const sourceLocale = activeLocale;
    const targetLocale: "en" | "ar" = sourceLocale === "en" ? "ar" : "en";
    const sourceBlocks = sourceLocale === "en" ? blocksEn : blocksAr;
    const sourceBlock = sourceBlocks.find((block) => block.id === blockId);
    if (!sourceBlock) return;
    setTranslatingBlockId(blockId);
    const result = await translateBlockAction(
      sourceBlock,
      sourceLocale,
      targetLocale,
    );
    setTranslatingBlockId(null);
    if (result.error || !result.block) {
      toast.error(result.error ?? "Failed to translate block.");
      return;
    }
    const translated = result.block as Block;
    if (targetLocale === "ar") {
      setBlocksAr((prev) => {
        const existingIndex = prev.findIndex(
          (block) => block.id === translated.id,
        );
        if (existingIndex === -1) return [...prev, translated];
        return prev.map((block, index) =>
          index === existingIndex ? translated : block,
        );
      });
    } else {
      setBlocksEn((prev) => {
        const existingIndex = prev.findIndex(
          (block) => block.id === translated.id,
        );
        if (existingIndex === -1) return [...prev, translated];
        return prev.map((block, index) =>
          index === existingIndex ? translated : block,
        );
      });
    }
    toast.success(
      targetLocale === "ar"
        ? "Block translated to Arabic."
        : "Block translated to English.",
    );
  }

  async function translateMissingBlocksToOtherLocale() {
    if (!ENABLE_BLOCK_TRANSLATION) {
      toast.error("Block translation is disabled.");
      return;
    }
    const sourceLocale = activeLocale;
    const targetLocale: "en" | "ar" = sourceLocale === "en" ? "ar" : "en";
    const sourceBlocks = sourceLocale === "en" ? blocksEn : blocksAr;
    const targetBlocks = targetLocale === "en" ? blocksEn : blocksAr;
    const targetIds = new Set(targetBlocks.map((block) => block.id));
    const missing = sourceBlocks.filter((block) => !targetIds.has(block.id));
    if (missing.length === 0) {
      toast.message("No missing blocks to translate.");
      return;
    }
    setIsBulkTranslating(true);
    const translatedBlocks: Block[] = [];
    for (const block of missing) {
      const result = await translateBlockAction(
        block,
        sourceLocale,
        targetLocale,
      );
      if (result.block) {
        translatedBlocks.push(result.block as Block);
      }
    }
    setIsBulkTranslating(false);
    if (translatedBlocks.length === 0) {
      toast.error("Failed to translate missing blocks.");
      return;
    }
    if (targetLocale === "ar") {
      setBlocksAr((prev) => [...prev, ...translatedBlocks]);
    } else {
      setBlocksEn((prev) => [...prev, ...translatedBlocks]);
    }
    toast.success(
      targetLocale === "ar"
        ? `${translatedBlocks.length} block(s) translated to Arabic.`
        : `${translatedBlocks.length} block(s) translated to English.`,
    );
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updatePageAction(pageData.id, locale, {
        status,
        titleEn,
        titleAr,
        seoTitleEn,
        seoTitleAr,
        seoDescriptionEn: seoDescEn,
        seoDescriptionAr: seoDescAr,
        blocksEn,
        blocksAr,
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Page saved");
        const savedSnapshot = toSnapshot();
        initialSnapshotRef.current = savedSnapshot;
        historyRef.current = [savedSnapshot];
        setHistoryIndex(0);
        router.refresh();
      }
    });
  }

  function handleDiscardChanges() {
    isApplyingHistoryRef.current = true;
    const base = initialSnapshotRef.current;
    applySnapshot(base);
    historyRef.current = [base];
    setHistoryIndex(0);
    queueMicrotask(() => {
      isApplyingHistoryRef.current = false;
    });
  }

  function handleUndo() {
    if (!canUndo) return;
    const nextIndex = historyIndex - 1;
    const snapshot = historyRef.current[nextIndex];
    if (!snapshot) return;
    isApplyingHistoryRef.current = true;
    applySnapshot(snapshot);
    setHistoryIndex(nextIndex);
    queueMicrotask(() => {
      isApplyingHistoryRef.current = false;
    });
  }

  function handleRedo() {
    if (!canRedo) return;
    const nextIndex = historyIndex + 1;
    const snapshot = historyRef.current[nextIndex];
    if (!snapshot) return;
    isApplyingHistoryRef.current = true;
    applySnapshot(snapshot);
    setHistoryIndex(nextIndex);
    queueMicrotask(() => {
      isApplyingHistoryRef.current = false;
    });
  }

  async function syncPreviewNow() {
    if (isPreviewSyncing) {
      previewSyncQueuedRef.current = true;
      return;
    }
    setIsPreviewSyncing(true);
    const result = await updatePageAction(pageData.id, locale, {
      status,
      titleEn,
      titleAr,
      seoTitleEn,
      seoTitleAr,
      seoDescriptionEn: seoDescEn,
      seoDescriptionAr: seoDescAr,
      blocksEn,
      blocksAr,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      setPreviewNonce(Date.now());
    }
    setIsPreviewSyncing(false);

    if (previewSyncQueuedRef.current) {
      previewSyncQueuedRef.current = false;
      void syncPreviewNow();
    }
  }

  useEffect(() => {
    if (viewMode !== "preview") return;
    void syncPreviewNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  useEffect(() => {
    if (viewMode !== "preview" || !previewAutoSync) return;
    const id = setTimeout(() => {
      void syncPreviewNow();
    }, 500);
    return () => clearTimeout(id);
  }, [
    viewMode,
    previewAutoSync,
    pageData.id,
    locale,
    status,
    titleEn,
    titleAr,
    seoTitleEn,
    seoTitleAr,
    seoDescEn,
    seoDescAr,
    blocksEn,
    blocksAr,
  ]);

  useEffect(() => {
    setHasClipboardBlock(Boolean(localStorage.getItem(BLOCK_CLIPBOARD_KEY)));
  }, []);

  useEffect(() => {
    if (activeSection !== "blocks" || viewMode !== "editor") return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      const selectedText = window.getSelection()?.toString() ?? "";
      if (selectedText.trim().length > 0) {
        return;
      }
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() === "c" && selectedBlockId) {
        event.preventDefault();
        copyBlockToClipboard(selectedBlockId);
      }
      if (event.key.toLowerCase() === "v") {
        event.preventDefault();
        pasteBlockFromClipboard();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeSection, selectedBlockId, viewMode, blocks]);

  useEffect(() => {
    if (isApplyingHistoryRef.current) return;
    const stack = historyRef.current;
    const last = stack[historyIndex];
    if (!last) return;
    const lastSerialized = serializeSnapshot(last);
    if (lastSerialized === currentSerialized) return;
    const next = toSnapshot();
    const trimmed = stack.slice(0, historyIndex + 1);
    trimmed.push(next);
    historyRef.current = trimmed;
    setHistoryIndex(trimmed.length - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSerialized]);

  useEffect(() => {
    if (!focusMode || activeSection !== "blocks") return;
    if (!selectedBlockId && blocks.length > 0) {
      setSelectedBlockId(blocks[0]?.id ?? null);
      return;
    }
    if (
      selectedBlockId &&
      !blocks.some((block) => block.id === selectedBlockId)
    ) {
      setSelectedBlockId(blocks[0]?.id ?? null);
    }
  }, [focusMode, activeSection, selectedBlockId, blocks]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        handleRedo();
        return;
      }
      if (key === "y") {
        event.preventDefault();
        handleRedo();
        return;
      }
      if (key === "z") {
        event.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canRedo, canUndo, historyIndex]);

  const dir = activeLocale === "ar" ? "rtl" : "ltr";
  const previewPath =
    pageData.slug === "home"
      ? `/${activeLocale}`
      : `/${activeLocale}/${pageData.slug}`;

  return (
    <div className="event-editor relative grid-cols-[220px_minmax(0,1fr)_220px]!">
      {/* Left rail */}
      <nav className="event-editor__rail_ sticky top-14 hidden h-[calc(100vh-4rem)] flex-col gap-2 border-r border-border/40 bg-card/50 p-0 md:flex">
        <div className="px-4 py-5">
          <Button
            className="mb-5 h-8 w-full justify-start gap-2 text-xs transition-colors hover:bg-primary/5"
            render={<Link href={`/${locale}/dashboard/pages`} />}
            size="sm"
            type="button"
            variant="ghost"
          >
            <ArrowLeft className="size-3.5" />
            All Pages
          </Button>

          <p className="mb-2 px-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
            Sections
          </p>
          <div className="space-y-1">
            {sectionNav.map(({ id, label, icon: Icon }) => (
              <button
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[12.5px] font-medium transition-all duration-150",
                  activeSection === id
                    ? "bg-primary/12 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.22)]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
              >
                <Icon className="size-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto border-t border-border/50 px-4 py-4">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
              status === "published"
                ? "bg-green-500/10 text-green-600"
                : "bg-muted text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                status === "published" ? "bg-green-500" : "bg-muted-foreground",
              )}
            />
            {status === "published" ? "Published" : "Draft"}
          </span>
        </div>
      </nav>

      {/* Main panel */}
      <div className="flex min-h-0 max-w-6xl flex-col">
        {/* Toolbar */}
        <div className="sticky top-14 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-border/50 bg-card/90 px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-[13px] font-semibold text-foreground">
              {activeLocale === "en" ? titleEn : titleAr}
            </span>
            <span className="truncate font-mono text-[11px] text-muted-foreground">
              /{pageData.slug}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <div className="flex h-9 flex-wrap items-center gap-1.5">
              <ButtonGroup
                className="rounded-[4px]"
                style={{ "--radius": "4px" } as React.CSSProperties}
              >
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  size="icon"
                  disabled={!canUndo}
                  onClick={handleUndo}
                >
                  <HugeiconsIcon icon={Undo02Icon} />
                </Button>
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  size="icon"
                  disabled={!canRedo}
                  onClick={handleRedo}
                >
                  <HugeiconsIcon icon={Redo02Icon} />
                </Button>
              </ButtonGroup>
              <RadioGroup
                className="grid w-full grid-cols-2 gap-0 rounded-[4px] shadow-xs md:w-auto"
                value={viewMode}
                onValueChange={(value) =>
                  setViewMode(value as "editor" | "preview")
                }
              >
                <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-center border px-3 py-1.5 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
                  <RadioGroupItem
                    className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
                    id="editor-view-mode"
                    value="editor"
                    aria-label="Editor mode"
                  />
                  <Label
                    className="cursor-pointer text-[11px] font-semibold"
                    htmlFor="editor-view-mode"
                  >
                    Editor
                  </Label>
                </div>
                <div className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-center border px-3 py-1.5 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10">
                  <RadioGroupItem
                    className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
                    id="preview-view-mode"
                    value="preview"
                    aria-label="Live preview mode"
                  />
                  <Label
                    className="cursor-pointer text-[11px] font-semibold"
                    htmlFor="preview-view-mode"
                  >
                    <HugeiconsIcon icon={ViewIcon} className="size-3.5" />
                    Live Preview
                  </Label>
                </div>
              </RadioGroup>
              <RadioGroup
                className="grid w-full grid-cols-2 gap-0 rounded-[4px] shadow-xs md:w-auto"
                value={activeLocale}
                onValueChange={(value) => setActiveLocale(value as "en" | "ar")}
              >
                {(["en", "ar"] as const).map((loc) => (
                  <div
                    className="border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/10 has-data-checked:text-primary relative -ml-px flex items-center justify-center border px-3 py-1.5 outline-none first:ml-0 first:rounded-l-[4px] last:rounded-r-[4px] has-data-checked:z-10"
                    key={loc}
                  >
                    <RadioGroupItem
                      className="absolute size-0 border-0 p-0 opacity-0 after:absolute after:inset-0"
                      id={`toolbar-locale-${loc}`}
                      value={loc}
                      aria-label={`${loc.toUpperCase()} locale`}
                    />
                    <Label
                      className={cn(
                        "cursor-pointer text-[11px] font-semibold",
                        loc === "ar" ? "font-[alexandria] leading-none" : "",
                      )}
                      dir={loc === "ar" ? "rtl" : "ltr"}
                      htmlFor={`toolbar-locale-${loc}`}
                    >
                      {loc === "en" ? "English" : "العربية"}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <ButtonGroup
                className="rounded-[4px] h-9"
                style={{ "--radius": "4px" } as React.CSSProperties}
              >
                <Button
                  variant="ghost"
                  disabled={!isDirty || isPending}
                  onClick={handleDiscardChanges}
                  className="cursor-pointer h-9"
                >
                  Discard
                </Button>
                <Button
                  disabled={!isDirty || isPending}
                  onClick={handleSave}
                  className="cursor-pointer h-9"
                >
                  {isPending ? (
                    <Spinner />
                  ) : (
                    <HugeiconsIcon icon={FloppyDiskIcon} />
                  )}
                  Save
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="isolate flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {viewMode === "preview" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md border border-border/50 bg-card/70 px-3 py-2 text-xs">
                <span className="font-medium text-muted-foreground">
                  Frontend preview:{" "}
                  <span className="text-foreground">{previewPath}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                    disabled={isPreviewSyncing}
                    type="button"
                    onClick={() => void syncPreviewNow()}
                  >
                    {isPreviewSyncing ? "Updating..." : "Update Preview"}
                  </button>
                  <span
                    className={cn(
                      "text-[11px]",
                      isPreviewSyncing
                        ? "text-secondary"
                        : "text-muted-foreground",
                    )}
                  >
                    {isPreviewSyncing ? "Syncing changes..." : "Ready"}
                  </span>
                </div>
              </div>
              <div className="h-[calc(100vh-14rem)] overflow-hidden rounded-lg border border-border/50 bg-background">
                <iframe
                  className="h-full w-full"
                  src={`${previewPath}?preview=1&t=${previewNonce}`}
                  title="Live frontend preview"
                />
              </div>
            </div>
          )}

          {viewMode === "editor" && (
            <>
              {/* Identity */}
              {activeSection === "identity" && (
                <div className="mx-auto max-w-2xl space-y-5">
                  <DashboardSectionHeading
                    icon={FileText}
                    index="01"
                    title="Identity"
                  />

                  <BlockSubsection
                    title={
                      activeLocale === "en"
                        ? "English Content"
                        : "Arabic Content"
                    }
                    defaultOpen
                  >
                    <div className="space-y-4 p-4 pt-0">
                      {activeLocale === "en" ? (
                        <Field label="Page Title (English)">
                          <Input
                            className={inputCls}
                            placeholder="Page title shown in editor"
                            value={titleEn}
                            onChange={(e) => setTitleEn(e.target.value)}
                          />
                        </Field>
                      ) : (
                        <Field label="Page Title (Arabic)">
                          <Input
                            className={cn(inputCls, "text-right")}
                            dir="rtl"
                            placeholder="عنوان الصفحة"
                            value={titleAr}
                            onChange={(e) => setTitleAr(e.target.value)}
                          />
                        </Field>
                      )}
                    </div>
                  </BlockSubsection>

                  <BlockSubsection
                    title="Publishing"
                    hint="Set whether this page is live or in draft."
                    defaultOpen={false}
                  >
                    <div className="space-y-4 p-4 pt-0">
                      <Field label="Status">
                        <button
                          className={cn(
                            "inline-flex h-9 w-full max-w-64 items-center justify-between rounded-md border px-3 text-sm transition-colors",
                            status === "published"
                              ? "border-green-500/40 bg-green-500/10 text-green-700"
                              : "border-input bg-input/20 text-muted-foreground",
                          )}
                          type="button"
                          onClick={() =>
                            setStatus(
                              status === "published" ? "draft" : "published",
                            )
                          }
                        >
                          <span className="font-medium">
                            {status === "published" ? "Published" : "Draft"}
                          </span>
                          <Switch
                            checked={status === "published"}
                            className="pointer-events-none"
                          />
                        </button>
                      </Field>
                    </div>
                  </BlockSubsection>
                </div>
              )}

              {/* Blocks */}
              {activeSection === "blocks" && (
                <div className="relative flex justify-between gap-6">
                  <div className="min-w-0 max-w-6xl flex-1 space-y-4">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-2.5">
                        <DashboardSectionHeading
                          icon={AlignLeft}
                          index="02"
                          title="Content Blocks"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">
                          {activeLocale === "en" ? "English" : "Arabic"} ·{" "}
                          {blocks.length} block{blocks.length !== 1 ? "s" : ""}
                        </span>
                        {qualityCounts.needsAttention > 0 ? (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Needs attention: {qualityCounts.needsAttention}
                          </span>
                        ) : null}
                        {qualityCounts.untranslated > 0 ? (
                          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                            Missing locale: {qualityCounts.untranslated}
                          </span>
                        ) : null}
                        <button
                          className={cn(
                            "inline-flex h-9 items-center rounded-md border px-2.5 text-[11px] font-medium transition-colors",
                            focusMode
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border/70 bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                          type="button"
                          onClick={() => setFocusMode((v) => !v)}
                        >
                          {focusMode ? "Exit Focus" : "Focus Selected"}
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <button
                                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border/70 bg-card px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                type="button"
                              >
                                <MoreHorizontal className="size-3.5" />
                                More
                              </button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-56">
                            <button
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                              disabled={!hasClipboardBlock}
                              type="button"
                              onClick={pasteBlockFromClipboard}
                            >
                              <ClipboardPaste className="size-3.5" />
                              Paste Block
                            </button>
                            {ENABLE_BLOCK_TRANSLATION ? (
                              <button
                                className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                                disabled={isBulkTranslating}
                                type="button"
                                onClick={translateMissingBlocksToOtherLocale}
                              >
                                {isBulkTranslating ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Languages className="size-3.5" />
                                )}
                                {activeLocale === "en"
                                  ? "Translate Missing to AR"
                                  : "Translate Missing to EN"}
                              </button>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AddBlockMenu onAdd={addBlock} />
                      </div>
                    </div>

                    {blocks.length === 0 && (
                      <div className="flex flex-col items-center rounded-xl border border-dashed border-border/50 py-14 text-center">
                        <AlignLeft className="mb-3 size-8 text-muted-foreground/40" />
                        <p className="text-sm font-medium text-muted-foreground">
                          No blocks yet
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/60">
                          Add your first block to start composing this page.
                        </p>
                      </div>
                    )}

                    <DndContext
                      collisionDetection={closestCenter}
                      modifiers={[restrictToVerticalAxis]}
                      sensors={sensors}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={blocks.map((b) => b.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {blocks.map((block, index) => (
                            <SortableBlock
                              copyLabel={
                                activeLocale === "en" ? "Arabic" : "English"
                              }
                              health={
                                blockDiagnostics[block.id]
                                  ?.missingRequiredContent
                                  ? "needs-attention"
                                  : "healthy"
                              }
                              id={block.id}
                              isDimmed={
                                focusMode &&
                                selectedBlockId !== null &&
                                selectedBlockId !== block.id
                              }
                              isSelected={selectedBlockId === block.id}
                              key={block.id}
                              label={BLOCK_LABELS[block.type]}
                              order={index + 1}
                              untranslated={
                                blockDiagnostics[block.id]?.untranslated ??
                                false
                              }
                              onSelect={() => setSelectedBlockId(block.id)}
                              isTranslating={translatingBlockId === block.id}
                              onTranslateToOtherLocale={() =>
                                translateBlockToOtherLocale(block.id)
                              }
                              translateLabel={
                                activeLocale === "en" ? "Arabic" : "English"
                              }
                              onCopyToOtherLocale={() =>
                                copyBlockToOtherLocale(block.id)
                              }
                              onRemove={() => removeBlock(block.id)}
                            >
                              {renderBlockFields(
                                block,
                                dir,
                                (patch) => updateBlock(block.id, patch),
                                pickerEntities,
                              )}
                            </SortableBlock>
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>
              )}

              {/* SEO */}
              {activeSection === "seo" && (
                <div className="mx-auto max-w-2xl space-y-5">
                  <DashboardSectionHeading
                    icon={Search}
                    index="03"
                    title="SEO"
                  />
                  <BlockSubsection
                    title={
                      activeLocale === "en"
                        ? "English Metadata"
                        : "Arabic Metadata"
                    }
                    defaultOpen
                  >
                    <div className="space-y-4 p-4 pt-0">
                      {activeLocale === "en" ? (
                        <>
                          <Field label="SEO Title (English)">
                            <Input
                              className={inputCls}
                              maxLength={60}
                              placeholder="Title shown in search results"
                              value={seoTitleEn}
                              onChange={(e) => setSeoTitleEn(e.target.value)}
                            />
                          </Field>
                          <Field label="Meta Description (English)">
                            <Textarea
                              className="min-h-20 w-full resize-none rounded-md border border-input bg-input/20 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                              maxLength={160}
                              placeholder="Short summary shown under the title in search results"
                              value={seoDescEn}
                              onChange={(e) => setSeoDescEn(e.target.value)}
                            />
                          </Field>
                        </>
                      ) : (
                        <>
                          <Field label="SEO Title (Arabic)">
                            <Input
                              className={cn(inputCls, "text-right")}
                              dir="rtl"
                              maxLength={60}
                              placeholder="عنوان SEO"
                              value={seoTitleAr}
                              onChange={(e) => setSeoTitleAr(e.target.value)}
                            />
                          </Field>
                          <Field label="Meta Description (Arabic)">
                            <Textarea
                              className="min-h-20 w-full resize-none rounded-md border border-input bg-input/20 px-3 py-2.5 text-right text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                              dir="rtl"
                              maxLength={160}
                              placeholder="وصف مختصر يظهر في نتائج البحث"
                              value={seoDescAr}
                              onChange={(e) => setSeoDescAr(e.target.value)}
                            />
                          </Field>
                        </>
                      )}
                    </div>
                  </BlockSubsection>
                  <BlockSubsection
                    title="SEO Guidance"
                    hint="Keep within recommended limits for better snippet quality."
                    defaultOpen={false}
                  >
                    <div className="p-4 pt-0">
                      <p className="text-[11px] text-muted-foreground">
                        Title:{" "}
                        {activeLocale === "en"
                          ? seoTitleEn.length
                          : seoTitleAr.length}
                        /60 · Description:{" "}
                        {activeLocale === "en"
                          ? seoDescEn.length
                          : seoDescAr.length}
                        /160
                      </p>
                    </div>
                  </BlockSubsection>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right rail */}
      <div className="hidden xl:flex xl:gap-4">
        <BlockNavSidebar
          blocks={blocks}
          diagnostics={blockDiagnostics}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
        />
      </div>
    </div>
  );
}
