import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { PostForm } from "../_components/post-form";
import { fetchMediaAction, updatePostAction } from "../_actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const post = await db.post.findUnique({
    where: { id },
    include: { translations: { where: { locale: "en" } } },
  });
  const title = post?.translations[0]?.title ?? "Edit Post";
  return { title: `${title} — Posts` };
}

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const [post, categories] = await Promise.all([
    db.post.findUnique({
      where: { id },
      include: {
        translations: true,
        categories: true,
        featuredImage: true,
      },
    }),
    db.category.findMany({
      include: { translations: true },
      orderBy: { slug: "asc" },
    }),
  ]);

  if (!post) notFound();

  const trEn = post.translations.find((t) => t.locale === "en");
  const trAr = post.translations.find((t) => t.locale === "ar");

  function extractHtml(value: unknown): string {
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && "html" in value) {
      const h = (value as { html: unknown }).html;
      if (typeof h === "string") return h;
    }
    return "";
  }

  const defaultValues = {
    categories: post.categories.map((c) => c.categoryId),
    contentAr: extractHtml(trAr?.content),
    contentEn: extractHtml(trEn?.content),
    excerptAr: trAr?.excerpt ?? "",
    excerptEn: trEn?.excerpt ?? "",
    featuredImageId: post.featuredImageId ?? "",
    publishedAt: post.publishedAt ? post.publishedAt.toISOString().slice(0, 16) : "",
    seoDescriptionAr: trAr?.seoDescription ?? "",
    seoDescriptionEn: trEn?.seoDescription ?? "",
    seoTitleAr: trAr?.seoTitle ?? "",
    seoTitleEn: trEn?.seoTitle ?? "",
    slug: post.slug,
    status: post.status as "draft" | "published" | "archived",
    titleAr: trAr?.title ?? "",
    titleEn: trEn?.title ?? "",
  };

  const categoryOptions = categories.map((cat) => {
    const tr = cat.translations.find((t) => t.locale === activeLocale) ?? cat.translations[0];
    return { label: tr?.name ?? cat.slug, value: cat.id };
  });

  const onSubmit = updatePostAction.bind(null, id, activeLocale);

  return (
    <PostForm
      categoryOptions={categoryOptions}
      defaultValues={defaultValues}
      fetchMedia={fetchMediaAction}
      featuredImageUrl={post.featuredImage?.url}
      locale={activeLocale}
      onSubmit={onSubmit}
      postId={id}
      submitLabel="Save Changes"
    />
  );
}
