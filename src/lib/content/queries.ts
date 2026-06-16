/**
 * Content query helpers for localized public pages.
 */
import { db } from "@/lib/db";

function buildGoogleMapsEmbedUrl(
  rawUrl: string | null | undefined,
  fallbackLocation?: string | null,
) {
  const trimmedUrl = rawUrl?.trim() ?? "";
  const fallback = fallbackLocation?.trim() ?? "";
  const source = trimmedUrl || fallback;

  if (!source) return "";

  try {
    const parsed = new URL(source);
    const host = parsed.hostname.toLowerCase();

    if (
      host.includes("google.") &&
      parsed.pathname.includes("/maps/embed")
    ) {
      return parsed.toString();
    }

    const q =
      parsed.searchParams.get("q") ??
      parsed.searchParams.get("query") ??
      parsed.searchParams.get("destination");
    if (q?.trim()) {
      return `https://www.google.com/maps?q=${encodeURIComponent(q.trim())}&output=embed`;
    }

    const placeMatch = parsed.pathname.match(/\/place\/([^/]+)/i);
    if (placeMatch?.[1]) {
      const place = decodeURIComponent(placeMatch[1]).replace(/\+/g, " ");
      return `https://www.google.com/maps?q=${encodeURIComponent(place)}&output=embed`;
    }

    const coordMatch = parsed.pathname.match(
      /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    );
    if (coordMatch) {
      const coords = `${coordMatch[1]},${coordMatch[2]}`;
      return `https://www.google.com/maps?q=${encodeURIComponent(coords)}&output=embed`;
    }

    const searchMatch = parsed.pathname.match(/\/search\/([^/]+)/i);
    if (searchMatch?.[1]) {
      const searchTerm = decodeURIComponent(searchMatch[1]).replace(/\+/g, " ");
      return `https://www.google.com/maps?q=${encodeURIComponent(searchTerm)}&output=embed`;
    }

    if (
      (host.includes("google.") || host.includes("goo.gl")) &&
      fallback
    ) {
      return `https://www.google.com/maps?q=${encodeURIComponent(fallback)}&output=embed`;
    }

    return `https://www.google.com/maps?q=${encodeURIComponent(source)}&output=embed`;
  } catch {
    if (fallback) {
      return `https://www.google.com/maps?q=${encodeURIComponent(fallback)}&output=embed`;
    }

    return `https://www.google.com/maps?q=${encodeURIComponent(source)}&output=embed`;
  }
}

export async function getLocalizedEvents(
  locale: "ar" | "en",
  take = 48,
  options?: { kind?: "event" | "training_course"; includePast?: boolean },
) {
  const events = await db.event.findMany({
    where: {
      status: "published",
      eventKind: options?.kind ?? "event",
      ...(options?.includePast
        ? {}
        : {
            endDate: {
              gte: new Date(),
            },
          }),
    },
    orderBy: {
      startDate: "asc",
    },
    take,
    include: {
      _count: {
        select: {
          registrations: true,
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
      translations: {
        where: { locale },
        take: 1,
      },
    },
  });

  return events.map((event) => {
    const detailsConfig =
      event.bankTransferDetails && typeof event.bankTransferDetails === "object"
        ? (event.bankTransferDetails as {
            hero?: {
              programLogo?: string;
            };
            ui?: {
              location?: { ar?: string | null; en?: string | null };
              registrationOpenLabel?: { ar?: string | null; en?: string | null };
            };
          })
        : undefined;
    const heroConfig = detailsConfig?.hero;
    const localizedLocation = detailsConfig?.ui?.location?.[locale];
    const registrationOpenLabel = detailsConfig?.ui?.registrationOpenLabel?.[locale];
    return {
    id: event.id,
    categories: event.categories.map((entry) => {
      const translation = entry.category.translations.find((item) => item.locale === locale);
      const fallback = entry.category.translations.find((item) => item.locale !== locale);
      return {
        icon: entry.category.icon,
        label: translation?.name ?? fallback?.name ?? entry.category.slug,
        slug: entry.category.slug,
      };
    }),
    coverImage:
      event.coverImage ??
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=80",
    endDate: event.endDate,
    isFeatured: event.isFeatured,
    location: (typeof localizedLocation === "string" && localizedLocation.trim().length > 0)
      ? localizedLocation.trim()
      : (event.location ?? ""),
    registrationOpenLabel:
      typeof registrationOpenLabel === "string" ? registrationOpenLabel.trim() : "",
    seoDescription: event.translations[0]?.seoDescription ?? event.translations[0]?.shortDescription ?? "",
    seoTitle: event.translations[0]?.seoTitle ?? event.translations[0]?.title ?? event.slug,
    slug: event.slug,
    eventKind: (event as { eventKind?: string }).eventKind ?? "event",
    capacity: event.capacity,
    registrationsCount: event._count.registrations,
    registrationsOpen: Boolean(event.registrationsOpen),
    startDate: event.startDate,
    title: event.translations[0]?.title ?? event.slug,
    type: event.type,
    excerpt: event.translations[0]?.shortDescription ?? "",
    heroProgramLogo:
      typeof heroConfig?.programLogo === "string" ? heroConfig.programLogo : "",
    updatedAt: event.updatedAt,
    };
  });
}

export async function getFeaturedPrograms(locale: "ar" | "en", take = 8) {
  const events = await db.event.findMany({
    where: {
      status: "published",
      isFeatured: true,
      endDate: {
        gte: new Date(),
      },
    },
    orderBy: [{ startDate: "asc" }, { updatedAt: "desc" }],
    take,
    include: {
      _count: {
        select: {
          registrations: true,
        },
      },
      translations: {
        where: { locale },
        take: 1,
      },
    },
  });

  return events.map((event) => {
    const uiConfig =
      event.bankTransferDetails && typeof event.bankTransferDetails === "object"
        ? (event.bankTransferDetails as {
            ui?: {
              location?: { ar?: string | null; en?: string | null };
              registrationOpenLabel?: { ar?: string | null; en?: string | null };
            };
            hero?: { programLogo?: string };
          })
        : undefined;

    const eventKind = ((event as { eventKind?: string }).eventKind ?? "event") as "event" | "training_course";
    const basePath: "events" | "training-courses" =
      eventKind === "training_course" ? "training-courses" : "events";

    return {
      id: event.id,
      basePath,
      coverImage:
        event.coverImage ??
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=80",
      location:
        (uiConfig?.ui?.location?.[locale] ?? event.location ?? "").trim(),
      logo:
        typeof uiConfig?.hero?.programLogo === "string"
          ? uiConfig.hero.programLogo
          : "",
      capacity: event.capacity,
      registrationsCount: event._count.registrations,
      registrationsOpen: Boolean(event.registrationsOpen),
      registrationOpenLabel:
        typeof uiConfig?.ui?.registrationOpenLabel?.[locale] === "string"
          ? (uiConfig.ui.registrationOpenLabel[locale] ?? "").trim()
          : "",
      slug: event.slug,
      startDate: event.startDate.toISOString(),
      title: event.translations[0]?.title ?? event.slug,
      updatedAt: event.updatedAt.toISOString(),
    };
  });
}

export async function getEventDetailBySlug(
  locale: "ar" | "en",
  slug: string,
  options?: { kind?: "event" | "training_course" },
) {
  const event = await db.event.findFirst({
    where: {
      slug,
      status: "published",
      ...(options?.kind ? { eventKind: options.kind } : {}),
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
  const registrationType = ((event as { registrationType?: string }).registrationType ?? "internal") as "internal" | "external";
  const externalRegistrationUrl = (event as { externalRegistrationUrl?: string | null }).externalRegistrationUrl ?? "";
  const galleryConfig =
    event.bankTransferDetails && typeof event.bankTransferDetails === "object"
      ? (event.bankTransferDetails as {
          gallery?: {
            mode?: "always" | "after_passed" | "hidden";
            mediaIds?: string[];
          };
          hero?: {
            programLogo?: string;
            collaboratorLogos?: string[];
            featuredStats?: {
              sessions?: string | null;
              fullDay?: string | null;
            };
            tags?: { ar?: string[]; en?: string[] };
            peopleLabel?: { ar?: string | null; en?: string | null };
          };
        }).gallery
      : undefined;
  const heroConfig =
    event.bankTransferDetails && typeof event.bankTransferDetails === "object"
        ? (event.bankTransferDetails as {
          hero?: {
            programLogo?: string;
            collaboratorLogos?: string[];
            featuredStats?: {
              sessions?: string | null;
              fullDay?: string | null;
            };
            tags?: { ar?: string[]; en?: string[] };
            peopleLabel?: { ar?: string | null; en?: string | null };
          };
          ui?: {
            sidebar?: {
              showSeatsFulfillment?: boolean;
              showPayment?: boolean;
            };
            location?: { ar?: string | null; en?: string | null };
            registrationOpenLabel?: { ar?: string | null; en?: string | null };
          };
        }).hero
      : undefined;
  const uiConfig =
    event.bankTransferDetails && typeof event.bankTransferDetails === "object"
      ? (event.bankTransferDetails as {
          ui?: {
            sidebar?: {
              showSeatsFulfillment?: boolean;
              showPayment?: boolean;
            };
            location?: { ar?: string | null; en?: string | null };
            registrationOpenLabel?: { ar?: string | null; en?: string | null };
          };
        }).ui
      : undefined;
  const mapConfig =
    event.bankTransferDetails && typeof event.bankTransferDetails === "object"
      ? (event.bankTransferDetails as {
          map?: { showEmbed?: boolean; url?: string | null };
        }).map
      : undefined;
  const sidebarUiConfig = uiConfig?.sidebar;
  const galleryIds = Array.isArray(galleryConfig?.mediaIds)
    ? (galleryConfig?.mediaIds ?? []).filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];
  const galleryMediaRaw = galleryIds.length
    ? await db.media.findMany({
        where: { id: { in: galleryIds } },
        include: {
          uploadedBy: { select: { name: true, email: true } },
          translations: { where: { locale }, take: 1 },
        },
      })
    : [];
  const galleryById = new Map(galleryMediaRaw.map((item) => [item.id, item]));
  const gallery = galleryIds
    .map((id) => galleryById.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => ({
      id: item.id,
      url: item.url,
      mimeType: item.mimeType,
      title: item.translations[0]?.title ?? item.originalName,
      description: item.translations[0]?.description ?? "",
      uploadedBy: item.uploadedBy.name ?? item.uploadedBy.email ?? "Unknown",
      createdAt: item.createdAt.toISOString(),
    }));

  return {
    id: event.id,
    description: event.translations[0]?.description ?? null,
    coverImage:
      event.coverImage ??
      "https://images.unsplash.com/photo-1558008258-3256797b43f3?w=1400&q=80",
    startDate: event.startDate,
    endDate: event.endDate,
    eventKind: (event as { eventKind?: string }).eventKind ?? "event",
    type: event.type,
    isFeatured: event.isFeatured,
    meetingLink: event.meetingLink ?? "",
    meetingPlatform: event.meetingPlatform ?? "",
    registrationsOpen: event.registrationsOpen,
    registrationType,
    externalRegistrationUrl,
    capacity: event.capacity ?? null,
    registrationsCount: event.registrations.length,
      isFree: event.isFree,
      price: event.price.toString(),
      paymentMethods: event.paymentMethods as "both" | "card" | "bank",
      seoDescription: event.translations[0]?.seoDescription ?? event.translations[0]?.shortDescription ?? "",
    seoTitle: event.translations[0]?.seoTitle ?? event.translations[0]?.title ?? event.slug,
    location:
      (typeof uiConfig?.location?.[locale] === "string" && uiConfig.location[locale]!.trim().length > 0)
        ? uiConfig.location[locale]!.trim()
        : (event.location ?? ""),
    registrationOpenLabel:
      typeof uiConfig?.registrationOpenLabel?.[locale] === "string"
        ? (uiConfig.registrationOpenLabel[locale] ?? "").trim()
        : "",
    googleMapsLink: event.googleMapsLink ?? mapConfig?.url ?? "",
    mapEmbedUrl: buildGoogleMapsEmbedUrl(
      event.googleMapsLink ?? mapConfig?.url ?? "",
      (typeof uiConfig?.location?.[locale] === "string" &&
      uiConfig.location[locale]!.trim().length > 0)
        ? uiConfig.location[locale]!.trim()
        : event.location,
    ),
    showMapEmbed: event.showMapEmbed || Boolean(mapConfig?.showEmbed),
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
      const agendaMeta =
        event.bankTransferDetails && typeof event.bankTransferDetails === "object"
          ? ((event.bankTransferDetails as {
              agenda?: Array<{
                order?: number;
                title?: { ar?: string | null; en?: string | null };
                speakerNames?:
                  | string[]
                  | {
                      ar?: string[];
                      en?: string[];
                    };
                highlighted?: boolean;
              }>;
            }).agenda?.find((entry) => (entry.order ?? -1) === item.order))
          : undefined;
      const trainerTranslation = item.trainer?.translations.find((t) => t.locale === locale);
      const trainerFallback = item.trainer?.translations.find((t) => t.locale !== locale);
      const manualSpeakerNames = (
        Array.isArray(agendaMeta?.speakerNames)
          ? agendaMeta?.speakerNames
          : locale === "ar"
            ? agendaMeta?.speakerNames?.ar
            : agendaMeta?.speakerNames?.en
      )?.filter((name): name is string => typeof name === "string" && name.trim().length > 0) ?? [];
      const trainerName = trainerTranslation?.name ?? trainerFallback?.name ?? item.trainer?.name ?? "";
      return {
        trainerLink:
          Array.isArray(item.trainer?.links)
            ? item.trainer?.links.find((value): value is string => typeof value === "string" && value.trim().length > 0) ?? ""
            : "",
        day: item.day,
        time: item.time,
        title:
          (locale === "ar"
            ? (agendaMeta?.title?.ar ?? "")
            : (agendaMeta?.title?.en ?? "")) || item.title,
        trainerName: [trainerName, ...manualSpeakerNames].filter(Boolean).join(", "),
        highlighted: Boolean(agendaMeta?.highlighted),
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
        link:
          Array.isArray(entry.trainer.links)
            ? entry.trainer.links.find((value): value is string => typeof value === "string" && value.trim().length > 0) ?? ""
            : "",
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
      return {
        color: entry.category.color,
        label: translation?.name ?? fallback?.name ?? entry.category.slug,
      };
    }),
    slug: event.slug,
    title: event.translations[0]?.title ?? event.slug,
    excerpt: event.translations[0]?.shortDescription ?? "",
    galleryMode: (galleryConfig?.mode ?? "hidden") as "always" | "after_passed" | "hidden",
    gallery,
    heroProgramLogo:
      typeof heroConfig?.programLogo === "string" ? heroConfig.programLogo : "",
    heroCollaboratorLogos: Array.isArray(heroConfig?.collaboratorLogos)
      ? heroConfig?.collaboratorLogos.filter(
          (logo): logo is string => typeof logo === "string" && logo.trim().length > 0,
        )
      : [],
    heroTags: Array.isArray(heroConfig?.tags?.[locale])
      ? (heroConfig?.tags?.[locale] ?? []).filter(
          (tag): tag is string => typeof tag === "string" && tag.trim().length > 0,
        )
      : [],
    heroPeopleLabel:
      typeof heroConfig?.peopleLabel?.[locale] === "string"
        ? (heroConfig?.peopleLabel?.[locale] ?? "").trim()
        : "",
    featuredSessionsStat:
      typeof heroConfig?.featuredStats?.sessions === "string"
        ? heroConfig.featuredStats.sessions.trim()
        : "",
    featuredFullDayStat:
      typeof heroConfig?.featuredStats?.fullDay === "string"
        ? heroConfig.featuredStats.fullDay.trim()
        : "",
    showSidebarSeatsFulfillment:
      typeof sidebarUiConfig?.showSeatsFulfillment === "boolean"
        ? sidebarUiConfig.showSeatsFulfillment
        : true,
    showSidebarPayment:
      typeof sidebarUiConfig?.showPayment === "boolean"
        ? sidebarUiConfig.showPayment
        : true,
  };
}

export async function getLocalizedPosts(locale: "ar" | "en", take = 12) {
  const posts = await db.post.findMany({
    where: {
      status: "published",
      type: "article",
    },
    orderBy: {
      publishedAt: "desc",
    },
    take,
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
      featuredImage: true,
      author: { select: { name: true } },
    },
  });

  if (!post) {
    return null;
  }

  return {
    content: post.translations[0]?.content ?? null,
    coverImage: post.featuredImage?.url ?? null,
    authorName: post.author?.name ?? null,
    publishedAt: post.publishedAt,
    seoDescription: post.translations[0]?.seoDescription ?? post.translations[0]?.excerpt ?? "",
    seoImage: post.featuredImage?.url ?? null,
    seoTitle: post.translations[0]?.seoTitle ?? post.translations[0]?.title ?? post.slug,
    slug: post.slug,
    title: post.translations[0]?.title ?? post.slug,
    excerpt: post.translations[0]?.excerpt ?? "",
  };
}

export async function getLocalizedKnowledgePosts(locale: "ar" | "en", take = 12) {
  const posts = await db.post.findMany({
    where: {
      status: "published",
      type: "knowledge",
    },
    orderBy: {
      publishedAt: "desc",
    },
    take,
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

export type ListingConfig = {
  eyebrow: string;
  heading: string;
  subheading: string;
  resultsPerPage: number;
};

export async function getListingConfig(locale: "ar" | "en", slug: string): Promise<ListingConfig | null> {
  const page = await db.page.findFirst({
    where: { slug },
    include: { translations: { where: { locale }, take: 1 } },
  });
  if (!page) return null;
  const blocks = page.translations[0]?.blocks;
  if (!Array.isArray(blocks)) return null;
  const block = (blocks as Record<string, unknown>[]).find((b) => b?.type === "listing_config");
  if (!block) return null;
  return {
    eyebrow: (block.eyebrow as string) ?? "",
    heading: (block.heading as string) ?? "",
    subheading: (block.subheading as string) ?? "",
    resultsPerPage: (block.resultsPerPage as number) ?? 12,
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
