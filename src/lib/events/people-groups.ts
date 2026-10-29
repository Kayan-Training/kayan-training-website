/**
 * Ordered people-group metadata shared by the editor, server actions and public queries.
 * EventTrainer remains the unique profile union; missing metadata retains legacy content.
 * This module is pure and must not access the database or browser state.
 */
import { z } from "zod";

export const peopleGroupSchema = z
  .object({
    id: z.string().min(1).max(100),
    nameEn: z.string().trim().max(200),
    nameAr: z.string().trim().max(200),
    memberIds: z.array(z.string().min(1).max(100)).max(500),
  })
  .superRefine((group, ctx) => {
    if (!group.nameEn && !group.nameAr) {
      ctx.addIssue({
        code: "custom",
        path: ["nameEn"],
        message: "Give each group an English or Arabic name.",
      });
    }
    if (new Set(group.memberIds).size !== group.memberIds.length) {
      ctx.addIssue({
        code: "custom",
        path: ["memberIds"],
        message: "A person can only appear once in the same group.",
      });
    }
  });

export const peopleGroupsSchema = z
  .array(peopleGroupSchema)
  .max(50)
  .superRefine((groups, ctx) => {
    if (new Set(groups.map((group) => group.id)).size !== groups.length) {
      ctx.addIssue({ code: "custom", message: "Group IDs must be unique." });
    }
  });

export type PeopleGroup = z.infer<typeof peopleGroupSchema>;
export type PeopleOption = {
  value: string;
  label: string;
  labelAr?: string;
  subtitle?: string;
  subtitleAr?: string;
  imageUrl?: string;
};

export function uniquePeopleIds(groups: PeopleGroup[]): string[] {
  return [...new Set(groups.flatMap((group) => group.memberIds))];
}

/** Missing metadata is legacy content; an explicitly empty list is an intentional removal. */
export function readPeopleGroups(
  metadata: unknown,
  assignedIds: string[],
): PeopleGroup[] {
  const data =
    metadata && typeof metadata === "object"
      ? (metadata as Record<string, unknown>)
      : {};
  const saved = data.peopleGroups;
  if (
    saved &&
    typeof saved === "object" &&
    "version" in saved &&
    saved.version === 1 &&
    "groups" in saved
  ) {
    const parsed = peopleGroupsSchema.safeParse(saved.groups);
    if (parsed.success) {
      const assigned = new Set(assignedIds);
      return parsed.data.map((group) => ({
        ...group,
        memberIds: group.memberIds.filter((id) => assigned.has(id)),
      }));
    }
  }
  if (!assignedIds.length) return [];
  const hero =
    data.hero && typeof data.hero === "object"
      ? (data.hero as Record<string, unknown>)
      : {};
  const label =
    hero.peopleLabel && typeof hero.peopleLabel === "object"
      ? (hero.peopleLabel as Record<string, unknown>)
      : {};
  return [
    {
      id: "legacy-trainers",
      nameEn:
        typeof label.en === "string" && label.en.trim()
          ? label.en.trim()
          : "Trainers",
      nameAr:
        typeof label.ar === "string" && label.ar.trim()
          ? label.ar.trim()
          : "المدربون",
      memberIds: [...new Set(assignedIds)],
    },
  ];
}

export function groupName(group: PeopleGroup, locale: "en" | "ar"): string {
  return (
    locale === "ar"
      ? group.nameAr || group.nameEn
      : group.nameEn || group.nameAr
  ).trim();
}

export function resolvePeopleGroups<T extends { id: string }>(
  groups: PeopleGroup[],
  people: T[],
  locale: "en" | "ar",
) {
  const byId = new Map(people.map((person) => [person.id, person]));
  return groups
    .map((group) => ({
      id: group.id,
      name: groupName(group, locale),
      members: group.memberIds.flatMap((id) => {
        const person = byId.get(id);
        return person ? [person] : [];
      }),
    }))
    .filter((group) => group.members.length > 0);
}

/** A move preserves other group memberships and never duplicates the target membership. */
export function movePerson(
  groups: PeopleGroup[],
  sourceId: string,
  targetId: string,
  personId: string,
  targetIndex?: number,
): PeopleGroup[] {
  const source = groups.find((group) => group.id === sourceId);
  const target = groups.find((group) => group.id === targetId);
  if (!source?.memberIds.includes(personId) || !target) return groups;
  const alreadyInTarget =
    sourceId !== targetId && target.memberIds.includes(personId);
  return groups.map((group) => {
    if (group.id !== sourceId && group.id !== targetId) return group;
    const memberIds = group.memberIds.filter((id) => id !== personId);
    if (group.id === targetId) {
      if (alreadyInTarget) return group;
      memberIds.splice(
        Math.max(
          0,
          Math.min(targetIndex ?? memberIds.length, memberIds.length),
        ),
        0,
        personId,
      );
    }
    return { ...group, memberIds };
  });
}

/** Adds a membership without changing the source or any existing ordering. */
export function addPersonToGroup(
  groups: PeopleGroup[],
  sourceId: string,
  targetId: string,
  personId: string,
): PeopleGroup[] {
  const source = groups.find((group) => group.id === sourceId);
  const target = groups.find((group) => group.id === targetId);
  if (
    !source?.memberIds.includes(personId) ||
    !target ||
    target.memberIds.includes(personId)
  )
    return groups;
  return groups.map((group) =>
    group.id === targetId
      ? { ...group, memberIds: [...group.memberIds, personId] }
      : group,
  );
}
