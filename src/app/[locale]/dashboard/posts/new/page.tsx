import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { isSupportedLocale } from "@/lib/i18n/config";

export default async function NewPostPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  async function createPost(formData: FormData) {
    "use server";
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return;

    const slug = String(formData.get("slug") ?? "").trim();
    const titleEn = String(formData.get("titleEn") ?? "").trim();
    const titleAr = String(formData.get("titleAr") ?? "").trim();
    if (!slug || !titleEn || !titleAr) return;

    const created = await db.post.create({
      data: {
        authorId: session.user.id,
        slug,
        status: String(formData.get("status") ?? "draft"),
        translations: {
          create: [
            { locale: "en", title: titleEn, excerpt: String(formData.get("excerptEn") ?? "") || null },
            { locale: "ar", title: titleAr, excerpt: String(formData.get("excerptAr") ?? "") || null },
          ],
        },
      },
    });
    revalidatePath(`/${activeLocale}/dashboard/posts`);
    redirect(`/${activeLocale}/dashboard/posts/${created.id}`);
  }

  return (
    <section className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-semibold">Create Post</h1>
      <form action={createPost} className="space-y-4 rounded-xl border border-border/70 bg-card p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <input className="h-10 rounded-md border border-input bg-background px-3" name="titleEn" placeholder="Title (EN)" required />
          <input className="h-10 rounded-md border border-input bg-background px-3" name="titleAr" placeholder="Title (AR)" required />
          <input className="h-10 rounded-md border border-input bg-background px-3 md:col-span-2" name="slug" placeholder="Slug" required />
          <input className="h-10 rounded-md border border-input bg-background px-3 md:col-span-2" name="excerptEn" placeholder="Excerpt (EN)" />
          <input className="h-10 rounded-md border border-input bg-background px-3 md:col-span-2" name="excerptAr" placeholder="Excerpt (AR)" />
        </div>
        <select className="h-10 rounded-md border border-input bg-background px-3" name="status" defaultValue="draft">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <button className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90" type="submit">
          Create Post
        </button>
      </form>
    </section>
  );
}
