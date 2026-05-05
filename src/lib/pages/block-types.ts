export type HeroMedia = {
  id: string;
  url: string;
  kind: "image" | "video";
};

export type HeroCta = {
  id: string;
  text: string;
  url: string;
  style: "primary" | "secondary";
};

export type HeroSlide = {
  id: string;
  heading: string;
  subheading: string;
  ctas: HeroCta[];
};

export type PageHeroSlide = {
  id: string;
  heading: string;
  subheading: string;
  ctaText?: string;
  ctaUrl?: string;
};

export type PageHeroBlock = {
  type: "page_hero";
  eyebrow: string;
  fullViewport: boolean;
  backgroundColor: string;
  overlayColor: string;
  overlayOpacity: number;
  media: HeroMedia[];
  slides: PageHeroSlide[];
};

export type AboutIntroBlock = {
  type: "about_intro";
  body: string;
  metricsHeading: string;
  metrics: Array<{ label: string; value: string }>;
  ctaText: string;
  ctaUrl: string;
};

export type MissionVisionBlock = {
  type: "mission_vision";
  items: Array<{ title: string; body: string }>;
};

export type ProcessStepsBlock = {
  type: "process_steps";
  heading: string;
  body: string;
  steps: Array<{ title: string; desc: string }>;
};

export type ValuesListBlock = {
  type: "values_list";
  eyebrow: string;
  heading: string;
  items: Array<{ title: string; desc: string }>;
};

export type AccreditationBlock = {
  type: "accreditation";
  accredHeading: string;
  accredBody: string;
  badgeLabel: string;
  badgeTitle: string;
  badgeSub: string;
  partnersHeading: string;
  partnersBody: string;
  partners: Array<{ name: string; logo?: string }>;
};

export type ServiceCardsBlock = {
  type: "service_cards";
  items: Array<{ badge: string; title: string; desc: string; image: string }>;
};

export type TrainingDomainsBlock = {
  type: "training_domains";
  eyebrow: string;
  heading: string;
};

export type CtaBannerBlock = {
  type: "cta_banner";
  eyebrow: string;
  heading: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
  linkText: string;
  linkUrl: string;
};

export type RichTextBlock = {
  type: "richtext";
  html: string;
};

export type HeroBlock = {
  type: "hero";
  fullViewport: boolean;
  backgroundColor: string;
  overlayColor: string;
  overlayOpacity: number;
  media: HeroMedia[];
  slides: HeroSlide[];
  showFeaturedEvent?: boolean;
  grayscaleMedia?: boolean;
};

export type AccreditationBarBlock = {
  type: "accreditation_bar";
  eyebrow: string;
  badgeLabel: string;
  badgeTitle: string;
  badgeSub: string;
  clientsHeading: string;
  clients: string[];
};

export type HomeEventsCarouselBlock = {
  type: "home_events_carousel";
  eyebrow: string;
  heading: string;
  limit: number;
};

export type HomePostsGridBlock = {
  type: "home_posts_grid";
  eyebrow: string;
  heading: string;
  limit: number;
};

export type CtaBlock = {
  type: "cta";
  heading: string;
  text: string;
  buttonText: string;
  buttonUrl: string;
};

export type ListingConfigBlock = {
  type: "listing_config";
  eyebrow: string;
  heading: string;
  subheading: string;
  resultsPerPage: number;
};

export type Block = (
  | PageHeroBlock
  | AboutIntroBlock
  | MissionVisionBlock
  | ProcessStepsBlock
  | ValuesListBlock
  | AccreditationBlock
  | ServiceCardsBlock
  | TrainingDomainsBlock
  | CtaBannerBlock
  | RichTextBlock
  | HeroBlock
  | AccreditationBarBlock
  | HomeEventsCarouselBlock
  | HomePostsGridBlock
  | CtaBlock
  | ListingConfigBlock
) & { id: string };

export const SYSTEM_PAGE_SLUGS = [
  "home",
  "about",
  "services",
  "events",
  "posts",
  "knowledge",
  "privacy",
  "terms",
] as const;

export type SystemPageSlug = (typeof SYSTEM_PAGE_SLUGS)[number];

export function isSystemPage(slug: string): boolean {
  return (SYSTEM_PAGE_SLUGS as readonly string[]).includes(slug);
}
