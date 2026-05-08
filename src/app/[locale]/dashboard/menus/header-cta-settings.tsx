"use client";

import { Save } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { LinkPickerInput, type LinkPickerEntities } from "@/components/ui/link-picker-input";

import { updateHeaderCta } from "./_actions";

const inputCls =
  "h-9 w-full rounded-md border border-border/70 bg-card px-3 text-sm text-foreground " +
  "placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors";

export function HeaderCtaSettings({
  entities,
  initialValue,
  locale,
}: {
  entities: LinkPickerEntities;
  initialValue: { labelAr: string; labelEn: string; url: string };
  locale: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [labelEn, setLabelEn] = useState(initialValue.labelEn);
  const [labelAr, setLabelAr] = useState(initialValue.labelAr);
  const [url, setUrl] = useState(initialValue.url);

  function handleSave() {
    startTransition(async () => {
      const result = await updateHeaderCta(locale, { labelAr, labelEn, url });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Header CTA updated.");
    });
  }

  const disabled = isPending || !labelEn.trim() || !labelAr.trim() || !url.trim();

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-foreground">Header CTA</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Manage the right-side header action button label and destination.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Label (EN)
          </label>
          <input
            className={inputCls}
            placeholder="View Events"
            title="Header CTA Label (English)"
            value={labelEn}
            onChange={(e) => setLabelEn(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Label (AR)
          </label>
          <input
            className={`${inputCls} text-right`}
            dir="rtl"
            placeholder="الفعاليات"
            title="Header CTA Label (Arabic)"
            value={labelAr}
            onChange={(e) => setLabelAr(e.target.value)}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            CTA URL
          </label>
          <LinkPickerInput
            dir="ltr"
            entities={entities}
            placeholder="/en/events"
            value={url}
            onChange={setUrl}
          />
        </div>
      </div>
      <Button
        className="mt-3 gap-1.5 text-xs uppercase tracking-widest"
        disabled={disabled}
        size="sm"
        type="button"
        onClick={handleSave}
      >
        <Save className="size-3.5" />
        {isPending ? "Saving..." : "Save CTA"}
      </Button>
    </div>
  );
}
