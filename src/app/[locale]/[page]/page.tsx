import { notFound } from "next/navigation";

import { getStaticPageBySlug } from "@/lib/content/queries";
import { isSupportedLocale } from "@/lib/i18n/config";

function renderBlocks(blocks: unknown): string {
  if (!blocks) return "";
  if (typeof blocks === "string") return blocks;
  if (typeof blocks !== "object") return "";

  const record = blocks as { html?: unknown; content?: unknown };
  if (typeof record.html === "string") return record.html;
  if (Array.isArray(record.content)) {
    return record.content
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const node = item as { text?: unknown };
        return typeof node.text === "string" ? `<p>${node.text}</p>` : "";
      })
      .join("");
  }
  return "";
}

export default async function DynamicCmsPage({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}) {
  const { locale, page } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const data = await getStaticPageBySlug(activeLocale, page);

  if (!data) notFound();

  const html = renderBlocks(data.blocks);

  return (
    <main className="mx-auto w-full max-w-[1100px] px-6 py-14 md:px-10 md:py-18">
      <h1 className="mb-6 text-4xl font-semibold tracking-tight md:text-5xl">{data.title}</h1>
      {html ? (
        <article
          className="prose prose-neutral max-w-none [&_a]:text-primary hover:[&_a]:text-secondary"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <article className="rounded-lg border border-border/70 bg-card p-6 text-sm text-on-surface-variant">
          {activeLocale === "ar" ? "لا يوجد محتوى لهذه الصفحة حالياً." : "This page has no content yet."}
        </article>
      )}
    </main>
  );
}
