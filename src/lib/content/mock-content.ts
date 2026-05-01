/**
 * Locale-based sample content used until CMS data wiring is completed.
 */
export type LocalizedCard = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  seoTitle?: string;
  seoDescription?: string;
};

const eventContent = {
  ar: [
    { id: "mock-event-1", slug: "design-leadership", title: "برنامج القيادة التصميمية", excerpt: "تجربة تدريبية مكثفة للقادة.", seoTitle: "برنامج القيادة التصميمية", seoDescription: "تفاصيل برنامج القيادة التصميمية من كيان." },
    { id: "mock-event-2", slug: "media-strategy", title: "استراتيجية الإعلام المؤسسي", excerpt: "مسار متخصص للفرق التنفيذية.", seoTitle: "استراتيجية الإعلام المؤسسي", seoDescription: "فعالية متخصصة في الإعلام المؤسسي." }
  ],
  en: [
    { id: "mock-event-1", slug: "design-leadership", title: "Design Leadership Program", excerpt: "An intensive leadership training track.", seoTitle: "Design Leadership Program", seoDescription: "Details for Kayan's design leadership program." },
    { id: "mock-event-2", slug: "media-strategy", title: "Institutional Media Strategy", excerpt: "A specialist path for executive teams.", seoTitle: "Institutional Media Strategy", seoDescription: "A specialist event for executive media strategy." }
  ]
} satisfies Record<"ar" | "en", LocalizedCard[]>;

const postContent = {
  ar: [{ slug: "future-of-training", title: "مستقبل التدريب المؤسسي", excerpt: "قراءة في توجهات التعلم الحديثة.", seoTitle: "مستقبل التدريب المؤسسي", seoDescription: "مقال حول توجهات التدريب المؤسسي الحديثة." }],
  en: [{ slug: "future-of-training", title: "The Future of Corporate Training", excerpt: "A perspective on modern learning trends.", seoTitle: "The Future of Corporate Training", seoDescription: "Article on modern trends in corporate training." }]
} satisfies Record<"ar" | "en", LocalizedCard[]>;

export function getEvents(locale: "ar" | "en") {
  return eventContent[locale];
}

export function getPosts(locale: "ar" | "en") {
  return postContent[locale];
}
