/**
 * Content query helpers for localized public pages.
 */
import { db } from "@/lib/db";

export async function getLocalizedEvents(locale: "ar" | "en") {
  const events = await db.event.findMany({
    where: {
      status: "published",
      endDate: {
        gte: new Date(),
      },
    },
    orderBy: {
      startDate: "asc",
    },
    take: 48,
    include: {
      categories: {
        include: {
          category: {
            include: {
              translations: true,
            },
          },
        },
      },
      translations: {
        where: { locale },
        take: 1,
      },
    },
  });

  return events.map((event) => ({
    id: event.id,
    categories: event.categories.map((entry) => {
      const translation = entry.category.translations.find((item) => item.locale === locale);
      const fallback = entry.category.translations.find((item) => item.locale !== locale);
      return {
        label: translation?.name ?? fallback?.name ?? entry.category.slug,
        slug: entry.category.slug,
      };
    }),
    coverImage:
      event.coverImage ??
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=80",
    endDate: event.endDate,
    isFeatured: event.isFeatured,
    location: event.location ?? "",
    seoDescription: event.translations[0]?.seoDescription ?? event.translations[0]?.shortDescription ?? "",
    seoTitle: event.translations[0]?.seoTitle ?? event.translations[0]?.title ?? event.slug,
    slug: event.slug,
    startDate: event.startDate,
    title: event.translations[0]?.title ?? event.slug,
    type: event.type,
    excerpt: event.translations[0]?.shortDescription ?? "",
  }));
}

export async function getEventDetailBySlug(locale: "ar" | "en", slug: string) {
  const event = await db.event.findFirst({
    where: {
      slug,
      status: "published",
    },
    include: {
      formFields: {
        include: {
          translations: {
            where: { locale },
            take: 1,
          },
        },
        orderBy: { order: "asc" },
      },
      translations: {
        where: { locale },
        take: 1,
      },
      agendaSessions: {
        orderBy: [{ day: "asc" }, { order: "asc" }],
        include: {
          trainer: {
            include: {
              translations: true,
            },
          },
        },
      },
      categories: {
        include: {
          category: {
            include: {
              translations: true,
            },
          },
        },
      },
      trainers: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          trainer: {
            include: {
              avatar: true,
              translations: true,
            },
          },
        },
      },
      registrations: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!event) {
    return null;
  }

  return {
    id: event.id,
    description: event.translations[0]?.description ?? null,
    coverImage:
      event.coverImage ??
      "https://images.unsplash.com/photo-1558008258-3256797b43f3?w=1400&q=80",
    startDate: event.startDate,
    endDate: event.endDate,
    type: event.type,
    isFeatured: event.isFeatured,
    meetingLink: event.meetingLink ?? "",
    meetingPlatform: event.meetingPlatform ?? "",
    registrationsOpen: event.registrationsOpen,
    capacity: event.capacity ?? null,
    registrationsCount: event.registrations.length,
      isFree: event.isFree,
      price: event.price.toString(),
      paymentMethods: event.paymentMethods as "both" | "card" | "bank",
      seoDescription: event.translations[0]?.seoDescription ?? event.translations[0]?.shortDescription ?? "",
    seoTitle: event.translations[0]?.seoTitle ?? event.translations[0]?.title ?? event.slug,
    location: event.location ?? "",
    mapEmbedUrl:
      event.bankTransferDetails &&
      typeof event.bankTransferDetails === "object" &&
      (event.bankTransferDetails as { map?: { url?: string | null } }).map?.url
        ? ((event.bankTransferDetails as { map?: { url?: string | null } }).map?.url ?? "")
        : "",
    showMapEmbed:
      Boolean(
        event.bankTransferDetails &&
          typeof event.bankTransferDetails === "object" &&
          (event.bankTransferDetails as { map?: { showEmbed?: boolean } }).map?.showEmbed,
      ),
    bankTransfer:
      event.bankTransferDetails && typeof event.bankTransferDetails === "object"
        ? {
            accountName:
              ((event.bankTransferDetails as {
                payment?: { accountName?: string | null };
              }).payment?.accountName ?? null),
            bankName:
              ((event.bankTransferDetails as {
                payment?: { bankName?: string | null };
              }).payment?.bankName ?? null),
            iban:
              ((event.bankTransferDetails as {
                payment?: { iban?: string | null };
              }).payment?.iban ?? null),
            instructions:
              ((event.bankTransferDetails as {
                payment?: { instructions?: { ar?: string | null; en?: string | null } };
              }).payment?.instructions?.[locale] ?? null),
            swift:
              ((event.bankTransferDetails as {
                payment?: { swift?: string | null };
              }).payment?.swift ?? null),
          }
        : {
            accountName: null,
            bankName: null,
            iban: null,
            instructions: null,
            swift: null,
          },
    formFields: event.formFields.map((field) => {
      const optionPayload =
        field.options && typeof field.options === "object"
          ? (field.options as { choices?: unknown })
          : {};
      const localeChoices = (optionPayload.choices as { ar?: unknown; en?: unknown } | undefined) ?? {};
      const choices = Array.isArray(localeChoices[locale])
        ? (localeChoices[locale] as string[])
        : Array.isArray(optionPayload.choices)
          ? (optionPayload.choices as string[])
          : [];
      return {
        id: field.id,
        label: field.translations[0]?.label ?? "Field",
        options: choices,
        placeholder: field.translations[0]?.placeholder ?? "",
        required: field.required,
        type: field.type,
      };
    }),
    agenda: event.agendaSessions.map((item) => {
      const trainerTranslation = item.trainer?.translations.find((t) => t.locale === locale);
      const trainerFallback = item.trainer?.translations.find((t) => t.locale !== locale);
      return {
        day: item.day,
        time: item.time,
        title: item.title,
        trainerName: trainerTranslation?.name ?? trainerFallback?.name ?? item.trainer?.name ?? "",
        type: item.type,
      };
    }),
    trainers: event.trainers.map((entry) => {
      const translation = entry.trainer.translations.find((t) => t.locale === locale);
      const fallback = entry.trainer.translations.find((t) => t.locale !== locale);
      return {
        image:
          entry.trainer.imageUrl ??
          entry.trainer.avatar?.url ??
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80",
        name: translation?.name ?? fallback?.name ?? entry.trainer.name ?? "Trainer",
        title:
          translation?.title ??
          fallback?.title ??
          entry.trainer.specialization ??
          (locale === "ar" ? "مدرب" : "Trainer"),
      };
    }),
    categories: event.categories.map((entry) => {
      const translation = entry.category.translations.find((t) => t.locale === locale);
      const fallback = entry.category.translations.find((t) => t.locale !== locale);
      return translation?.name ?? fallback?.name ?? entry.category.slug;
    }),
    slug: event.slug,
    title: event.translations[0]?.title ?? event.slug,
    excerpt: event.translations[0]?.shortDescription ?? "",
  };
}

export async function getLocalizedPosts(locale: "ar" | "en") {
  const posts = await db.post.findMany({
    where: {
      status: "published",
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 12,
    include: {
      featuredImage: true,
      translations: {
        where: { locale },
        take: 1,
      },
    },
  });

  return posts.map((post) => ({
    seoDescription: post.translations[0]?.seoDescription ?? post.translations[0]?.excerpt ?? "",
    seoTitle: post.translations[0]?.seoTitle ?? post.translations[0]?.title ?? post.slug,
    image: post.featuredImage?.url ?? null,
    publishedAt: post.publishedAt ?? post.createdAt,
    slug: post.slug,
    title: post.translations[0]?.title ?? post.slug,
    excerpt: post.translations[0]?.excerpt ?? "",
  }));
}

export async function getPostDetailBySlug(locale: "ar" | "en", slug: string) {
  const post = await db.post.findFirst({
    where: {
      slug,
      status: "published",
    },
    include: {
      translations: {
        where: { locale },
        take: 1,
      },
    },
  });

  if (!post) {
    return null;
  }

  return {
    content: post.translations[0]?.content ?? null,
    seoDescription: post.translations[0]?.seoDescription ?? post.translations[0]?.excerpt ?? "",
    seoTitle: post.translations[0]?.seoTitle ?? post.translations[0]?.title ?? post.slug,
    slug: post.slug,
    title: post.translations[0]?.title ?? post.slug,
    excerpt: post.translations[0]?.excerpt ?? "",
  };
}

export async function getStaticPageBySlug(locale: "ar" | "en", slug: string) {
  const page = await db.page.findFirst({
    where: {
      slug,
      status: "published",
    },
    include: {
      translations: {
        where: { locale },
        take: 1,
      },
    },
  });

  if (!page) {
    return null;
  }

  return {
    seoDescription: page.translations[0]?.seoDescription ?? "",
    seoTitle: page.translations[0]?.seoTitle ?? page.translations[0]?.title ?? page.slug,
    slug: page.slug,
    title: page.translations[0]?.title ?? page.slug,
    blocks: page.translations[0]?.blocks ?? null,
  };
}
