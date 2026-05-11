import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import {
  fetchGalleryMediaAction,
  fetchGalleryMediaPageAction,
  fetchMediaAction,
  fetchMediaPageAction,
  updateEventAction,
} from "../../events/_actions";
import { EventForm, type EventFormValues } from "../../events/_components/event-form";

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const [event, allTrainers, allCategories] = await Promise.all([
    db.event.findUnique({
      where: { id },
      include: {
        translations: true,
        trainers: {
          include: { trainer: { include: { translations: true } } },
          orderBy: { sortOrder: "asc" },
        },
        agendaSessions: { orderBy: { order: "asc" } },
        categories: true,
        formFields: { include: { translations: true }, orderBy: { order: "asc" } },
        registrations: {
          include: {
            user: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    }),
    db.trainer.findMany({ include: { translations: true }, orderBy: { sortOrder: "asc" } }),
    db.category.findMany({ include: { translations: true }, orderBy: { slug: "asc" } }),
  ]);

  if (!event) notFound();

  const trEn = event.translations.find((t) => t.locale === "en");
  const trAr = event.translations.find((t) => t.locale === "ar");
  const eventRegistrationType = ((event as { registrationType?: string }).registrationType ?? "internal") as "internal" | "external";
  const eventExternalRegistrationUrl = (event as { externalRegistrationUrl?: string | null }).externalRegistrationUrl ?? "";
  const bankDetails =
    event.bankTransferDetails && typeof event.bankTransferDetails === "object"
      ? (event.bankTransferDetails as {
          payment?: {
            accountName?: string | null;
            bankName?: string | null;
            iban?: string | null;
            swift?: string | null;
            instructions?: { ar?: string | null; en?: string | null };
          };
        })
      : {};
  const galleryDetails =
    event.bankTransferDetails && typeof event.bankTransferDetails === "object"
      ? (event.bankTransferDetails as {
          gallery?: { mode?: "always" | "after_passed" | "hidden"; mediaIds?: string[] };
          hero?: {
            programLogo?: string;
            collaboratorLogos?: string[];
            tags?: { ar?: string[]; en?: string[] };
            peopleLabel?: { ar?: string | null; en?: string | null };
          };
        })
      : {};

  const defaultValues: Partial<EventFormValues> = {
    slug: event.slug,
    status: event.status as EventFormValues["status"],
    eventKind: ((event as { eventKind?: string }).eventKind ?? "event") as EventFormValues["eventKind"],
    type: event.type as EventFormValues["type"],
    language: (event.language ?? "both") as EventFormValues["language"],
    coverImage: event.coverImage ?? "",
    heroProgramLogo: galleryDetails.hero?.programLogo ?? "",
    heroCollaboratorLogos: Array.isArray(galleryDetails.hero?.collaboratorLogos)
      ? (galleryDetails.hero?.collaboratorLogos ?? []).join("\n")
      : "",
    heroTagsEn: Array.isArray(galleryDetails.hero?.tags?.en)
      ? (galleryDetails.hero?.tags?.en ?? []).join("\n")
      : "",
    heroTagsAr: Array.isArray(galleryDetails.hero?.tags?.ar)
      ? (galleryDetails.hero?.tags?.ar ?? []).join("\n")
      : "",
    heroPeopleLabelEn: galleryDetails.hero?.peopleLabel?.en ?? "",
    heroPeopleLabelAr: galleryDetails.hero?.peopleLabel?.ar ?? "",
    location: event.location ?? "",
    capacity: event.capacity?.toString() ?? "",
    startDate: event.startDate.toISOString().slice(0, 10),
    endDate: event.endDate.toISOString().slice(0, 10),
    registrationDeadline: event.registrationDeadline?.toISOString().slice(0, 10) ?? "",
    price: event.price.toString(),
    isFree: event.isFree,
    isFeatured: event.isFeatured,
    isCertified: event.isCertified,
    registrationsOpen: event.registrationsOpen,
    registrationType: eventRegistrationType as EventFormValues["registrationType"],
    externalRegistrationUrl: eventExternalRegistrationUrl,
    meetingLink: event.meetingLink ?? "",
    meetingPlatform: (event.meetingPlatform ?? "zoom") as EventFormValues["meetingPlatform"],
    galleryMode: (galleryDetails.gallery?.mode ?? "hidden") as EventFormValues["galleryMode"],
    galleryMediaIds: Array.isArray(galleryDetails.gallery?.mediaIds) ? galleryDetails.gallery?.mediaIds ?? [] : [],
    paymentMethods: (event.paymentMethods ?? "both") as EventFormValues["paymentMethods"],
    bankAccountName: bankDetails.payment?.accountName ?? "",
    bankName: bankDetails.payment?.bankName ?? "",
    bankIban: bankDetails.payment?.iban ?? "",
    bankSwift: bankDetails.payment?.swift ?? "",
    bankInstructionsEn: bankDetails.payment?.instructions?.en ?? "",
    bankInstructionsAr: bankDetails.payment?.instructions?.ar ?? "",
    showMapEmbed: event.showMapEmbed,
    googleMapsLink: event.googleMapsLink ?? "",
    titleEn: trEn?.title ?? "",
    titleAr: trAr?.title ?? "",
    shortEn: trEn?.shortDescription ?? "",
    shortAr: trAr?.shortDescription ?? "",
    contentEn: (() => { const d = trEn?.description; if (typeof d === "string") return d; if (d && typeof d === "object" && "html" in d && typeof (d as { html: unknown }).html === "string") return (d as { html: string }).html; return ""; })(),
    contentAr: (() => { const d = trAr?.description; if (typeof d === "string") return d; if (d && typeof d === "object" && "html" in d && typeof (d as { html: unknown }).html === "string") return (d as { html: string }).html; return ""; })(),
    seoTitleEn: trEn?.seoTitle ?? "",
    seoTitleAr: trAr?.seoTitle ?? "",
    seoDescriptionEn: trEn?.seoDescription ?? "",
    seoDescriptionAr: trAr?.seoDescription ?? "",
    trainerIds: event.trainers.map((et) => et.trainerId),
    categories: event.categories.map((ec) => ec.categoryId),
    agenda: event.agendaSessions.map((s) => ({
      day: s.day,
      time: s.time,
      title: s.title,
      type: s.type as EventFormValues["agenda"][number]["type"],
      trainerId: s.trainerId ?? undefined,
    })),
    registrationFields: event.formFields.map((f) => ({
      id: f.id,
      type: f.type as EventFormValues["registrationFields"][number]["type"],
      required: f.required,
      labelEn: f.translations.find((t) => t.locale === "en")?.label ?? "",
      labelAr: f.translations.find((t) => t.locale === "ar")?.label ?? "",
      placeholderEn: f.translations.find((t) => t.locale === "en")?.placeholder ?? "",
      placeholderAr: f.translations.find((t) => t.locale === "ar")?.placeholder ?? "",
      optionsEn: "",
      optionsAr: "",
    })),
  };

  const trainerOptions = allTrainers.map((t) => ({
    value: t.id,
    label: t.translations.find((tr) => tr.locale === "en")?.name ?? t.name ?? t.id,
  }));

  const categoryOptions = allCategories.map((c) => ({
    value: c.id,
    label: c.translations.find((tr) => tr.locale === "en")?.name ?? c.slug,
  }));

  const boundAction = updateEventAction.bind(null, id, activeLocale);
  const eventRegistrations = event.registrations.map((registration) => {
    const formData =
      registration.formData && typeof registration.formData === "object" && !Array.isArray(registration.formData)
        ? (registration.formData as Record<string, unknown>)
        : {};
    return {
      id: registration.id,
      registrantName:
        registration.user?.name ??
        (typeof formData.name === "string" ? formData.name : registration.user?.email ?? "Guest"),
      registrantEmail:
        registration.user?.email ??
        (typeof formData.email === "string" ? formData.email : ""),
      status: registration.status,
      createdAt: new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(registration.createdAt),
    };
  });

  return (
    <EventForm
      categoryOptions={categoryOptions}
      defaultValues={defaultValues}
      eventId={id}
      fetchGalleryMedia={fetchGalleryMediaAction}
      fetchGalleryMediaPage={fetchGalleryMediaPageAction}
      fetchMedia={fetchMediaAction}
      fetchMediaPage={fetchMediaPageAction}
      locale={activeLocale}
      onSubmit={boundAction}
      registrations={eventRegistrations}
      submitLabel="Save Changes"
      trainerOptions={trainerOptions}
    />
  );
}
