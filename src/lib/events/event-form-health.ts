import type { EventFormSectionId } from "./event-form-visibility";

type EventType = "onsite" | "online" | "hybrid";
type RegistrationType = "internal" | "external";

export type EventFormHealthInputs = {
  errorPaths: string[];
  eventType: EventType;
  galleryMediaCount: number;
  galleryMode: "always" | "after_passed" | "hidden";
  hasContentAr: boolean;
  hasContentEn: boolean;
  hasLocationAr: boolean;
  hasLocationEn: boolean;
  hasMeetingLink: boolean;
  hasPrice: boolean;
  hasShortAr: boolean;
  hasShortEn: boolean;
  hasSlug: boolean;
  hasTitleAr: boolean;
  hasTitleEn: boolean;
  hasExternalRegistrationUrl: boolean;
  isFree: boolean;
  registrationFieldsCount: number;
  registrationType: RegistrationType;
  registrationsCount: number;
  sections: Array<{ id: EventFormSectionId; label: string }>;
  selectedCategoryCount: number;
  selectedTrainerCount: number;
  showRegistrationFormSection: boolean;
  status: "draft" | "published";
  agendaCount: number;
  hasStartDate: boolean;
  hasEndDate: boolean;
};

export type SectionHealth = Record<
  EventFormSectionId,
  { completed: boolean; errors: number; status: "error" | "done" | "todo" }
>;

export function computeSectionHealth(input: EventFormHealthInputs): SectionHealth {
  const {
    agendaCount,
    errorPaths,
    eventType,
    galleryMediaCount,
    galleryMode,
    hasContentAr,
    hasContentEn,
    hasEndDate,
    hasExternalRegistrationUrl,
    hasLocationAr,
    hasLocationEn,
    hasMeetingLink,
    hasPrice,
    hasShortAr,
    hasShortEn,
    hasSlug,
    hasStartDate,
    hasTitleAr,
    hasTitleEn,
    isFree,
    registrationFieldsCount,
    registrationType,
    registrationsCount,
    selectedCategoryCount,
    selectedTrainerCount,
    showRegistrationFormSection,
    sections,
  } = input;

  const errorCountBySection = {
    identity: errorPaths.filter(
      (path) =>
        path.startsWith("title") ||
        path.startsWith("slug") ||
        path.startsWith("seo") ||
        path.startsWith("hero"),
    ).length,
    schedule: errorPaths.filter(
      (path) =>
        path.startsWith("startDate") ||
        path.startsWith("endDate") ||
        path.startsWith("registrationDeadline") ||
        path.startsWith("capacity"),
    ).length,
    location: errorPaths.filter(
      (path) =>
        path.startsWith("location") ||
        path.startsWith("meeting") ||
        path.startsWith("googleMapsLink") ||
        path.startsWith("showMapEmbed"),
    ).length,
    pricing: errorPaths.filter(
      (path) =>
        path.startsWith("price") ||
        path.startsWith("isFree") ||
        path.startsWith("payment") ||
        path.startsWith("bank") ||
        path.startsWith("registrationType") ||
        path.startsWith("externalRegistrationUrl"),
    ).length,
    content: errorPaths.filter(
      (path) => path.startsWith("short") || path.startsWith("content"),
    ).length,
    gallery: errorPaths.filter(
      (path) =>
        path.startsWith("galleryMode") || path.startsWith("galleryMediaIds"),
    ).length,
    agenda: errorPaths.filter((path) => path.startsWith("agenda.")).length,
    trainers: errorPaths.filter((path) => path.startsWith("trainerIds")).length,
    categories: errorPaths.filter((path) => path.startsWith("categories"))
      .length,
    registrationForm: errorPaths.filter((path) =>
      path.startsWith("registrationFields"),
    ).length,
    registrations: 0,
  } satisfies Record<EventFormSectionId, number>;

  const completionBySection = {
    identity: hasTitleEn && hasTitleAr && hasSlug,
    schedule: hasStartDate && hasEndDate,
    location:
      (eventType === "onsite" && (hasLocationEn || hasLocationAr)) ||
      (eventType === "online" && hasMeetingLink) ||
      (eventType === "hybrid" &&
        (hasLocationEn || hasLocationAr) &&
        hasMeetingLink),
    pricing:
      registrationType === "external"
        ? hasExternalRegistrationUrl
        : isFree || hasPrice,
    content: hasShortEn || hasShortAr || hasContentEn || hasContentAr,
    gallery: galleryMediaCount > 0 || galleryMode === "hidden",
    agenda: agendaCount > 0,
    trainers: selectedTrainerCount > 0,
    categories: selectedCategoryCount > 0,
    registrationForm:
      !showRegistrationFormSection || registrationFieldsCount > 0,
    registrations: registrationsCount > 0,
  } satisfies Record<EventFormSectionId, boolean>;

  return sections.reduce(
    (acc, section) => {
      const errors = errorCountBySection[section.id];
      const completed = completionBySection[section.id];
      acc[section.id] = {
        completed,
        errors,
        status: errors > 0 ? "error" : completed ? "done" : "todo",
      };
      return acc;
    },
    {} as SectionHealth,
  );
}

export function computeHealthSummary(input: {
  sectionHealth: SectionHealth;
  sections: Array<{ id: EventFormSectionId; label: string }>;
  status: "draft" | "published";
}) {
  const { sectionHealth, sections, status } = input;
  const total = sections.length;
  const completed = sections.filter(
    (section) => sectionHealth[section.id]?.completed,
  ).length;
  const errors = sections.reduce(
    (sum, section) => sum + (sectionHealth[section.id]?.errors ?? 0),
    0,
  );
  const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const blockingItems = sections
    .map((section) => ({
      id: section.id,
      label: section.label,
      errors: sectionHealth[section.id]?.errors ?? 0,
    }))
    .filter((item) => item.errors > 0)
    .sort((a, b) => b.errors - a.errors)
    .slice(0, 3);

  const publishReady =
    errors === 0 &&
    sectionHealth.identity.completed &&
    sectionHealth.schedule.completed &&
    sectionHealth.location.completed &&
    sectionHealth.pricing.completed &&
    status === "published";

  return {
    blockingItems,
    completed,
    completionPercent,
    errors,
    publishReady,
    total,
  };
}

