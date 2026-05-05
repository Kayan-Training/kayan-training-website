import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { PostForm } from "../_components/post-form";
import { createPostAction, fetchMediaAction } from "../_actions";

export const metadata = { title: "New Post — Posts" };

export default async function NewPostPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect(`/${activeLocale}/dashboard`);

  const categories = await db.category.findMany({
    include: { translations: true },
    orderBy: { slug: "asc" },
  });

  const categoryOptions = categories.map((cat) => {
    const tr = cat.translations.find((t) => t.locale === activeLocale) ?? cat.translations[0];
    return { label: tr?.name ?? cat.slug, value: cat.id };
  });

  const onSubmit = createPostAction.bind(null, session.user.id, activeLocale);

  return (
    <PostForm
      categoryOptions={categoryOptions}
      fetchMedia={fetchMediaAction}
      locale={activeLocale}
      onSubmit={onSubmit}
      submitLabel="Create Post"
    />
  );
}
