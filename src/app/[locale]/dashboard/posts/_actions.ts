"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import type { PostFormValues } from "./_components/post-form";

export async function fetchMediaAction(): Promise<{ id: string; originalName: string; url: string; mimeType: string }[]> {
  const items = await db.media.findMany({
    where: { mimeType: { startsWith: "image/" } },
    orderBy: { createdAt: "desc" },
    select: { id: true, originalName: true, url: true, mimeType: true },
  });
  return items;
}

export async function updatePostAction(
  id: string,
  locale: string,
  values: PostFormValues,
): Promise<{ error?: string }> {
  try {
    await db.post.update({
      where: { id },
      data: {
        slug: values.slug,
        status: values.status,
        publishedAt: values.status === "published" ? (values.publishedAt ? new Date(values.publishedAt) : new Date()) : null,
        featuredImageId: values.featuredImageId || null,
      },
    });

    await db.postTranslation.upsert({
      where: { postId_locale: { postId: id, locale: "en" } },
      create: {
        postId: id,
        locale: "en",
        title: values.titleEn,
        excerpt: values.excerptEn || null,
        content: values.contentEn ? { html: values.contentEn, type: "html" } : undefined,
        seoTitle: values.seoTitleEn || null,
        seoDescription: values.seoDescriptionEn || null,
      },
      update: {
        title: values.titleEn,
        excerpt: values.excerptEn || null,
        content: values.contentEn ? { html: values.contentEn, type: "html" } : undefined,
        seoTitle: values.seoTitleEn || null,
        seoDescription: values.seoDescriptionEn || null,
      },
    });

    await db.postTranslation.upsert({
      where: { postId_locale: { postId: id, locale: "ar" } },
      create: {
        postId: id,
        locale: "ar",
        title: values.titleAr,
        excerpt: values.excerptAr || null,
        content: values.contentAr ? { html: values.contentAr, type: "html" } : undefined,
        seoTitle: values.seoTitleAr || null,
        seoDescription: values.seoDescriptionAr || null,
      },
      update: {
        title: values.titleAr,
        excerpt: values.excerptAr || null,
        content: values.contentAr ? { html: values.contentAr, type: "html" } : undefined,
        seoTitle: values.seoTitleAr || null,
        seoDescription: values.seoDescriptionAr || null,
      },
    });

    await db.postCategory.deleteMany({ where: { postId: id } });
    if (values.categories.length > 0) {
      await db.postCategory.createMany({
        data: values.categories.map((categoryId) => ({ postId: id, categoryId })),
      });
    }

    revalidatePath(`/${locale}/dashboard/posts`);
    revalidatePath(`/${locale}/dashboard/blog`);
    revalidatePath(`/${locale}/blog/${values.slug}`);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save post" };
  }
}

export async function createPostAction(
  authorId: string,
  locale: string,
  values: PostFormValues,
): Promise<{ error?: string }> {
  let createdId: string;
  try {
    const created = await db.post.create({
      data: {
        slug: values.slug,
        status: values.status,
        authorId,
        publishedAt: values.status === "published" ? (values.publishedAt ? new Date(values.publishedAt) : new Date()) : null,
        featuredImageId: values.featuredImageId || null,
        translations: {
          create: [
            {
              locale: "en",
              title: values.titleEn,
              excerpt: values.excerptEn || null,
              content: values.contentEn ? { html: values.contentEn, type: "html" } : undefined,
              seoTitle: values.seoTitleEn || null,
              seoDescription: values.seoDescriptionEn || null,
            },
            {
              locale: "ar",
              title: values.titleAr,
              excerpt: values.excerptAr || null,
              content: values.contentAr ? { html: values.contentAr, type: "html" } : undefined,
              seoTitle: values.seoTitleAr || null,
              seoDescription: values.seoDescriptionAr || null,
            },
          ],
        },
        categories:
          values.categories.length > 0
            ? { create: values.categories.map((categoryId) => ({ categoryId })) }
            : undefined,
      },
    });
    createdId = created.id;
    revalidatePath(`/${locale}/dashboard/posts`);
    revalidatePath(`/${locale}/dashboard/blog`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create post" };
  }
  redirect(`/${locale}/dashboard/blog/${createdId}`);
}
