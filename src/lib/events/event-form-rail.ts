import type { EventFormSectionId } from "./event-form-visibility";

export type EventFormRailSection = { id: EventFormSectionId; label: string };

export type EventFormRailGroup = {
  id: "core" | "experience" | "people" | "operations";
  label: string;
  sectionIds: EventFormSectionId[];
};

export function buildEventFormRailGroups(options: {
  showRegistrationFormSection: boolean;
}): EventFormRailGroup[] {
  const { showRegistrationFormSection } = options;
  return [
    {
      id: "core",
      label: "Core",
      sectionIds: ["identity", "schedule", "location", "pricing"],
    },
    {
      id: "experience",
      label: "Experience",
      sectionIds: ["content", "gallery", "agenda"],
    },
    {
      id: "people",
      label: "People",
      sectionIds: ["trainers", "categories"],
    },
    {
      id: "operations",
      label: "Operations",
      sectionIds: [
        ...(showRegistrationFormSection ? (["registrationForm"] as EventFormSectionId[]) : []),
        "registrations",
      ],
    },
  ];
}

export function getGroupSections<T extends EventFormRailSection>(
  group: EventFormRailGroup,
  sections: T[],
): T[] {
  return sections.filter((section) => group.sectionIds.includes(section.id));
}

export function getGroupProgress(
  groupSections: EventFormRailSection[],
  sectionHealth: Record<EventFormSectionId, { completed: boolean }>,
) {
  const done = groupSections.filter(
    (section) => sectionHealth[section.id]?.completed,
  ).length;
  return { done, total: groupSections.length };
}
