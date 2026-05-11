"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { isSystemPage } from "@/lib/pages/block-types";

export async function fetchMediaAction(): Promise<{ id: string; originalName: string; url: string; mimeType: string }[]> {
  const items = await db.media.findMany({
    select: { id: true, originalName: true, url: true, mimeType: true },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  return items.map((m) => ({ id: m.id, originalName: m.originalName, url: m.url, mimeType: m.mimeType }));
}

export async function fetchMediaPageAction(
  page = 1,
  pageSize = 24,
): Promise<{
  items: { id: string; originalName: string; url: string; mimeType: string }[];
  page: number;
  totalPages: number;
  total: number;
}> {
  const safePageSize = Math.max(1, Math.min(60, pageSize));
  const safePage = Math.max(1, page);
  const total = await db.media.count();
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const currentPage = Math.min(safePage, totalPages);
  const items = await db.media.findMany({
    select: { id: true, originalName: true, url: true, mimeType: true },
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * safePageSize,
    take: safePageSize,
  });
  return { items, page: currentPage, totalPages, total };
}

export async function updatePageAction(
  id: string,
  locale: string,
  values: {
    status: string;
    titleEn: string;
    titleAr: string;
    seoTitleEn: string;
    seoTitleAr: string;
    seoDescriptionEn: string;
    seoDescriptionAr: string;
    blocksEn: unknown;
    blocksAr: unknown;
  },
): Promise<{ error?: string }> {
  try {
    await db.page.update({ where: { id }, data: { status: values.status } });

    await db.pageTranslation.upsert({
      where: { pageId_locale: { pageId: id, locale: "en" } },
      create: {
        pageId: id,
        locale: "en",
        title: values.titleEn,
        seoTitle: values.seoTitleEn || null,
        seoDescription: values.seoDescriptionEn || null,
        blocks: values.blocksEn ?? undefined,
      },
      update: {
        title: values.titleEn,
        seoTitle: values.seoTitleEn || null,
        seoDescription: values.seoDescriptionEn || null,
        blocks: values.blocksEn ?? undefined,
      },
    });

    await db.pageTranslation.upsert({
      where: { pageId_locale: { pageId: id, locale: "ar" } },
      create: {
        pageId: id,
        locale: "ar",
        title: values.titleAr,
        seoTitle: values.seoTitleAr || null,
        seoDescription: values.seoDescriptionAr || null,
        blocks: values.blocksAr ?? undefined,
      },
      update: {
        title: values.titleAr,
        seoTitle: values.seoTitleAr || null,
        seoDescription: values.seoDescriptionAr || null,
        blocks: values.blocksAr ?? undefined,
      },
    });

    revalidatePath(`/${locale}/dashboard/pages`);
    revalidatePath(`/${locale}`);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save page" };
  }
}

const NON_TRANSLATABLE_KEYS = new Set([
  "id",
  "url",
  "logo",
  "image",
  "icon",
  "slug",
  "kind",
  "style",
  "source",
  "buttonUrl",
  "ctaUrl",
  "linkUrl",
  "displayMode",
  "size",
  "type",
]);

function shouldTranslateString(key: string, value: string): boolean {
  if (!value.trim()) return false;
  if (NON_TRANSLATABLE_KEYS.has(key)) return false;
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(value.trim())) return false;
  if (/^#[0-9a-f]{3,8}$/i.test(value.trim())) return false;
  if (/^[A-Z0-9 _-]{2,}$/.test(value.trim())) return false;
  return true;
}

type StringRef = { key: string; path: Array<string | number>; value: string };

function collectTranslatableStrings(
  input: unknown,
  path: Array<string | number> = [],
  key = "",
): StringRef[] {
  if (typeof input === "string") {
    return shouldTranslateString(key, input) ? [{ key, path, value: input }] : [];
  }
  if (Array.isArray(input)) {
    return input.flatMap((item, index) =>
      collectTranslatableStrings(item, [...path, index], key),
    );
  }
  if (input && typeof input === "object") {
    return Object.entries(input).flatMap(([entryKey, entryValue]) =>
      collectTranslatableStrings(entryValue, [...path, entryKey], entryKey),
    );
  }
  return [];
}

function setAtPath(
  target: Record<string, unknown> | unknown[],
  path: Array<string | number>,
  value: string,
) {
  let cursor: unknown = target;
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];
    if (typeof key === "number" && Array.isArray(cursor)) {
      cursor = cursor[key];
    } else if (typeof key === "string" && cursor && typeof cursor === "object") {
      cursor = (cursor as Record<string, unknown>)[key];
    } else {
      return;
    }
  }
  const lastKey = path[path.length - 1];
  if (typeof lastKey === "number" && Array.isArray(cursor)) {
    cursor[lastKey] = value;
  } else if (
    typeof lastKey === "string" &&
    cursor &&
    typeof cursor === "object"
  ) {
    (cursor as Record<string, unknown>)[lastKey] = value;
  }
}

async function translateTexts(
  texts: string[],
  sourceLocale: "en" | "ar",
  targetLocale: "en" | "ar",
): Promise<string[]> {
  if (texts.length === 0) return [];
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const model = process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a professional website translator. Translate each text preserving meaning, tone, and formatting. Return only valid JSON.",
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction:
              sourceLocale === "en" && targetLocale === "ar"
                ? "Translate from English to Arabic"
                : "Translate from Arabic to English",
            texts,
            output_schema: { translations: ["same length array of translated strings"] },
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("Translation request failed.");
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = json.choices?.[0]?.message?.content ?? "";
  let parsed: { translations?: unknown } = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Translation response was not valid JSON.");
  }
  if (!Array.isArray(parsed.translations)) {
    throw new Error("Translation response missing translations array.");
  }
  const translated = parsed.translations.map((item) =>
    typeof item === "string" ? item : "",
  );
  if (translated.length !== texts.length) {
    throw new Error("Translation response length mismatch.");
  }
  return translated;
}

export async function translateBlockAction(
  block: unknown,
  sourceLocale: "en" | "ar",
  targetLocale: "en" | "ar",
): Promise<{ block?: unknown; error?: string }> {
  try {
    const isEnabled =
      process.env.ENABLE_BLOCK_TRANSLATION === "1" &&
      process.env.NODE_ENV !== "production";
    if (!isEnabled) {
      return { error: "Block translation is disabled in this environment." };
    }
    const cloned = JSON.parse(JSON.stringify(block)) as Record<string, unknown>;
    const refs = collectTranslatableStrings(cloned);
    if (refs.length === 0) return { block: cloned };
    const translated = await translateTexts(
      refs.map((ref) => ref.value),
      sourceLocale,
      targetLocale,
    );
    refs.forEach((ref, index) => {
      setAtPath(cloned, ref.path, translated[index] ?? ref.value);
    });
    return { block: cloned };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to translate block.",
    };
  }
}

export async function createPageAction(locale: string, formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "").trim();
  const titleEn = String(formData.get("titleEn") ?? "").trim();
  const titleAr = String(formData.get("titleAr") ?? "").trim();
  if (!slug || !titleEn || !titleAr) return;
  await db.page.create({
    data: {
      slug,
      status: "draft",
      translations: {
        create: [
          { locale: "en", title: titleEn },
          { locale: "ar", title: titleAr },
        ],
      },
    },
  });
  revalidatePath(`/${locale}/dashboard/pages`);
  redirect(`/${locale}/dashboard/pages/${slug}`);
}

export async function deletePageAction(locale: string, id: string): Promise<{ error?: string }> {
  try {
    const page = await db.page.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });

    if (!page) return { error: "Page not found" };
    if (isSystemPage(page.slug)) return { error: "System pages cannot be deleted" };

    await db.page.delete({ where: { id: page.id } });

    revalidatePath(`/${locale}/dashboard/pages`);
    revalidatePath(`/${locale}/${page.slug}`);
    return {};
  } catch {
    return { error: "Failed to delete page" };
  }
}
