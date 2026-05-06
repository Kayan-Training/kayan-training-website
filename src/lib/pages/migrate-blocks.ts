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
  return { id: raw.id, heading: (raw.heading as string) ?? "", subheading: (raw.subheading as string) ?? "", ctas };
}

function migrateHeroBlock(raw: RawBlock): Block {
  if (Array.isArray(raw.slides)) {
    // Slides exist — migrate each slide's CTA shape
    const slides = (raw.slides as RawSlide[]).map(migrateHeroSlide);
    return {
      ...raw,
      backgroundColor: (raw.backgroundColor as string) ?? "#121414",
      slides,
    } as unknown as Block;
  }
  return {
    id: raw.id,
    type: "hero",
    fullViewport: true,
    backgroundColor: "#121414",
    overlayColor: "#000000",
    overlayOpacity: 40,
    media: raw.image ? [{ id: uid(), url: raw.image as string, kind: "image" }] : [],
    slides: [
      {
        id: uid(),
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

export function migrateBlocks(raw: unknown[]): Block[] {
  return (raw as RawBlock[]).map((b) => {
    if (b.type === "hero") return migrateHeroBlock(b);
    if (b.type === "page_hero") return migratePageHeroBlock(b);
    if (b.type === "accreditation_bar") return migrateAccreditationBarBlock(b);
    if (b.type === "training_domains") return migrateTrainingDomainsBlock(b);
    return b as Block;
  });
}
