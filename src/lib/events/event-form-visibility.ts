export type EventFormSectionId =
  | "identity"
  | "schedule"
  | "location"
  | "pricing"
  | "content"
  | "gallery"
  | "agenda"
  | "trainers"
  | "categories"
  | "registrationForm"
  | "registrations";

type EventType = "onsite" | "online" | "hybrid";
type RegistrationType = "internal" | "external";
type PaymentMethods = "both" | "card" | "bank";
type GalleryMode = "always" | "after_passed" | "hidden";

export type EventFormVisibilityInputs = {
  activeSection: EventFormSectionId;
  eventType: EventType;
  galleryMode: GalleryMode;
  isFree: boolean;
  paymentMethods: PaymentMethods;
  registrationType: RegistrationType;
};

export function buildEventFormVisibility(inputs: Omit<EventFormVisibilityInputs, "activeSection">) {
  const {
    eventType,
    galleryMode,
    isFree,
    paymentMethods,
    registrationType,
  } = inputs;

  return {
    showVenueFields: eventType === "onsite" || eventType === "hybrid",
    showOnlineFields: eventType === "online" || eventType === "hybrid",
    showExternalRegistrationUrl: registrationType === "external",
    showRegistrationFormSection: registrationType === "internal",
    showPriceAndPayments: !isFree,
    showBankDetails:
      !isFree && (paymentMethods === "both" || paymentMethods === "bank"),
    showGalleryHiddenNote: galleryMode === "hidden",
  };
}

export function buildEventFormSidebarContext(inputs: EventFormVisibilityInputs) {
  const visibility = buildEventFormVisibility(inputs);
  const { activeSection } = inputs;
  const registrationSections: EventFormSectionId[] = [
    "pricing",
    "registrationForm",
    "registrations",
  ];

  return {
    showClassification: activeSection === "identity",
    showVisibility:
      activeSection === "identity" ||
      activeSection === "content" ||
      activeSection === "gallery" ||
      activeSection === "registrations",
    showPromotion:
      activeSection === "identity" ||
      activeSection === "content" ||
      activeSection === "gallery",
    showRegistrationState: registrationSections.includes(activeSection),
    showCertification:
      activeSection === "identity" ||
      activeSection === "registrationForm" ||
      activeSection === "registrations",
    showRegistrationFormSection: visibility.showRegistrationFormSection,
  };
}

