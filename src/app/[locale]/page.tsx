import { ArrowRight01Icon, Calendar03Icon, StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

import { BlockRenderer } from "@/components/pages/block-renderer";
import { FeaturedEventCyclerCard } from "@/components/pages/hero-slider";
import { getLocalizedEvents, getLocalizedPosts, getStaticPageBySlug } from "@/lib/content/queries";
import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { ensureHomeBlocksComplete } from "@/lib/pages/home-blocks";
import { migrateBlocks } from "@/lib/pages/migrate-blocks";

const domains = [
  { accent: "#c2b59b", ar: "الفنون", en: "Arts", img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=700&q=75", icon: "kayan_profile_Arts.svg" },
  { accent: "#03c3cd", ar: "نمط الحياة", en: "Lifestyle", img: "https://images.unsplash.com/photo-1743093278216-adfa4740356b?w=700&q=75", icon: "kayan_profile_Lifestyle.svg" },
  { accent: "#fe732d", ar: "الإدارة والقيادة", en: "Management", img: "https://images.unsplash.com/photo-1597734187998-e1931acfe2ed?w=700&q=75", icon: "kayan_profile_Management & Leadership.svg" },
  { accent: "#2bb673", ar: "الاقتصاد", en: "Economy", img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=700&q=75", icon: "kayan_profile_Economy.svg" },
  { accent: "#3b91ce", ar: "التقنية", en: "Technology", img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=700&q=75", icon: "kayan_profile_Tech.svg" },
  { accent: "#f95061", ar: "الإعلام والاتصال", en: "Media & Comm.", img: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=700&q=75", icon: "kayan_profile_Media & Communication.svg" },
  { accent: "#f4b91d", ar: "النفسي التربوي", en: "Educ. Psychology", img: "https://images.unsplash.com/photo-1597065750970-694c472ee2d2?w=700&q=75", icon: "kayan_profile_Education & Psychology.svg" },
  { accent: "#8787de", ar: "الترفيه", en: "Entertainment", img: "https://images.unsplash.com/photo-1542653700088-680c3095396c?w=700&q=75", icon: "kayan_profile_Entertainment.svg" },
];

function normalizeOrderedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const deduped = new Set<string>();
  for (const id of value) {
    if (typeof id === "string" && id.length > 0) {
      deduped.add(id);
    }
  }
  return Array.from(deduped);
}

function formatDate(date: Date, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  // Try CMS-managed homepage first
  const cmsData = await getStaticPageBySlug(activeLocale, "home");
  if (cmsData?.blocks && Array.isArray(cmsData.blocks) && cmsData.blocks.length > 0) {
    const rawBlocks = (cmsData.blocks as unknown[]).filter(
      (b) => b && typeof b === "object" && "type" in (b as object),
    );
    const blocks = ensureHomeBlocksComplete(migrateBlocks(rawBlocks), activeLocale);

    const needsCategories = blocks.some((b) => b.type === "training_domains");
    let categories: { slug: string; color: string; icon: string; image: string | null; nameEn: string; nameAr: string }[] = [];
    if (needsCategories) {
      const [cats, orderSetting] = await Promise.all([
        db.category.findMany({
          include: { translations: true },
          orderBy: { slug: "asc" },
        }),
        db.setting.findUnique({ where: { key: "categories.order" } }),
      ]);
      const orderedIds = normalizeOrderedIds(orderSetting?.value);
      const byId = new Map(cats.map((cat) => [cat.id, cat]));
      const orderedCats = orderedIds.length > 0
        ? [
            ...orderedIds
              .map((id) => byId.get(id))
              .filter((cat): cat is (typeof cats)[number] => Boolean(cat)),
            ...cats.filter((cat) => !orderedIds.includes(cat.id)),
          ]
        : cats;
      categories = orderedCats.map((cat) => ({
        slug: cat.slug,
        color: cat.color,
        icon: cat.icon,
        image: cat.image,
        nameEn: cat.translations.find((t) => t.locale === "en")?.name ?? cat.slug,
        nameAr: cat.translations.find((t) => t.locale === "ar")?.name ?? cat.slug,
      }));
    }

    return (
      <main>
        <BlockRenderer blocks={blocks} categories={categories} locale={activeLocale} />
      </main>
    );
  }

  // Fallback: hardcoded homepage (until seed runs)
  const [events, posts] = await Promise.all([
    getLocalizedEvents(activeLocale),
    getLocalizedPosts(activeLocale),
  ]);
  const featuredRaw = events.filter((e) => e.isFeatured);
  const featuredEvents = (featuredRaw.length > 0 ? featuredRaw : events.slice(0, 1)).map((e) => ({
    slug: e.slug,
    title: e.title,
    location: e.location,
    startDate: e.startDate.toISOString(),
    coverImage: e.coverImage,
  }));

  return (
    <main>
      <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
        <div className="absolute inset-0 z-0">
          <Image
            alt=""
            className="hero-img object-cover object-[center_30%] grayscale"
            fill
            priority
            sizes="100vw"
            src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1800&q=80"
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(12,14,14,0.97)_0%,rgba(12,14,14,0.85)_40%,rgba(12,14,14,0.5)_100%)]" />
        </div>
        <div className="hero-bg absolute inset-0 z-0 pointer-events-none" />

        <div className="relative z-10 mx-auto grid w-full max-w-[1440px] grid-cols-12 items-center gap-6 px-6 py-20 md:px-10 md:py-28">
          <div className="stagger col-span-12 lg:col-span-7 xl:col-span-6">
            <div className="mb-8 flex items-center gap-3">
              <div className="h-px w-8 bg-secondary" />
              <span className="text-[11px] font-semibold uppercase text-secondary">
                {activeLocale === "ar" ? "كيان للتدريب والاستشارات • عُمان" : "Kayan Training & Consulting • Oman"}
              </span>
            </div>
            <h1 className="text-glow mb-6 text-[clamp(2rem,5.2vw,4.25rem)] font-semibold leading-[1.12] tracking-tight text-on-surface">
              {activeLocale === "ar" ? (
                <>نطوّر الفرق <span className="text-secondary">ونُسرّع</span><br className="hidden sm:block" />الأثر المؤسسي</>
              ) : (
                <>We Build Teams and <span className="text-secondary">Accelerate</span><br className="hidden sm:block" />Institutional Impact</>
              )}
            </h1>
            <p className="mb-10 max-w-[36rem] text-[clamp(0.9rem,1.15vw,1.02rem)] leading-relaxed text-on-surface-variant">
              {activeLocale === "ar"
                ? "برامج تدريب واستشارات تنفيذية مصممة لتحويل المعرفة إلى أداء يومي واضح ونتائج قابلة للقياس."
                : "Applied training and execution consulting that turn knowledge into daily performance and measurable results."}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link className="group flex items-center gap-3 bg-primary px-7 py-4 text-[12px] uppercase tracking-widest text-primary-foreground transition-all duration-300 hover:bg-primary-container hover:text-on-primary-container" href={`/${activeLocale}/events`}>
                <span>{activeLocale === "ar" ? "استعراض الفعاليات" : "Browse Events"}</span>
                <HugeiconsIcon className="rtl:rotate-180" icon={ArrowRight01Icon} size={18} strokeWidth={1.8} />
              </Link>
              <Link className="ghost-border flex items-center gap-3 px-7 py-4 text-[12px] uppercase tracking-widest text-on-surface-variant transition-colors hover:text-on-surface" href={`/${activeLocale}/about`}>
                {activeLocale === "ar" ? "تعرّف علينا" : "About Us"}
              </Link>
            </div>
          </div>

          {featuredEvents.length > 0 && (
            <div className="col-span-12 hidden lg:col-span-5 lg:col-start-8 lg:block xl:col-span-4 xl:col-start-9">
              <FeaturedEventCyclerCard events={featuredEvents} locale={activeLocale} />
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-outline-variant/20 bg-surface py-16 md:py-20">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-6 md:px-10 lg:flex-row lg:items-center lg:gap-16">
          <div className="shrink-0">
            <span className="mb-5 block text-[11px] font-semibold uppercase text-secondary">{activeLocale === "ar" ? "الاعتماد المهني" : "Professional Accreditation"}</span>
            <div className="accred-highlight">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-secondary/40 bg-secondary/15 text-secondary">
                <HugeiconsIcon icon={StarIcon} size={28} strokeWidth={1.5} />
              </div>
              <div>
                <span className="accred-highlight-label">{activeLocale === "ar" ? "معتمد من" : "Approved by"}</span>
                <div className="accred-highlight-title">QABA</div>
                <div className="accred-highlight-sub">{activeLocale === "ar" ? "مزوّد معتمد للدورات التدريبية" : "Qualified Approved Course Provider"}</div>
              </div>
            </div>
          </div>
          <div className="hidden w-px self-stretch bg-outline-variant/25 lg:block" />
          <div className="min-w-0 flex-1">
            <span className="mb-5 block text-[11px] font-semibold uppercase text-on-surface-variant">{activeLocale === "ar" ? "من عملائنا" : "Clients Include"}</span>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              {["OQ", "OXY OMAN", activeLocale === "ar" ? "جهات حكومية" : "Government Entities", activeLocale === "ar" ? "قطاع خاص" : "Private Sector"].map((client) => (
                <span className="font-display text-sm font-black uppercase tracking-widest text-on-surface-variant/50" key={client}>{client}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface py-24 md:py-32">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <div className="mb-14 flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <span className="mb-3 block text-[11px] font-semibold uppercase text-secondary">{activeLocale === "ar" ? "التخصصات" : "Specializations"}</span>
              <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-tight text-on-surface">{activeLocale === "ar" ? "مجالات التدريب" : "Training Domains"}</h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-on-surface-variant">
              {activeLocale === "ar"
                ? "ثمانية مجالات تدريبية متخصصة تغطي احتياجات التطوير المهني والمؤسسي في سلطنة عُمان."
                : "Eight specialized training domains covering professional and institutional development needs across the Sultanate."}
            </p>
          </div>
          <div className="grid grid-cols-2 border border-outline-variant/20 md:grid-cols-4">
            {domains.map((domain, index) => (
              <Link className="group relative min-h-[300px] overflow-hidden border-b border-e border-outline-variant/20 md:min-h-[360px]" href={`/${activeLocale}/services`} key={domain.en}>
                <Image alt={domain.en} className="object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" fill sizes="(max-width: 768px) 50vw, 25vw" src={domain.img} />
                <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-30" style={{ background: domain.accent }} />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(13,15,15,0.96)_0%,rgba(13,15,15,0.6)_50%,rgba(13,15,15,0.2)_100%)]" />
                <div className="relative z-10 flex h-full flex-col justify-between p-6">
                  <div className="flex justify-end opacity-50 transition-opacity duration-500 group-hover:opacity-90">
                    <Image alt="" height={52} src={`/example-assets/${domain.icon}`} width={52} />
                  </div>
                  <div>
                    <span className="mb-2 block font-mono text-[10px] uppercase tracking-widest" style={{ color: domain.accent }}>{String(index + 1).padStart(2, "0")}</span>
                    <h3 className="text-lg font-semibold text-on-surface">{activeLocale === "ar" ? domain.ar : domain.en}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest py-24 md:py-32">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <span className="mb-3 block text-[11px] font-semibold uppercase text-secondary">{activeLocale === "ar" ? "الفعاليات القادمة" : "Upcoming Events"}</span>
              <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-tight">{activeLocale === "ar" ? "برامج مختارة" : "Selected Programs"}</h2>
            </div>
            <Link className="hidden text-xs uppercase tracking-widest text-secondary transition-colors hover:text-primary sm:inline-flex" href={`/${activeLocale}/events`}>
              {activeLocale === "ar" ? "كل الفعاليات" : "All Events"}
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {events.slice(0, 5).map((event) => (
              <Link className="group relative min-h-[420px] w-[280px] flex-none overflow-hidden ghost-border transition-all duration-300 hover:-translate-y-1 hover:border-secondary/40 sm:w-[340px]" href={`/${activeLocale}/events/${event.slug}`} key={event.slug}>
                <Image alt={event.title} className="object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" fill sizes="340px" src={event.coverImage} />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(13,15,15,0.97)_0%,rgba(13,15,15,0.5)_56%,rgba(13,15,15,0.1)_100%)]" />
                <div className="relative z-10 flex h-full flex-col justify-between p-5">
                  <span className="badge-teal w-fit font-body">{event.isFeatured ? (activeLocale === "ar" ? "مميّز" : "Featured") : (activeLocale === "ar" ? "تدريب" : "Training")}</span>
                  <div>
                    <h3 className="mb-4 line-clamp-3 text-lg font-semibold leading-snug transition-colors group-hover:text-secondary">{event.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <HugeiconsIcon icon={Calendar03Icon} size={14} strokeWidth={1.8} />
                      {formatDate(event.startDate, activeLocale)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-24 md:py-32">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <span className="mb-3 block text-[11px] font-semibold uppercase text-secondary">{activeLocale === "ar" ? "المعرفة" : "Knowledge"}</span>
              <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-tight">{activeLocale === "ar" ? "أحدث المقالات" : "Latest Posts"}</h2>
            </div>
            <Link className="text-xs uppercase tracking-widest text-secondary transition-colors hover:text-primary" href={`/${activeLocale}/blog`}>
              {activeLocale === "ar" ? "كل المقالات" : "All Posts"}
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {posts.slice(0, 3).map((post) => (
              <Link className="ghost-border group block bg-surface-container-highest p-6 transition-colors hover:border-secondary/40" href={`/${activeLocale}/blog/${post.slug}`} key={post.slug}>
                <h3 className="mb-3 line-clamp-2 text-lg font-semibold transition-colors group-hover:text-secondary">{post.title}</h3>
                <p className="line-clamp-3 text-sm leading-relaxed text-on-surface-variant">{post.excerpt || "..."}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
