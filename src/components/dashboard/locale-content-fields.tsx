"use client";

/**
 * Locale-aware field editor: select locale and edit corresponding values.
 * Hidden inputs keep both locale values in form submission.
 */
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type LocaleValues = {
  titleEn?: string;
  titleAr?: string;
  shortEn?: string;
  shortAr?: string;
  contentEn?: string;
  contentAr?: string;
};

export function LocaleContentFields({
  initial,
  includeContent = false,
  includeShort = true,
}: {
  initial?: LocaleValues;
  includeContent?: boolean;
  includeShort?: boolean;
}) {
  const [activeLocale, setActiveLocale] = useState<"en" | "ar">("en");
  const [values, setValues] = useState<Required<LocaleValues>>({
    titleEn: initial?.titleEn ?? "",
    titleAr: initial?.titleAr ?? "",
    shortEn: initial?.shortEn ?? "",
    shortAr: initial?.shortAr ?? "",
    contentEn: initial?.contentEn ?? "",
    contentAr: initial?.contentAr ?? "",
  });

  const isEn = activeLocale === "en";

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <Label>Locale Content</Label>
        <Select
          onValueChange={(value) => {
            if (value === "en" || value === "ar") setActiveLocale(value);
          }}
          value={activeLocale}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select locale" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ar">Arabic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <input name="titleEn" type="hidden" value={values.titleEn} />
      <input name="titleAr" type="hidden" value={values.titleAr} />
      <input name="shortEn" type="hidden" value={values.shortEn} />
      <input name="shortAr" type="hidden" value={values.shortAr} />
      <input name="contentEn" type="hidden" value={values.contentEn} />
      <input name="contentAr" type="hidden" value={values.contentAr} />

      <div className="grid gap-2">
        <Label>{isEn ? "Title (EN)" : "Title (AR)"}</Label>
        <Input
          onChange={(event) =>
            setValues((prev) =>
              isEn
                ? { ...prev, titleEn: event.target.value }
                : { ...prev, titleAr: event.target.value },
            )
          }
          value={isEn ? values.titleEn : values.titleAr}
        />
      </div>

      {includeShort ? (
        <div className="grid gap-2">
          <Label>{isEn ? "Short Description (EN)" : "Short Description (AR)"}</Label>
          <Textarea
            onChange={(event) =>
              setValues((prev) =>
                isEn
                  ? { ...prev, shortEn: event.target.value }
                  : { ...prev, shortAr: event.target.value },
              )
            }
            rows={3}
            value={isEn ? values.shortEn : values.shortAr}
          />
        </div>
      ) : null}

      {includeContent ? (
        <div className="grid gap-2">
          <Label>{isEn ? "Content (EN)" : "Content (AR)"}</Label>
          <Textarea
            onChange={(event) =>
              setValues((prev) =>
                isEn
                  ? { ...prev, contentEn: event.target.value }
                  : { ...prev, contentAr: event.target.value },
              )
            }
            rows={8}
            value={isEn ? values.contentEn : values.contentAr}
          />
        </div>
      ) : null}
    </div>
  );
}
