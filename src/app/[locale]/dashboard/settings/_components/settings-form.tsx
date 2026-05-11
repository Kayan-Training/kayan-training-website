"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Remove01Icon } from "@hugeicons/core-free-icons";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { ImagePickerField } from "@/components/ui/image-picker-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fetchSettingsMediaAction, upsertSettings } from "../_actions";
import { SOCIAL_PLATFORM_OPTIONS, type SocialPlatformKey } from "@/lib/social-platforms";

function MaintenanceModeCard({ initialOn }: { initialOn: boolean }) {
  const [on, setOn] = useState(initialOn);
  const [isPending, startTransition] = useTransition();

  function toggle(next: boolean) {
    setOn(next);
    startTransition(async () => {
      const result = await upsertSettings([{ key: "site.maintenance", value: next ? "1" : "0" }]);
      if (result.error) {
        toast.error(result.error);
        setOn(!next);
      } else {
        toast.success(next ? "Maintenance mode enabled." : "Site is now live.");
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <div className="border-b border-border/50 bg-muted/20 px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">Site Mode</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          When maintenance mode is on, public users see the maintenance page. Auth routes stay accessible for login, and logged-in admins can access dashboard and frontend routes.
        </p>
      </div>
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm font-medium">{on ? "Maintenance Mode" : "Live"}</p>
          <p className="text-[11px] text-muted-foreground">
            {on ? "Frontend routes redirect to maintenance page." : "Site is publicly accessible."}
          </p>
        </div>
        <button
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50",
            on ? "bg-destructive" : "bg-muted",
          )}
          disabled={isPending}
          aria-checked={on ? "true" : "false"}
          role="switch"
          title={on ? "Disable maintenance mode" : "Enable maintenance mode"}
          type="button"
          onClick={() => toggle(!on)}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200",
              on ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
      </div>
    </div>
  );
}

type SettingField = {
  key: string;
  label: string;
  inputType: "text" | "email" | "tel" | "url" | "textarea" | "color" | "switch";
  placeholder?: string;
};

type SettingGroup = {
  group: string;
  description: string;
  fields: SettingField[];
};

const SETTINGS_SCHEMA: SettingGroup[] = [
  {
    group: "Site",
    description: "General information shown in browser metadata and footer content.",
    fields: [
      { key: "site.name.ar", label: "Site Name (Arabic)", inputType: "text", placeholder: "كيان للتدريب والاستشارات" },
      { key: "site.name.en", label: "Site Name (English)", inputType: "text", placeholder: "Kayan Training & Consulting" },
      { key: "site.tagline.ar", label: "Tagline (Arabic)", inputType: "text", placeholder: "نطوّر الفرق ونُسرّع الأثر المؤسسي" },
      { key: "site.tagline.en", label: "Tagline (English)", inputType: "text", placeholder: "Build teams and accelerate impact" },
      { key: "site.description.ar", label: "Description (Arabic)", inputType: "textarea", placeholder: "وصف مختصر للموقع لتحسين الظهور في محركات البحث..." },
      { key: "site.description.en", label: "Description (English)", inputType: "textarea", placeholder: "A brief description of your organization for SEO..." },
      { key: "footer.showAnimatedCategoryIcons", label: "Show animated category icons in footer", inputType: "switch" },
    ],
  },
  {
    group: "Contact",
    description: "Contact details used in footers, forms, and structured data.",
    fields: [
      { key: "contact.email", label: "Email", inputType: "email", placeholder: "hello@example.com" },
      { key: "contact.phone", label: "Phone", inputType: "tel", placeholder: "+968 1234 5678" },
      { key: "contact.address.en", label: "Address (English)", inputType: "textarea", placeholder: "123 Main Street, Muscat, Oman" },
      { key: "contact.address.ar", label: "Address (Arabic)", inputType: "textarea", placeholder: "مسقط، سلطنة عُمان" },
    ],
  },
  {
    group: "Frontend Theme",
    description:
      "Optional color overrides for frontend dark mode tones. These override CSS variables only and can be reset anytime.",
    fields: [
      { key: "frontend.theme.background", label: "Background", inputType: "color" },
      { key: "frontend.theme.foreground", label: "Foreground Text", inputType: "color" },
      { key: "frontend.theme.card", label: "Card Surface", inputType: "color" },
      { key: "frontend.theme.muted", label: "Muted Surface", inputType: "color" },
      { key: "frontend.theme.mutedForeground", label: "Muted Text", inputType: "color" },
      { key: "frontend.theme.border", label: "Border", inputType: "color" },
      { key: "frontend.theme.accent", label: "Accent Surface", inputType: "color" },
      { key: "frontend.theme.surface", label: "Primary Surface", inputType: "color" },
      { key: "frontend.theme.surfaceDim", label: "Dim Surface", inputType: "color" },
      { key: "frontend.theme.surfaceContainerLowest", label: "Surface Container Lowest", inputType: "color" },
      { key: "frontend.theme.surfaceContainerLow", label: "Surface Container Low", inputType: "color" },
    ],
  },
  {
    group: "Auth Page",
    description: "Controls for the visual/text content shown beside login/register.",
    fields: [
      { key: "auth.side.imageUrl", label: "Side Image", inputType: "url", placeholder: "Browse media library or paste URL" },
      { key: "auth.side.heading.ar", label: "Heading (Arabic)", inputType: "text", placeholder: "بوابتك نحو التطوير المهني" },
      { key: "auth.side.heading.en", label: "Heading (English)", inputType: "text", placeholder: "Your Gateway to Professional Growth" },
      { key: "auth.side.description.ar", label: "Description (Arabic)", inputType: "textarea", placeholder: "سجّل دخولك لتتابع فعالياتك..." },
      { key: "auth.side.description.en", label: "Description (English)", inputType: "textarea", placeholder: "Log in to track your registered events..." },
    ],
  },
];

const FRONTEND_THEME_DEFAULTS: Record<string, string> = {
  "frontend.theme.background": "#121414",
  "frontend.theme.foreground": "#e2e2e2",
  "frontend.theme.card": "#1a1c1c",
  "frontend.theme.muted": "#1e2020",
  "frontend.theme.mutedForeground": "#8b9295",
  "frontend.theme.border": "#41484a",
  "frontend.theme.accent": "#1e2020",
  "frontend.theme.surface": "#121414",
  "frontend.theme.surfaceDim": "#0d0f0f",
  "frontend.theme.surfaceContainerLowest": "#0d0f0f",
  "frontend.theme.surfaceContainerLow": "#1a1c1c",
};

const FRONTEND_THEME_PRESETS: Record<"default" | "lighterDark" | "midnightGray", Record<string, string>> = {
  default: FRONTEND_THEME_DEFAULTS,
  lighterDark: {
    "frontend.theme.background": "#262b2d",
    "frontend.theme.foreground": "#f2f6f8",
    "frontend.theme.card": "#343b3e",
    "frontend.theme.muted": "#3b4346",
    "frontend.theme.mutedForeground": "#c7d1d6",
    "frontend.theme.border": "#748188",
    "frontend.theme.accent": "#434d51",
    "frontend.theme.surface": "#2a3032",
    "frontend.theme.surfaceDim": "#22282a",
    "frontend.theme.surfaceContainerLowest": "#1f2527",
    "frontend.theme.surfaceContainerLow": "#31383b",
  },
  midnightGray: {
    "frontend.theme.background": "#171b1d",
    "frontend.theme.foreground": "#e6ebee",
    "frontend.theme.card": "#22282b",
    "frontend.theme.muted": "#293033",
    "frontend.theme.mutedForeground": "#a8b2b8",
    "frontend.theme.border": "#566168",
    "frontend.theme.accent": "#2f373b",
    "frontend.theme.surface": "#1b2022",
    "frontend.theme.surfaceDim": "#14181a",
    "frontend.theme.surfaceContainerLowest": "#121618",
    "frontend.theme.surfaceContainerLow": "#20262a",
  },
};

const inputCls =
  "h-10 w-full rounded-md border border-border/70 bg-card px-3 text-sm text-foreground " +
  "placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors";

const labelCls = "mb-1.5 block text-xs font-medium text-muted-foreground";

function ThemeLivePreview({
  locale,
  values,
}: {
  locale: "ar" | "en";
  values: Record<string, string>;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const vars = useMemo(
    () => ({
      "--background": values["frontend.theme.background"] || FRONTEND_THEME_DEFAULTS["frontend.theme.background"],
      "--foreground": values["frontend.theme.foreground"] || FRONTEND_THEME_DEFAULTS["frontend.theme.foreground"],
      "--card": values["frontend.theme.card"] || FRONTEND_THEME_DEFAULTS["frontend.theme.card"],
      "--muted": values["frontend.theme.muted"] || FRONTEND_THEME_DEFAULTS["frontend.theme.muted"],
      "--muted-foreground":
        values["frontend.theme.mutedForeground"] || FRONTEND_THEME_DEFAULTS["frontend.theme.mutedForeground"],
      "--border": values["frontend.theme.border"] || FRONTEND_THEME_DEFAULTS["frontend.theme.border"],
      "--input": values["frontend.theme.border"] || FRONTEND_THEME_DEFAULTS["frontend.theme.border"],
      "--color-surface": values["frontend.theme.surface"] || FRONTEND_THEME_DEFAULTS["frontend.theme.surface"],
      "--color-surface-dim":
        values["frontend.theme.surfaceDim"] || FRONTEND_THEME_DEFAULTS["frontend.theme.surfaceDim"],
      "--color-surface-container-lowest":
        values["frontend.theme.surfaceContainerLowest"] || FRONTEND_THEME_DEFAULTS["frontend.theme.surfaceContainerLowest"],
      "--color-surface-container-low":
        values["frontend.theme.surfaceContainerLow"] || FRONTEND_THEME_DEFAULTS["frontend.theme.surfaceContainerLow"],
      "--color-surface-container":
        values["frontend.theme.muted"] || FRONTEND_THEME_DEFAULTS["frontend.theme.muted"],
      "--color-surface-container-high":
        values["frontend.theme.card"] || FRONTEND_THEME_DEFAULTS["frontend.theme.card"],
      "--color-surface-container-highest":
        values["frontend.theme.card"] || FRONTEND_THEME_DEFAULTS["frontend.theme.card"],
      "--card-foreground":
        values["frontend.theme.foreground"] || FRONTEND_THEME_DEFAULTS["frontend.theme.foreground"],
      "--popover":
        values["frontend.theme.card"] || FRONTEND_THEME_DEFAULTS["frontend.theme.card"],
      "--popover-foreground":
        values["frontend.theme.foreground"] || FRONTEND_THEME_DEFAULTS["frontend.theme.foreground"],
      "--accent":
        values["frontend.theme.accent"] || FRONTEND_THEME_DEFAULTS["frontend.theme.accent"],
      "--accent-foreground":
        values["frontend.theme.foreground"] || FRONTEND_THEME_DEFAULTS["frontend.theme.foreground"],
    }),
    [values],
  );

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const applyVars = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const root = doc.documentElement as HTMLElement | null;
      const shell = doc.querySelector(".frontend-shell") as HTMLElement | null;
      const targets = [root, shell].filter(Boolean) as HTMLElement[];
      if (targets.length === 0) return;
      for (const target of targets) {
        Object.entries(vars).forEach(([k, v]) => target.style.setProperty(k, v));
      }
    };
    let raf = 0;
    let attempts = 0;
    const pump = () => {
      applyVars();
      attempts += 1;
      if (attempts < 120) raf = requestAnimationFrame(pump);
    };
    iframe.addEventListener("load", applyVars);
    pump();
    return () => {
      iframe.removeEventListener("load", applyVars);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [vars]);

  return (
    <div className="sm:col-span-2 rounded-xl border border-border/60 bg-muted/20 p-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Live Frontend Preview
      </p>
      <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
        <iframe
          ref={iframeRef}
          className="h-[420px] w-full"
          src={`/${locale}`}
          title="Frontend theme preview"
        />
      </div>
    </div>
  );
}

function SettingGroupCard({
  group,
  initialValues,
  locale,
  onDirtyChange,
}: {
  group: SettingGroup;
  initialValues: Record<string, string>;
  locale: "ar" | "en";
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(group.fields.map((f) => [f.key, initialValues[f.key] ?? ""])),
  );
  const isFrontendThemeGroup = group.group === "Frontend Theme";

  const isDirty = useMemo(
    () =>
      group.fields.some((f) => (values[f.key] ?? "") !== (initialValues[f.key] ?? "")),
    [group.fields, initialValues, values],
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  function set(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const entries = group.fields.map((f) => ({ key: f.key, value: values[f.key] ?? "" }));
      const result = await upsertSettings(entries);
      if (result.error) toast.error(result.error);
      else toast.success(`${group.group} settings saved.`);
    });
  }

  function handleResetThemeDefaults() {
    if (!isFrontendThemeGroup) return;
    setValues((prev) => ({ ...prev, ...FRONTEND_THEME_PRESETS.default }));
    startTransition(async () => {
      const entries = Object.entries(FRONTEND_THEME_PRESETS.default).map(([key, value]) => ({ key, value }));
      const result = await upsertSettings(entries);
      if (result.error) toast.error(result.error);
      else toast.success("Frontend theme reset to defaults.");
    });
  }

  function applyThemePreset(preset: "default" | "lighterDark" | "midnightGray") {
    if (!isFrontendThemeGroup) return;
    const payload = FRONTEND_THEME_PRESETS[preset];
    setValues((prev) => ({ ...prev, ...payload }));
    if (preset === "lighterDark") toast.success("Lighter Dark preset selected. Click Save Frontend Theme to apply.");
    else if (preset === "midnightGray") toast.success("Midnight Gray preset selected. Click Save Frontend Theme to apply.");
    else toast.success("Default preset selected. Click Save Frontend Theme to apply.");
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <div className="border-b border-border/50 bg-muted/20 px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">{group.group}</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{group.description}</p>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        {isFrontendThemeGroup ? <ThemeLivePreview locale={locale} values={values} /> : null}
        {isFrontendThemeGroup ? (
          <div className="sm:col-span-2 flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="mr-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Presets</p>
            <button
              className="inline-flex h-8 items-center rounded-md border border-border/70 bg-card px-3 text-xs font-medium hover:bg-muted"
              disabled={isPending}
              type="button"
              onClick={() => applyThemePreset("lighterDark")}
            >
              Lighter Dark
            </button>
            <button
              className="inline-flex h-8 items-center rounded-md border border-border/70 bg-card px-3 text-xs font-medium hover:bg-muted"
              disabled={isPending}
              type="button"
              onClick={() => applyThemePreset("midnightGray")}
            >
              Midnight Gray
            </button>
            <button
              className="inline-flex h-8 items-center rounded-md border border-border/70 bg-card px-3 text-xs font-medium hover:bg-muted"
              disabled={isPending}
              type="button"
              onClick={() => applyThemePreset("default")}
            >
              Current Default
            </button>
          </div>
        ) : null}
        {group.fields.map((field) => (
          <div key={field.key} className={cn(field.inputType === "textarea" && "sm:col-span-2")}>
            <label className={labelCls} htmlFor={field.key}>
              {field.label}
            </label>
            {field.key === "auth.side.imageUrl" ? (
              <ImagePickerField
                fetchMedia={fetchSettingsMediaAction}
                value={values[field.key] ?? ""}
                onChange={(next) => set(field.key, next)}
              />
            ) : field.inputType === "textarea" ? (
              <textarea
                className={cn(inputCls, "h-20 resize-none py-2")}
                id={field.key}
                name={field.key}
                placeholder={field.placeholder}
                title={field.label}
                value={values[field.key] ?? ""}
                onChange={(e) => set(field.key, e.target.value)}
              />
            ) : field.inputType === "color" ? (
              <div className="flex items-center gap-2">
                <input
                  className="h-10 w-14 cursor-pointer rounded-md border border-border/70 bg-card p-1"
                  id={field.key}
                  name={field.key}
                  title={field.label}
                  type="color"
                  value={values[field.key] || FRONTEND_THEME_DEFAULTS[field.key] || "#000000"}
                  onChange={(e) => set(field.key, e.target.value)}
                />
                <input
                  className={inputCls}
                  id={`${field.key}-text`}
                  name={`${field.key}-text`}
                  placeholder="#121414"
                  title={`${field.label} (hex)`}
                  value={values[field.key] ?? ""}
                  onChange={(e) => set(field.key, e.target.value)}
                />
              </div>
            ) : field.inputType === "switch" ? (
              <button
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
                  values[field.key] === "1" ? "bg-primary" : "bg-muted",
                )}
                id={field.key}
                name={field.key}
                aria-checked={values[field.key] === "1" ? "true" : "false"}
                role="switch"
                title={field.label}
                type="button"
                onClick={() => set(field.key, values[field.key] === "1" ? "0" : "1")}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200",
                    values[field.key] === "1" ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
            ) : (
              <input
                className={inputCls}
                id={field.key}
                name={field.key}
                placeholder={field.placeholder}
                title={field.label}
                type={field.inputType}
                value={values[field.key] ?? ""}
                onChange={(e) => set(field.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end border-t border-border/50 px-5 py-3">
        {isFrontendThemeGroup ? (
          <button
            className="mr-auto inline-flex h-9 items-center rounded-md border border-border/70 bg-card px-4 text-xs font-medium uppercase tracking-widest text-foreground hover:bg-muted disabled:opacity-50"
            disabled={isPending}
            type="button"
            onClick={handleResetThemeDefaults}
          >
            Reset Theme Defaults
          </button>
        ) : null}
        <button
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-xs font-medium uppercase tracking-widest text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          disabled={isPending}
          type="button"
          onClick={handleSave}
        >
          {isPending ? "Saving…" : `Save ${group.group}`}
        </button>
      </div>
    </div>
  );
}

type SocialLinkItem = {
  platform: SocialPlatformKey;
  url: string;
};

function SocialLinksCard({
  initialValues,
  onDirtyChange,
}: {
  initialValues: Record<string, string>;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const initialLinks = useMemo(() => {
    const raw = initialValues["social.links"] ?? "";
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SocialLinkItem[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    const fallback: SocialLinkItem[] = [];
    if (initialValues["social.linkedin"]) fallback.push({ platform: "linkedin", url: initialValues["social.linkedin"] });
    if (initialValues["social.twitter"]) fallback.push({ platform: "x", url: initialValues["social.twitter"] });
    if (initialValues["social.instagram"]) fallback.push({ platform: "instagram", url: initialValues["social.instagram"] });
    if (initialValues["social.youtube"]) fallback.push({ platform: "youtube", url: initialValues["social.youtube"] });
    return fallback;
  }, [initialValues]);
  const [links, setLinks] = useState<SocialLinkItem[]>(initialLinks.length ? initialLinks : [{ platform: "linkedin", url: "" }]);

  const isDirty = useMemo(
    () => JSON.stringify(links) !== JSON.stringify(initialLinks),
    [initialLinks, links],
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  function updateLink(index: number, partial: Partial<SocialLinkItem>) {
    setLinks((prev) => prev.map((item, i) => (i === index ? { ...item, ...partial } : item)));
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function addLink() {
    setLinks((prev) => [...prev, { platform: "facebook", url: "" }]);
  }

  function handleSave() {
    const clean = links.filter((item) => item.url.trim());
    startTransition(async () => {
      const result = await upsertSettings([{ key: "social.links", value: JSON.stringify(clean) }]);
      if (result.error) toast.error(result.error);
      else toast.success("Social settings saved.");
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <div className="border-b border-border/50 bg-muted/20 px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">Social</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Manage social platforms with icon-aware rendering in footer and other frontend sections.
        </p>
      </div>
      <div className="space-y-3 p-5">
        {links.map((item, index) => {
          const option = SOCIAL_PLATFORM_OPTIONS.find((opt) => opt.value === item.platform);
          return (
            <div className="grid gap-2 sm:grid-cols-[220px_minmax(0,1fr)_36px]" key={`${item.platform}-${index}`}>
              <Select
                value={item.platform}
                onValueChange={(value) => updateLink(index, { platform: value as SocialPlatformKey })}
              >
                <SelectTrigger className="!h-10 w-full text-xs">
                  <span>{option?.label ?? "Platform"}</span>
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORM_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="h-10"
                placeholder="https://..."
                value={item.url}
                onChange={(e) => updateLink(index, { url: e.target.value })}
              />
              <button
                className="inline-flex h-10 items-center justify-center rounded-md border border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Remove link"
                type="button"
                onClick={() => removeLink(index)}
              >
                <HugeiconsIcon icon={Remove01Icon} size={16} strokeWidth={2} />
              </button>
            </div>
          );
        })}
        <button
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border/70 bg-card px-3 text-xs font-medium hover:bg-muted"
          type="button"
          onClick={addLink}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={2} />
          Add More
        </button>
      </div>
      <div className="flex justify-end border-t border-border/50 px-5 py-3">
        <button
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-xs font-medium uppercase tracking-widest text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          disabled={isPending}
          type="button"
          onClick={handleSave}
        >
          {isPending ? "Saving…" : "Save Social"}
        </button>
      </div>
    </div>
  );
}

export function SettingsForm({
  initialValues,
  locale,
}: {
  initialValues: Record<string, string>;
  locale: "ar" | "en";
}) {
  const tabs = [
    { id: "siteMode", label: "Site Mode" },
    { id: "Site", label: "Site" },
    { id: "Contact", label: "Contact" },
    { id: "Social", label: "Social" },
    { id: "Frontend Theme", label: "Frontend Theme" },
    { id: "Auth Page", label: "Auth Page" },
  ] as const;
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("siteMode");
  const [dirtyTabs, setDirtyTabs] = useState<Record<string, boolean>>({});

  const markDirty = useCallback((tabId: string, dirty: boolean) => {
    setDirtyTabs((prev) => {
      if (prev[tabId] === dirty) return prev;
      return { ...prev, [tabId]: dirty };
    });
  }, []);

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="h-fit rounded-xl border border-border/70 bg-card p-2 lg:sticky lg:top-20">
        <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Settings Sections
        </p>
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span>{tab.label}</span>
              {dirtyTabs[tab.id] ? (
                <span className="size-2 rounded-full bg-primary" />
              ) : null}
            </button>
          ))}
        </nav>
      </aside>
      <div className="space-y-5">
        {activeTab === "siteMode" ? <MaintenanceModeCard initialOn={initialValues["site.maintenance"] === "1"} /> : null}
        {activeTab === "Social" ? (
          <SocialLinksCard initialValues={initialValues} onDirtyChange={(dirty) => markDirty("Social", dirty)} />
        ) : null}
        {SETTINGS_SCHEMA.filter((group) => group.group === activeTab).map((group) => (
          <SettingGroupCard
            group={group}
            initialValues={initialValues}
            key={group.group}
            locale={locale}
            onDirtyChange={(dirty) => markDirty(group.group, dirty)}
          />
        ))}
      </div>
    </div>
  );
}
