import { buildEventFormFixQueue } from "../event-form-fix-queue";
import { describe, expect, it } from "vitest";
import {
  addPersonToGroup,
  groupName,
  movePerson,
  peopleGroupsSchema,
  readPeopleGroups,
  resolvePeopleGroups,
  uniquePeopleIds,
  type PeopleGroup,
} from "../people-groups";

const groups: PeopleGroup[] = [
  {
    id: "a",
    nameEn: "Speakers",
    nameAr: "المتحدثون",
    memberIds: ["one", "two"],
  },
  { id: "b", nameEn: "Committee", nameAr: "اللجنة", memberIds: ["three"] },
  { id: "c", nameEn: "Empty", nameAr: "", memberIds: [] },
];

describe("independent people groups", () => {
  it("retains legacy headings, membership and order", () => {
    expect(
      readPeopleGroups(
        { hero: { peopleLabel: { en: "Faculty", ar: "الهيئة" } } },
        ["two", "one"],
      ),
    ).toEqual([
      {
        id: "legacy-trainers",
        nameEn: "Faculty",
        nameAr: "الهيئة",
        memberIds: ["two", "one"],
      },
    ]);
    expect(readPeopleGroups(null, ["one"])[0].nameEn).toBe("Trainers");
    expect(readPeopleGroups(null, [])).toEqual([]);
  });
  it("does not resurrect deliberately removed groups", () => {
    expect(
      readPeopleGroups({ peopleGroups: { version: 1, groups: [] } }, ["one"]),
    ).toEqual([]);
  });
  it("filters deleted profiles and preserves saved group order", () => {
    const saved = readPeopleGroups({ peopleGroups: { version: 1, groups } }, [
      "one",
      "three",
    ]);
    expect(saved[0].memberIds).toEqual(["one"]);
    expect(saved.map((g) => g.id)).toEqual(["a", "b", "c"]);
  });
  it("allows membership across groups, rejects duplicates within a group and duplicate group IDs", () => {
    expect(
      peopleGroupsSchema.safeParse([
        groups[0],
        { ...groups[1], memberIds: ["one"] },
      ]).success,
    ).toBe(true);
    expect(
      peopleGroupsSchema.safeParse([
        { ...groups[0], memberIds: ["one", "one"] },
      ]).success,
    ).toBe(false);
    expect(peopleGroupsSchema.safeParse([groups[0], groups[0]]).success).toBe(
      false,
    );
    expect(
      peopleGroupsSchema.safeParse([{ ...groups[0], nameEn: " ", nameAr: "" }])
        .success,
    ).toBe(false);
  });
  it("moves across groups at the target position without mutating input", () => {
    const moved = movePerson(groups, "a", "b", "two", 0);
    expect(moved[0].memberIds).toEqual(["one"]);
    expect(moved[1].memberIds).toEqual(["two", "three"]);
    expect(groups[0].memberIds).toEqual(["one", "two"]);
  });
  it("reorders within a group and drops into empty groups", () => {
    expect(movePerson(groups, "a", "a", "one", 1)[0].memberIds).toEqual([
      "two",
      "one",
    ]);
    expect(movePerson(groups, "a", "c", "one")[2].memberIds).toEqual(["one"]);
  });
  it("moving to an existing membership removes source only and keeps other groups intact", () => {
    const shared = [
      ...groups,
      { ...groups[1], id: "d", memberIds: ["one"] },
      { ...groups[1], id: "e", memberIds: ["one"] },
    ];
    const moved = movePerson(shared, "a", "d", "one");
    expect(moved[0].memberIds).toEqual(["two"]);
    expect(moved[3].memberIds).toEqual(["one"]);
    expect(moved[4].memberIds).toEqual(["one"]);
  });
  it("ignores invalid moves", () => {
    expect(movePerson(groups, "missing", "a", "one")).toBe(groups);
    expect(movePerson(groups, "a", "missing", "one")).toBe(groups);
  });
  it("resolves localized public groups in saved member order and hides empty groups", () => {
    const people = [
      { id: "two", name: "Second" },
      { id: "one", name: "First" },
      { id: "three", name: "Third" },
    ];
    const resolved = resolvePeopleGroups(groups, people, "ar");
    expect(resolved.map((g) => g.name)).toEqual(["المتحدثون", "اللجنة"]);
    expect(resolved[0].members.map((p) => p.id)).toEqual(["one", "two"]);
    expect(groupName(groups[2], "ar")).toBe("Empty");
    expect(uniquePeopleIds([...groups, { ...groups[0], id: "d" }])).toEqual([
      "one",
      "two",
      "three",
    ]);
  });
});

describe("people group validation navigation", () => {
  it("routes group errors to the people section from any active section", () => {
    const queue = buildEventFormFixQueue({
      activeSection: "identity",
      errorPaths: ["peopleGroups.0.nameEn"],
    });
    expect(queue[0].sectionId).toBe("trainers");
    expect(queue[0].title).toBe("Check people groups");
  });
});

describe("add an existing person to another group", () => {
  it("preserves the source and appends one target membership", () => {
    const added = addPersonToGroup(groups, "a", "b", "one");
    expect(added[0]).toBe(groups[0]);
    expect(added[1].memberIds).toEqual(["three", "one"]);
    expect(groups[1].memberIds).toEqual(["three"]);
    expect(uniquePeopleIds(added)).toEqual(["one", "two", "three"]);
  });
  it("does not duplicate existing memberships or change order", () => {
    const added = addPersonToGroup(groups, "a", "b", "one");
    expect(addPersonToGroup(added, "a", "b", "one")).toBe(added);
    expect(addPersonToGroup(groups, "a", "a", "one")).toBe(groups);
  });
  it("ignores unknown groups and people not in the source", () => {
    expect(addPersonToGroup(groups, "a", "missing", "one")).toBe(groups);
    expect(addPersonToGroup(groups, "missing", "b", "one")).toBe(groups);
    expect(addPersonToGroup(groups, "a", "b", "missing")).toBe(groups);
  });
  it("renders the person in both groups in the public projection", () => {
    const added = addPersonToGroup(groups, "a", "b", "one");
    const rendered = resolvePeopleGroups(
      added,
      [{ id: "one" }, { id: "two" }, { id: "three" }],
      "en",
    );
    expect(rendered[0].members.map((person) => person.id)).toEqual([
      "one",
      "two",
    ]);
    expect(rendered[1].members.map((person) => person.id)).toEqual([
      "three",
      "one",
    ]);
  });
});
