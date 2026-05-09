import { resolveCategoryIconPath } from "@/lib/category-icons";
import { db } from "@/lib/db";

export type IconDirection = "up" | "down" | "left" | "right";

export type AnimatedCategoryIconItem = {
  src: string;
  alt: string;
  label: string;
  direction: IconDirection;
  duration: string;
  offset: string;
};

const iconDirections: IconDirection[] = ["up", "right", "down", "left"];
const iconDurations = ["5.2s", "5.8s", "6.4s", "5.5s", "6.1s", "5.9s", "6.3s", "5.1s"];
const iconOffsets = ["-0.4s", "-1.2s", "-2.1s", "-0.9s", "-3s", "-1.8s", "-2.7s", "-0.6s"];

export async function getAnimatedCategoryIcons(locale: "ar" | "en"): Promise<AnimatedCategoryIconItem[]> {
  const [categories, orderSetting] = await Promise.all([
    db.category.findMany({
      include: { translations: true },
      orderBy: { slug: "asc" },
    }),
    db.setting.findUnique({ where: { key: "categories.order" } }),
  ]);

  const orderedIds =
    Array.isArray(orderSetting?.value)
      ? (orderSetting.value as unknown[]).filter(
          (id): id is string => typeof id === "string",
        )
      : [];

  const byId = new Map(categories.map((category) => [category.id, category]));
  const orderedCategories =
    orderedIds.length > 0
      ? [
          ...orderedIds
            .map((id) => byId.get(id))
            .filter(
              (category): category is (typeof categories)[number] =>
                Boolean(category),
            ),
          ...categories.filter((category) => !orderedIds.includes(category.id)),
        ]
      : categories;

  return orderedCategories.map((category, index) => {
    const translation = category.translations.find((item) => item.locale === locale);
    const fallback = category.translations.find((item) => item.locale !== locale);
    const label = translation?.name ?? fallback?.name ?? category.slug;

    return {
      src: resolveCategoryIconPath(category.icon, category.slug),
      alt: `Kayan ${label} Icon`,
      label,
      direction: iconDirections[index % iconDirections.length],
      duration: iconDurations[index % iconDurations.length],
      offset: iconOffsets[index % iconOffsets.length],
    };
  });
}
