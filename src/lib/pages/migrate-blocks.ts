import type { Block, HeroCta, HeroSlide } from "./block-types";

type RawBlock = Record<string, unknown> & { id: string; type: string };
type RawSlide = Record<string, unknown> & { id: string };

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function migrateHeroSlide(raw: RawSlide): HeroSlide {
  // Already migrated
  if (Array.isArray(raw.ctas)) return raw as unknown as HeroSlide;
  // Old shape: ctaText / ctaUrl flat fields → ctas array
  const ctas: HeroCta[] = [];
  if (raw.ctaText) {
    ctas.push({ id: uid(), text: raw.ctaText as string, url: (raw.ctaUrl as string) ?? "", style: "primary" });
  }
  return {
    id: raw.id,
    eyebrow: (raw.eyebrow as string) ?? "",
    showCategoryIcons: Boolean(raw.showCategoryIcons),
    heading: (raw.heading as string) ?? "",
    subheading: (raw.subheading as string) ?? "",
    ctas,
  };
}

function migrateHeroBlock(raw: RawBlock): Block {
  if (Array.isArray(raw.slides)) {
    // Slides exist — migrate each slide's CTA shape
    const fallbackEyebrow = (raw.eyebrow as string) ?? "";
    const fallbackShowCategoryIcons = Boolean(raw.showCategoryIcons);
    const slides = (raw.slides as RawSlide[]).map((slide) => {
      const migrated = migrateHeroSlide(slide);
      return {
        ...migrated,
        eyebrow:
          typeof migrated.eyebrow === "string" && migrated.eyebrow.trim()
            ? migrated.eyebrow
            : fallbackEyebrow,
        showCategoryIcons:
          typeof slide.showCategoryIcons === "boolean"
            ? migrated.showCategoryIcons
            : fallbackShowCategoryIcons,
      };
    });
    return {
      ...raw,
      backgroundColor: (raw.backgroundColor as string) ?? "#121414",
      slides,
    } as unknown as Block;
  }
  return {
    id: raw.id,
    type: "hero",
    eyebrow: (raw.eyebrow as string) ?? "",
    fullViewport: true,
    backgroundColor: "#121414",
    overlayColor: "#000000",
    overlayOpacity: 40,
    media: raw.image ? [{ id: uid(), url: raw.image as string, kind: "image" }] : [],
    slides: [
      {
        id: uid(),
        eyebrow: (raw.eyebrow as string) ?? "",
        showCategoryIcons: Boolean(raw.showCategoryIcons),
        heading: (raw.heading as string) ?? "",
        subheading: (raw.subheading as string) ?? "",
        ctas: raw.ctaText
          ? [{ id: uid(), text: raw.ctaText as string, url: (raw.ctaUrl as string) ?? "", style: "primary" as const }]
          : [],
      },
    ],
  } as Block;
}

function migratePageHeroBlock(raw: RawBlock): Block {
  if (Array.isArray(raw.slides)) {
    return {
      ...raw,
      backgroundColor: (raw.backgroundColor as string) ?? "#121414",
    } as unknown as Block;
  }
  return {
    id: raw.id,
    type: "page_hero",
    eyebrow: (raw.eyebrow as string) ?? "",
    fullViewport: false,
    backgroundColor: "#121414",
    overlayColor: "#000000",
    overlayOpacity: 40,
    media: raw.image ? [{ id: uid(), url: raw.image as string, kind: "image" }] : [],
    slides: [
      {
        id: uid(),
        heading: (raw.heading as string) ?? "",
        subheading: (raw.subheading as string) ?? "",
      },
    ],
  } as Block;
}

function migrateAccreditationBarBlock(raw: RawBlock): Block {
  const rawClients = Array.isArray(raw.clients) ? raw.clients : [];
  const clients = rawClients.map((item, index) => {
    if (typeof item === "string") {
      return {
        id: `accreditation-client-${index + 1}`,
        name: item,
        logo: "",
      };
    }
    if (item && typeof item === "object") {
      const candidate = item as Record<string, unknown>;
      return {
        id:
          (typeof candidate.id === "string" && candidate.id.trim()) ||
          `accreditation-client-${index + 1}`,
        name: typeof candidate.name === "string" ? candidate.name : "",
        logo: typeof candidate.logo === "string" ? candidate.logo : "",
      };
    }
    return {
      id: `accreditation-client-${index + 1}`,
      name: "",
      logo: "",
    };
  });

  return {
    ...(raw as unknown as Block),
    type: "accreditation_bar",
    clients,
  } as Block;
}

function migrateTrainingDomainsBlock(raw: RawBlock): Block {
  const rawSize =
    typeof raw.descriptionSize === "string" ? raw.descriptionSize : "md";
  const descriptionSize = (
    ["sm", "md", "lg", "xl", "custom"] as const
  ).includes(rawSize as "sm" | "md" | "lg" | "xl" | "custom")
    ? (rawSize as "sm" | "md" | "lg" | "xl" | "custom")
    : "md";
  const customDescriptionSize =
    typeof raw.customDescriptionSize === "number" &&
    Number.isFinite(raw.customDescriptionSize)
      ? raw.customDescriptionSize
      : 16;

  return {
    ...(raw as unknown as Block),
    type: "training_domains",
    description: typeof raw.description === "string" ? raw.description : "",
    descriptionSize,
    customDescriptionSize,
  } as Block;
}

function migrateAccreditationBlock(raw: RawBlock): Block {
  const legacyPartners = Array.isArray(raw.partners) ? raw.partners : [];
  const logos = legacyPartners.map((item) => {
    if (item && typeof item === "object") {
      const partner = item as Record<string, unknown>;
      return {
        name: typeof partner.name === "string" ? partner.name : "",
        logo: typeof partner.logo === "string" ? partner.logo : "",
        displayMode: "mono" as const,
        size: "md" as const,
      };
    }
    return { name: "", logo: "", displayMode: "mono" as const, size: "md" as const };
  });

  return {
    ...(raw as unknown as Block),
    type: "accreditation",
    heading:
      typeof raw.heading === "string"
        ? raw.heading
        : typeof raw.accredHeading === "string"
          ? raw.accredHeading
          : "",
    description:
      typeof raw.description === "string"
        ? raw.description
        : typeof raw.accredBody === "string"
          ? raw.accredBody
          : "",
    featuredOrgs: Array.isArray(raw.featuredOrgs)
      ? (
          raw.featuredOrgs as Array<{
            name: string;
            summary: string;
            logo?: string;
            displayMode?: "original" | "mono";
            size?: "sm" | "md" | "lg";
          }>
        ).map((item) => ({
          ...item,
          displayMode:
            item.displayMode === "mono" || item.displayMode === "original"
              ? item.displayMode
              : "original",
          size:
            item.size === "sm" || item.size === "md" || item.size === "lg"
              ? item.size
              : "md",
        }))
      : [],
    logosHeading:
      typeof raw.logosHeading === "string"
        ? raw.logosHeading
        : typeof raw.partnersHeading === "string"
          ? raw.partnersHeading
          : "",
    logosDescription:
      typeof raw.logosDescription === "string"
        ? raw.logosDescription
        : typeof raw.partnersBody === "string"
          ? raw.partnersBody
          : "",
    logos:
      Array.isArray(raw.logos) && raw.logos.length > 0
        ? (raw.logos as Array<{ name: string; logo?: string; displayMode: "original" | "mono"; size?: "sm" | "md" | "lg" }>).map((item) => ({
            ...item,
            size:
              item.size === "sm" || item.size === "md" || item.size === "lg"
                ? item.size
                : "md",
          }))
        : logos,
  } as Block;
}

function migrateProcessStepsBlock(raw: RawBlock): Block {
  const mediaKind =
    raw.mediaKind === "video" || raw.mediaKind === "image"
      ? raw.mediaKind
      : "image";
  const mediaSize =
    raw.mediaSize === "sm" || raw.mediaSize === "md" || raw.mediaSize === "lg"
      ? raw.mediaSize
      : "md";

  return {
    ...(raw as unknown as Block),
    type: "process_steps",
    heading: typeof raw.heading === "string" ? raw.heading : "",
    body: typeof raw.body === "string" ? raw.body : "",
    mediaUrl: typeof raw.mediaUrl === "string" ? raw.mediaUrl : "",
    mediaKind,
    mediaSize,
    steps: Array.isArray(raw.steps)
      ? (
          raw.steps as Array<{
            title?: unknown;
            desc?: unknown;
          }>
        ).map((step) => ({
          title: typeof step?.title === "string" ? step.title : "",
          desc: typeof step?.desc === "string" ? step.desc : "",
        }))
      : [],
  } as Block;
}

export function migrateBlocks(raw: unknown[]): Block[] {
  return (raw as RawBlock[]).map((b) => {
    if (b.type === "hero") return migrateHeroBlock(b);
    if (b.type === "page_hero") return migratePageHeroBlock(b);
    if (b.type === "accreditation") return migrateAccreditationBlock(b);
    if (b.type === "accreditation_bar") return migrateAccreditationBarBlock(b);
    if (b.type === "training_domains") return migrateTrainingDomainsBlock(b);
    if (b.type === "process_steps") return migrateProcessStepsBlock(b);
    return b as Block;
  });
}
