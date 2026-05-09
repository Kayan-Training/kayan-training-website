export const CATEGORY_ICON_PATHS: Record<string, string> = {
  "continuous-improvement": "/icons/kayan_profile_NEW.svg",
  economy: "/icons/kayan_profile_Economy.svg",
  "education-psychology": "/icons/kayan_profile_Education & Psychology.svg",
  lifestyle: "/icons/kayan_profile_Lifestyle.svg",
  "management-leadership": "/icons/kayan_profile_Management & Leadership.svg",
  "media-communication": "/icons/kayan_profile_Media & Communication.svg",
  tech: "/icons/kayan_profile_Tech.svg",
};

export function getCategoryIconPath(iconOrSlug: string | null | undefined): string {
  if (!iconOrSlug) return "/icons/kayan_profile_NEW.svg";
  return CATEGORY_ICON_PATHS[iconOrSlug] ?? "/icons/kayan_profile_NEW.svg";
}

export function resolveCategoryIconPath(
  primaryIconKey: string | null | undefined,
  fallbackSlugKey: string | null | undefined,
): string {
  if (primaryIconKey && CATEGORY_ICON_PATHS[primaryIconKey]) {
    return CATEGORY_ICON_PATHS[primaryIconKey];
  }
  if (fallbackSlugKey && CATEGORY_ICON_PATHS[fallbackSlugKey]) {
    return CATEGORY_ICON_PATHS[fallbackSlugKey];
  }
  return "/icons/kayan_profile_NEW.svg";
}
