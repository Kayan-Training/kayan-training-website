import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { TrainersManager, type TrainerItem } from "./trainers-manager";

export const metadata = { title: "Trainers" };

export default async function TrainersDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const trainers = await db.trainer.findMany({
    include: { translations: true, avatar: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const items: TrainerItem[] = trainers.map((trainer, index) => ({
    id: trainer.id,
    email: trainer.email ?? "",
    nameEn: trainer.translations.find((t) => t.locale === "en")?.name ?? trainer.name ?? "",
    nameAr: trainer.translations.find((t) => t.locale === "ar")?.name ?? trainer.name ?? "",
    specializationEn: trainer.translations.find((t) => t.locale === "en")?.title ?? trainer.specialization ?? "",
    specializationAr: trainer.translations.find((t) => t.locale === "ar")?.title ?? "",
    bioEn: trainer.translations.find((t) => t.locale === "en")?.bio ?? "",
    bioAr: trainer.translations.find((t) => t.locale === "ar")?.bio ?? "",
    imageUrl: trainer.imageUrl ?? trainer.avatar?.url ?? "",
    sortOrder: trainer.sortOrder ?? index,
  }));

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Trainers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage trainer profiles used across programs, speakers, and agenda sessions.
        </p>
      </div>
      <TrainersManager locale={activeLocale} trainers={items} />
    </section>
  );
}
