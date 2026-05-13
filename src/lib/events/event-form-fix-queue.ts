import type { EventFormSectionId } from "./event-form-visibility";

export type FixQueueSeverity = "P0" | "P1" | "P2";

export type FixQueueItem = {
  path: string;
  reason: string;
  sectionId: EventFormSectionId;
  severity: FixQueueSeverity;
  title: string;
};

export function buildEventFormFixQueue(input: {
  activeSection: EventFormSectionId;
  errorPaths: string[];
  limit?: number;
}) {
  const { activeSection, errorPaths, limit = 6 } = input;
  const seen = new Set<string>();
  const items = errorPaths
    .map((path): FixQueueItem => {
      if (path.startsWith("startDate") || path.startsWith("endDate")) {
        return {
          path,
          reason: "Schedule dates are required for publish readiness.",
          sectionId: "schedule",
          severity: "P0",
          title: "Complete event schedule",
        };
      }
      if (path.startsWith("registrationDeadline")) {
        return {
          path,
          reason: "Registration deadline should be valid before publishing.",
          sectionId: "schedule",
          severity: "P0",
          title: "Validate registration cutoff",
        };
      }
      if (
        path.startsWith("title") ||
        path.startsWith("slug") ||
        path.startsWith("content") ||
        path.startsWith("short")
      ) {
        return {
          path,
          reason: "Core content fields are missing or invalid.",
          sectionId:
            path.startsWith("content") || path.startsWith("short")
              ? "content"
              : "identity",
          severity: "P0",
          title: "Fix required content fields",
        };
      }
      if (
        path.startsWith("price") ||
        path.startsWith("payment") ||
        path.startsWith("bank") ||
        path.startsWith("registrationType") ||
        path.startsWith("externalRegistrationUrl")
      ) {
        return {
          path,
          reason: "Registration flow and pricing settings are inconsistent.",
          sectionId: "pricing",
          severity: "P0",
          title: "Resolve pricing and registration flow",
        };
      }
      if (
        path.startsWith("location") ||
        path.startsWith("meeting") ||
        path.startsWith("googleMapsLink")
      ) {
        return {
          path,
          reason: "Delivery/venue details are incomplete for current mode.",
          sectionId: "location",
          severity: "P1",
          title: "Complete delivery details",
        };
      }
      if (path.startsWith("agenda.")) {
        return {
          path,
          reason: "Agenda row has missing required values.",
          sectionId: "agenda",
          severity: "P1",
          title: "Fix agenda entries",
        };
      }
      if (path.startsWith("registrationFields")) {
        return {
          path,
          reason: "One or more registration questions are invalid.",
          sectionId: "registrationForm",
          severity: "P1",
          title: "Fix registration questions",
        };
      }
      if (
        path.startsWith("registrationOpenLabelEn") ||
        path.startsWith("registrationOpenLabelAr")
      ) {
        return {
          path,
          reason: "Registration status labels should be complete and localized.",
          sectionId: "registrations",
          severity: "P2",
          title: "Complete registration status labels",
        };
      }
      if (path.startsWith("gallery")) {
        return {
          path,
          reason: "Gallery configuration needs attention.",
          sectionId: "gallery",
          severity: "P2",
          title: "Adjust gallery settings",
        };
      }
      return {
        path,
        reason: "Review this section for invalid fields.",
        sectionId: activeSection,
        severity: "P2",
        title: "Review section validation",
      };
    })
    .filter((item) => {
      if (seen.has(item.title)) return false;
      seen.add(item.title);
      return true;
    })
    .sort((a, b) => {
      const order = { P0: 0, P1: 1, P2: 2 } as const;
      const bySeverity = order[a.severity] - order[b.severity];
      if (bySeverity !== 0) return bySeverity;
      const aActive = a.sectionId === activeSection ? 0 : 1;
      const bActive = b.sectionId === activeSection ? 0 : 1;
      return aActive - bActive;
    })
    .slice(0, limit);

  return items;
}
