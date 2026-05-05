import type { Block } from "@/lib/pages/block-types";

type Locale = "en" | "ar";

const requiredHomeBlockTypes: Block["type"][] = [
  "hero",
  "accreditation_bar",
  "training_domains",
  "home_events_carousel",
  "home_posts_grid",
  "cta_banner",
];

function makeHomeDefaultBlock(type: Block["type"], locale: Locale): Block | null {
  const isAr = locale === "ar";
  switch (type) {
    case "hero":
      return {
        id: `home-default-${type}`,
        type: "hero",
        fullViewport: true,
        backgroundColor: "#121414",
        overlayColor: "#0c0e0e",
        overlayOpacity: 75,
        grayscaleMedia: true,
        showFeaturedEvent: true,
        media: [],
        slides: [
          {
            id: "home-default-hero-slide-1",
            heading: isAr
              ? "نطوّر الفرق ونُسرّع الأثر المؤسسي"
              : "We Build Teams and Accelerate Institutional Impact",
            subheading: isAr
              ? "برامج تدريب واستشارات تنفيذية مصممة لتحويل المعرفة إلى أداء يومي واضح ونتائج قابلة للقياس."
              : "Applied training and execution consulting that turn knowledge into daily performance and measurable results.",
            ctas: [
              {
                id: "home-default-hero-cta-1",
                text: isAr ? "استعراض الفعاليات" : "Browse Events",
                url: isAr ? "/ar/events" : "/en/events",
                style: "primary",
              },
            ],
          },
        ],
      };
    case "accreditation_bar":
      return {
        id: `home-default-${type}`,
        type: "accreditation_bar",
        eyebrow: isAr ? "معتمدون من" : "Accredited by",
        badgeLabel: "QABA",
        badgeTitle: isAr ? "مزوّد دورات تدريبية معتمد" : "Qualified Approved Course Provider",
        badgeSub: isAr
          ? "اعتراف دولي — معايير محتوى وتقييم دولية"
          : "International recognition — global content & assessment standards",
        clientsHeading: isAr ? "نفخر بثقة كبرى المؤسسات" : "Trusted by leading organizations",
        clients: [
          { id: "home-accreditation-client-1", name: "OQ", logo: "" },
          { id: "home-accreditation-client-2", name: "OXY OMAN", logo: "" },
          {
            id: "home-accreditation-client-3",
            name: isAr ? "وزارة التربية" : "Ministry of Education",
            logo: "",
          },
          { id: "home-accreditation-client-4", name: "OPAL", logo: "" },
          { id: "home-accreditation-client-5", name: "PDO", logo: "" },
          { id: "home-accreditation-client-6", name: "Omantel", logo: "" },
        ],
      };
    case "training_domains":
      return {
        id: `home-default-${type}`,
        type: "training_domains",
        eyebrow: isAr ? "التخصصات" : "Specializations",
        heading: isAr ? "مجالات التدريب الثمانية" : "Eight Training Domains",
      };
    case "home_events_carousel":
      return {
        id: `home-default-${type}`,
        type: "home_events_carousel",
        eyebrow: isAr ? "الفعاليات القادمة" : "Upcoming Events",
        heading: isAr ? "استكشف برامجنا" : "Explore Our Programs",
        limit: 6,
      };
    case "home_posts_grid":
      return {
        id: `home-default-${type}`,
        type: "home_posts_grid",
        eyebrow: isAr ? "المعرفة" : "Knowledge",
        heading: isAr ? "المقالات والمعرفة" : "Articles & Insights",
        limit: 6,
      };
    case "cta_banner":
      return {
        id: `home-default-${type}`,
        type: "cta_banner",
        eyebrow: isAr ? "شريكك في التطوير" : "Your Development Partner",
        heading: isAr
          ? "هل تبحث عن مسار تدريبي مخصص لمؤسستك؟"
          : "Looking for a Custom Training Track for Your Institution?",
        body: isAr
          ? "نُصمم مسارات تطوير مبنية على تشخيص فعلي لاحتياجات فريقك — لا حلولاً جاهزة."
          : "We design development tracks built on an actual diagnosis of your team's needs — no off-the-shelf solutions.",
        buttonText: "training@kayan.om",
        buttonUrl: "mailto:training@kayan.om",
        linkText: isAr ? "استعراض كل الفعاليات →" : "Browse All Events →",
        linkUrl: isAr ? "/ar/events" : "/en/events",
      };
    default:
      return null;
  }
}

export function ensureHomeBlocksComplete(blocks: Block[], locale: Locale): Block[] {
  const existing = new Set(blocks.map((block) => block.type));
  const missing = requiredHomeBlockTypes
    .filter((type) => !existing.has(type))
    .map((type) => makeHomeDefaultBlock(type, locale))
    .filter((block): block is Block => Boolean(block));

  if (missing.length === 0) return blocks;
  return [...blocks, ...missing];
}
