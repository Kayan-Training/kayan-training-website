"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { upsertSettings } from "../_actions";

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
          When maintenance mode is on, all public pages show a placeholder. Dashboard remains accessible.
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
  inputType: "text" | "email" | "tel" | "url" | "textarea";
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
    description: "General information shown in the browser and search results.",
    fields: [
      { key: "site.name", label: "Site Name", inputType: "text", placeholder: "Kayan Training" },
      { key: "site.tagline", label: "Tagline", inputType: "text", placeholder: "Elevate your potential" },
      { key: "site.description", label: "Description", inputType: "textarea", placeholder: "A brief description of your organization for SEO…" },
    ],
  },
  {
    group: "Contact",
    description: "Contact details used in footers, forms, and structured data.",
    fields: [
      { key: "contact.email", label: "Email", inputType: "email", placeholder: "hello@example.com" },
      { key: "contact.phone", label: "Phone", inputType: "tel", placeholder: "+968 1234 5678" },
      { key: "contact.address", label: "Address", inputType: "textarea", placeholder: "123 Main Street, Muscat, Oman" },
    ],
  },
  {
    group: "Social",
    description: "Social media profile URLs for links and meta tags.",
    fields: [
      { key: "social.linkedin", label: "LinkedIn", inputType: "url", placeholder: "https://linkedin.com/company/…" },
      { key: "social.twitter", label: "X / Twitter", inputType: "url", placeholder: "https://x.com/…" },
      { key: "social.instagram", label: "Instagram", inputType: "url", placeholder: "https://instagram.com/…" },
      { key: "social.youtube", label: "YouTube", inputType: "url", placeholder: "https://youtube.com/@…" },
    ],
  },
];

const inputCls =
  "h-10 w-full rounded-md border border-border/70 bg-card px-3 text-sm text-foreground " +
  "placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors";

const labelCls = "mb-1.5 block text-xs font-medium text-muted-foreground";

function SettingGroupCard({
  group,
  initialValues,
}: {
  group: SettingGroup;
  initialValues: Record<string, string>;
}) {
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(group.fields.map((f) => [f.key, initialValues[f.key] ?? ""])),
  );

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

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <div className="border-b border-border/50 bg-muted/20 px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">{group.group}</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{group.description}</p>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        {group.fields.map((field) => (
          <div
            key={field.key}
            className={cn(field.inputType === "textarea" && "sm:col-span-2")}
          >
            <label className={labelCls} htmlFor={field.key}>
              {field.label}
            </label>
            {field.inputType === "textarea" ? (
              <textarea
                className={cn(inputCls, "h-20 resize-none py-2")}
                id={field.key}
                name={field.key}
                placeholder={field.placeholder}
                title={field.label}
                value={values[field.key] ?? ""}
                onChange={(e) => set(field.key, e.target.value)}
              />
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

export function SettingsForm({ initialValues }: { initialValues: Record<string, string> }) {
  return (
    <div className="space-y-5">
      <MaintenanceModeCard initialOn={initialValues["site.maintenance"] === "1"} />
      {SETTINGS_SCHEMA.map((group) => (
        <SettingGroupCard group={group} initialValues={initialValues} key={group.group} />
      ))}
    </div>
  );
}
