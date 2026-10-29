import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EventFormValues } from "../_components/event-form";

const mocks = vi.hoisted(() => {
  const tx = {
    event: { update: vi.fn().mockResolvedValue({ id: "event-1" }) },
    eventTranslation: { upsert: vi.fn() },
    eventTrainer: { deleteMany: vi.fn(), createMany: vi.fn() },
    agendaSession: { deleteMany: vi.fn(), createMany: vi.fn() },
    eventCategory: { deleteMany: vi.fn(), createMany: vi.fn() },
    registrationFormField: { deleteMany: vi.fn(), create: vi.fn() },
    eventPriceTier: { deleteMany: vi.fn(), create: vi.fn() },
    eventContactNumber: { deleteMany: vi.fn(), createMany: vi.fn() },
    eventDownload: { deleteMany: vi.fn(), createMany: vi.fn() },
    eventSidebarCta: { deleteMany: vi.fn(), createMany: vi.fn() },
  };
  return {
    tx,
    transaction: vi.fn(
      async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    ),
    create: vi.fn().mockResolvedValue({ id: "created" }),
    session: vi.fn().mockResolvedValue({ user: { role: "admin" } }),
    revalidate: vi.fn(),
    redirect: vi.fn(),
  };
});
vi.mock("@/lib/db", () => ({
  db: { $transaction: mocks.transaction, event: { create: mocks.create } },
}));
vi.mock("@/lib/session", () => ({ requireAdminSession: mocks.session }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
import { createEventAction, updateEventAction } from "../_actions";

function values(): EventFormValues {
  return {
    agenda: [],
    priceTiers: [],
    contactNumbers: [],
    downloads: [],
    sidebarCtas: [],
    categories: [],
    registrationFields: [],
    galleryMediaIds: [],
    pricingHeadingEn: "",
    pricingHeadingAr: "",
    capacity: "",
    contentAr: "",
    contentEn: "",
    coverImage: "",
    heroProgramLogo: "",
    heroCollaboratorLogos: "",
    heroPeopleLabelAr: "",
    heroPeopleLabelEn: "",
    featuredSessionsStat: "",
    featuredFullDayStat: "",
    heroTagsAr: "",
    heroTagsEn: "",
    showSidebarSeatsFulfillment: true,
    showSidebarPayment: true,
    endDate: "2026-11-01T17:00",
    eventKind: "event",
    googleMapsLink: "",
    isCertified: false,
    isFeatured: false,
    isFree: true,
    language: "both",
    location: "",
    locationEn: "",
    locationAr: "",
    meetingLink: "",
    meetingPlatform: "zoom",
    galleryMode: "hidden",
    paymentMethods: "both",
    registrationType: "internal",
    externalRegistrationUrl: "",
    bankAccountName: "",
    bankName: "",
    bankIban: "",
    bankSwift: "",
    bankInstructionsEn: "",
    bankInstructionsAr: "",
    price: "0",
    registrationDeadline: "",
    registrationsOpen: true,
    registrationOpenLabelEn: "",
    registrationOpenLabelAr: "",
    seoDescriptionAr: "",
    seoDescriptionEn: "",
    seoTitleAr: "",
    seoTitleEn: "",
    seoImageAr: "",
    seoImageEn: "",
    showMapEmbed: false,
    shortAr: "",
    shortEn: "",
    slug: "example",
    startDate: "2026-11-01T09:00",
    status: "draft",
    titleAr: "مثال",
    titleEn: "Example",
    type: "onsite",
    trainerIds: ["outdated-id"],
    peopleGroups: [
      {
        id: "one",
        nameEn: "Speakers",
        nameAr: "",
        memberIds: ["ada", "tariq"],
      },
      { id: "two", nameEn: "Organizers", nameAr: "", memberIds: ["tariq"] },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ user: { role: "admin" } });
});
describe("people group persistence", () => {
  it("writes metadata and the unique assignment union in the same transaction", async () => {
    const payload = values();
    expect(await updateEventAction("event-1", "en", payload)).toEqual({});
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(
      mocks.tx.event.update.mock.calls[0][0].data.bankTransferDetails
        .peopleGroups,
    ).toEqual({ version: 1, groups: payload.peopleGroups });
    expect(mocks.tx.eventTrainer.createMany).toHaveBeenCalledWith({
      data: [
        { eventId: "event-1", trainerId: "ada", sortOrder: 0 },
        { eventId: "event-1", trainerId: "tariq", sortOrder: 1 },
      ],
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/ar/events/example");
    expect(mocks.revalidate).toHaveBeenCalledWith(
      "/en/training-courses/example",
    );
  });
  it("rejects duplicate memberships before writing anything", async () => {
    const payload = values();
    payload.peopleGroups[0].memberIds = ["ada", "ada"];
    expect((await updateEventAction("event-1", "en", payload)).error).toContain(
      "once",
    );
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect((await createEventAction("en", payload)).error).toContain("once");
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("persists explicit empty groups and removes the assignment union", async () => {
    const payload = values();
    payload.peopleGroups = [];
    expect(await updateEventAction("event-1", "en", payload)).toEqual({});
    expect(
      mocks.tx.event.update.mock.calls[0][0].data.bankTransferDetails
        .peopleGroups.groups,
    ).toEqual([]);
    expect(mocks.tx.eventTrainer.deleteMany).toHaveBeenCalledWith({
      where: { eventId: "event-1" },
    });
    expect(mocks.tx.eventTrainer.createMany).not.toHaveBeenCalled();
  });
  it("creates groups and assignments in the same nested create", async () => {
    const payload = values();
    await createEventAction("en", payload);
    expect(
      mocks.create.mock.calls[0][0].data.bankTransferDetails.peopleGroups
        .groups,
    ).toEqual(payload.peopleGroups);
    expect(mocks.create.mock.calls[0][0].data.trainers.create).toEqual([
      { trainerId: "ada", sortOrder: 0 },
      { trainerId: "tariq", sortOrder: 1 },
    ]);
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/en/dashboard/programs/created",
    );
  });
  it("does not invalidate pages or claim success when membership persistence fails", async () => {
    mocks.tx.eventTrainer.createMany.mockRejectedValueOnce(
      new Error("Missing person"),
    );
    expect(await updateEventAction("event-1", "en", values())).toEqual({
      error: "Missing person",
    });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("requires an admin session", async () => {
    mocks.session.mockResolvedValueOnce(null);
    expect(await updateEventAction("event-1", "en", values())).toEqual({
      error: "Unauthorized",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
