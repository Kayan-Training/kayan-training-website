import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const post = await db.post.findUnique({
    where: { id },
    include: { translations: true },
  });
  if (!post) notFound();

  const trEn = post.translations.find((item) => item.locale === "en");
  const trAr = post.translations.find((item) => item.locale === "ar");

  async function updatePost(formData: FormData) {
    "use server";
    const slug = String(formData.get("slug") ?? "").trim();
    const titleEn = String(formData.get("titleEn") ?? "").trim();
    const titleAr = String(formData.get("titleAr") ?? "").trim();
    if (!slug || !titleEn || !titleAr) return;

    await db.post.update({
      where: { id },
      data: {
        slug,
        status: String(formData.get("status") ?? "draft"),
      },
    });

    await db.postTranslation.upsert({
      where: { postId_locale: { postId: id, locale: "en" } },
      create: { locale: "en", postId: id, title: titleEn, excerpt: String(formData.get("excerptEn") ?? "") || null },
      update: { title: titleEn, excerpt: String(formData.get("excerptEn") ?? "") || null },
    });
    await db.postTranslation.upsert({
      where: { postId_locale: { postId: id, locale: "ar" } },
      create: { locale: "ar", postId: id, title: titleAr, excerpt: String(formData.get("excerptAr") ?? "") || null },
      update: { title: titleAr, excerpt: String(formData.get("excerptAr") ?? "") || null },
    });

    revalidatePath(`/${activeLocale}/dashboard/posts`);
    revalidatePath(`/${activeLocale}/posts/${slug}`);
  }

  return (
    <section className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-semibold">Edit Post</h1>
      <form action={updatePost} className="space-y-4 rounded-xl border border-border/70 bg-card p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <input className="h-10 rounded-md border border-input bg-background px-3" defaultValue={trEn?.title ?? ""} name="titleEn" placeholder="Title (EN)" required />
          <input className="h-10 rounded-md border border-input bg-background px-3" defaultValue={trAr?.title ?? ""} name="titleAr" placeholder="Title (AR)" required />
          <input className="h-10 rounded-md border border-input bg-background px-3 md:col-span-2" defaultValue={post.slug} name="slug" placeholder="Slug" required />
          <input className="h-10 rounded-md border border-input bg-background px-3 md:col-span-2" defaultValue={trEn?.excerpt ?? ""} name="excerptEn" placeholder="Excerpt (EN)" />
          <input className="h-10 rounded-md border border-input bg-background px-3 md:col-span-2" defaultValue={trAr?.excerpt ?? ""} name="excerptAr" placeholder="Excerpt (AR)" />
        </div>
        <select className="h-10 rounded-md border border-input bg-background px-3" name="status" defaultValue={post.status}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <button className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90" type="submit">
          Save Changes
        </button>
      </form>
    </section>
  );
}
