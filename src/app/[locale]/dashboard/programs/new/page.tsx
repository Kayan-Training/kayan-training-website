import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { createEventAction, fetchGalleryMediaAction, fetchMediaAction } from "../../events/_actions";
import { EventForm } from "../../events/_components/event-form";

export const metadata = { title: "New Program" };

export default async function NewProgramPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const [allTrainers, allCategories] = await Promise.all([
    db.trainer.findMany({ include: { translations: true }, orderBy: { sortOrder: "asc" } }),
    db.category.findMany({ include: { translations: true }, orderBy: { slug: "asc" } }),
  ]);

  const trainerOptions = allTrainers.map((t) => ({
    value: t.id,
    label: t.translations.find((tr) => tr.locale === "en")?.name ?? t.name ?? t.id,
  }));

  const categoryOptions = allCategories.map((c) => ({
    value: c.id,
    label: c.translations.find((tr) => tr.locale === "en")?.name ?? c.slug,
  }));

  const boundAction = createEventAction.bind(null, activeLocale);

  return (
    <EventForm
      categoryOptions={categoryOptions}
      fetchGalleryMedia={fetchGalleryMediaAction}
      fetchMedia={fetchMediaAction}
      locale={activeLocale}
      onSubmit={boundAction}
      submitLabel="Create Program"
      trainerOptions={trainerOptions}
    />
  );
}
