import Image from "next/image";
import Link from "next/link";

import { getLocalizedEvents, getLocalizedPosts } from "@/lib/content/queries";
import { cn } from "@/lib/utils";
import type {
  AboutIntroBlock,
  AccreditationBarBlock,
  AccreditationBlock,
  Block,
  CtaBannerBlock,
  CtaBlock,
  HeroBlock,
  HomeEventsCarouselBlock,
  HomePostsGridBlock,
  ListingConfigBlock,
  MissionVisionBlock,
  PageHeroBlock,
  ProcessStepsBlock,
  RichTextBlock,
  ServiceCardsBlock,
  TrainingDomainsBlock,
  ValuesListBlock,
} from "@/lib/pages/block-types";
import { type FeaturedEventCard, HeroSlider } from "./hero-slider";
import { HomeEventsCarouselRail } from "./home-events-carousel-rail";

type Category = {
  slug: string;
  color: string;
  nameEn: string;
  nameAr: string;
};

type BlockRendererProps = {
  blocks: Block[];
  locale: "ar" | "en";
  categories?: Category[];
};

function PageHeroRenderer({ block }: { block: PageHeroBlock }) {
  const bgUrl = (block.media ?? [])[0]?.url;
  const slide = (block.slides ?? [])[0];
  const overlayAlpha = (block.overlayOpacity ?? 40) / 100;
  return (
    <section
      className={`relative overflow-hidden bg-surface-container-lowest${block.fullViewport ? " min-h-screen" : " py-16 md:py-24"} flex items-center`}
      style={{ backgroundColor: block.backgroundColor || "#121414" }}
    >
      {bgUrl && (
        <>
          <div
            className="absolute inset-0"
            style={{ background: `url('${bgUrl}') center/cover no-repeat` }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: block.overlayColor ?? "#000000",
              opacity: overlayAlpha,
            }}
          />
        </>
      )}
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 py-16 md:px-10 md:py-24">
        {block.eyebrow && (
          <span className="section-kicker">{block.eyebrow}</span>
        )}
        {slide?.heading && (
          <h1
            className="mb-4 font-black tracking-tight text-on-surface"
            style={{ fontSize: "clamp(2.4rem,5vw,4rem)" }}
          >
            {slide.heading}
          </h1>
        )}
        {slide?.subheading && (
          <p className="mb-6 max-w-2xl text-sm text-on-surface-variant">
            {slide.subheading}
          </p>
        )}
        {slide?.ctaText && slide?.ctaUrl && (
          <Link
            className="inline-flex items-center gap-3 bg-primary-container px-7 py-4 text-[12px] uppercase tracking-widest text-on-primary-container transition-all duration-300 hover:bg-secondary hover:text-surface-dim"
            href={slide.ctaUrl}
          >
            {slide.ctaText}
          </Link>
        )}
      </div>
    </section>
  );
}

function AboutIntroRenderer({
  block,
  locale,
}: {
  block: AboutIntroBlock;
  locale: "ar" | "en";
}) {
  return (
    <section className="mx-auto grid max-w-[1440px] grid-cols-12 gap-8 px-6 py-14 md:px-10">
      <div
        className="col-span-12 space-y-5 text-sm leading-relaxed text-on-surface-variant lg:col-span-7"
        dangerouslySetInnerHTML={{ __html: block.body }}
      />
      <aside className="col-span-12 space-y-4 lg:col-span-5">
        {block.metricsHeading && (
          <div className="ghost-border bg-surface-container-highest p-6">
            <h3 className="mb-4 text-xl font-bold">{block.metricsHeading}</h3>
            <div className="space-y-4">
              {block.metrics.map((m, i) => (
                <div className="flex justify-between" key={i}>
                  <span className="text-sm text-on-surface-variant">
                    {m.label}
                  </span>
                  <span className="font-mono text-secondary">{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {block.ctaText && block.ctaUrl && (
          <Link
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary transition-all hover:gap-4"
            href={block.ctaUrl}
          >
            {block.ctaText}
            <div className="h-px w-8 bg-primary" />
          </Link>
        )}
      </aside>
    </section>
  );
}

function MissionVisionRenderer({ block }: { block: MissionVisionBlock }) {
  return (
    <section className="mx-auto max-w-[1440px] grid grid-cols-1 gap-4 px-6 pb-14 md:grid-cols-3 md:px-10">
      {block.items.map((item, i) => (
        <div className="ghost-border bg-surface-container-lowest p-6" key={i}>
          <h3 className="mb-3 text-lg font-bold">{item.title}</h3>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            {item.body}
          </p>
        </div>
      ))}
    </section>
  );
}

function ProcessStepsRenderer({ block }: { block: ProcessStepsBlock }) {
  return (
    <section className="mx-auto max-w-[1440px] px-6 pb-16 md:px-10">
      <div className="ghost-border grid grid-cols-1 gap-8 bg-surface-container-highest p-7 md:p-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="mb-4 text-3xl font-black leading-tight">
            {block.heading}
          </h2>
          {block.body && (
            <p className="text-sm leading-relaxed text-on-surface-variant">
              {block.body}
            </p>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
          {block.steps.map((step, i) => (
            <div className="bg-surface-container-lowest p-5" key={i}>
              <div className="mb-2 font-mono text-secondary">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mb-1 font-semibold">{step.title}</div>
              <div className="text-xs text-on-surface-variant">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ValuesListRenderer({ block }: { block: ValuesListBlock }) {
  return (
    <section className="bg-surface-container-lowest py-16 md:py-20">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <div className="grid grid-cols-12 gap-10 md:gap-16">
          <div className="col-span-12 lg:col-span-4">
            {block.eyebrow && (
              <span className="section-kicker">{block.eyebrow}</span>
            )}
            <h2
              className="font-black tracking-tight leading-tight text-on-surface"
              style={{ fontSize: "clamp(1.8rem,3.5vw,3rem)" }}
            >
              {block.heading}
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <div className="border-t border-outline-variant/25">
              {block.items.map((item, i) => (
                <div
                  className="group flex cursor-default items-start gap-6 border-b border-outline-variant/20 px-6 py-5 transition-colors hover:bg-surface-container-low lg:px-0"
                  key={i}
                >
                  <span className="mt-1 w-5 shrink-0 font-mono text-[10px] tracking-widest text-secondary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h4 className="mb-1 text-sm font-bold text-on-surface transition-colors group-hover:text-secondary">
                      {item.title}
                    </h4>
                    <p className="text-xs leading-relaxed text-on-surface-variant">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AccreditationRenderer({ block }: { block: AccreditationBlock }) {
  return (
    <section className="bg-surface py-16 md:py-20">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 md:px-10 lg:grid-cols-2 lg:gap-16">
        <div>
          {block.accredHeading && (
            <h2
              className="mb-6 font-black tracking-tight text-on-surface"
              style={{ fontSize: "clamp(1.6rem,3vw,2.5rem)" }}
            >
              {block.accredHeading}
            </h2>
          )}
          {block.accredBody && (
            <p className="mb-8 text-sm leading-relaxed text-on-surface-variant">
              {block.accredBody}
            </p>
          )}
          <div className="accred-highlight">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-secondary/40 bg-secondary/12">
              <svg
                fill="none"
                height="32"
                viewBox="0 0 28 28"
                width="32"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14 2L17.5 8.5L25 9.5L19.5 15L21 22.5L14 19L7 22.5L8.5 15L3 9.5L10.5 8.5L14 2Z"
                  fill="rgba(40,180,115,0.15)"
                  stroke="#28b473"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
                <path
                  d="M10 14L13 17L18 11"
                  stroke="#28b473"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </div>
            <div>
              {block.badgeLabel && (
                <span className="accred-highlight-label">
                  {block.badgeLabel}
                </span>
              )}
              {block.badgeTitle && (
                <div className="accred-highlight-title">{block.badgeTitle}</div>
              )}
              {block.badgeSub && (
                <div className="accred-highlight-sub">{block.badgeSub}</div>
              )}
            </div>
          </div>
        </div>
        <div>
          {block.partnersHeading && (
            <h2
              className="mb-6 font-black tracking-tight text-on-surface"
              style={{ fontSize: "clamp(1.6rem,3vw,2.5rem)" }}
            >
              {block.partnersHeading}
            </h2>
          )}
          {block.partnersBody && (
            <p className="mb-8 text-sm leading-relaxed text-on-surface-variant">
              {block.partnersBody}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {block.partners.map((p, i) => (
              <div
                className="ghost-border flex min-h-20 flex-col items-center justify-center gap-2 p-5"
                key={i}
              >
                {p.logo ? (
                  <Image
                    alt={p.name}
                    className="max-h-10 w-auto object-contain opacity-70 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
                    height={40}
                    src={p.logo}
                    width={120}
                  />
                ) : (
                  <span className="font-display text-sm font-black uppercase tracking-widest text-on-surface-variant">
                    {p.name}
                  </span>
                )}
                {p.logo && p.name && (
                  <span className="text-[10px] text-on-surface-variant/50 tracking-widest uppercase">
                    {p.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceCardsRenderer({ block }: { block: ServiceCardsBlock }) {
  return (
    <section className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 px-6 py-12 md:px-10 lg:grid-cols-3">
      {block.items.map((item, i) => (
        <article
          className="ghost-border group relative min-h-[420px] overflow-hidden"
          key={i}
        >
          {item.image && (
            <>
              <Image
                alt=""
                className="absolute inset-0 object-cover grayscale transition-all duration-700 group-hover:scale-100 group-hover:grayscale-0"
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                src={item.image}
                style={{ scale: "1.05" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface/95 via-surface/55 to-surface/30" />
            </>
          )}
          <div className="relative z-10 flex h-full flex-col justify-end p-8">
            {item.badge && (
              <span className="badge-teal mb-3 w-fit font-body">
                {item.badge}
              </span>
            )}
            <h2 className="mb-3 text-2xl font-bold">{item.title}</h2>
            <p className="text-sm text-on-surface-variant">{item.desc}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

type TrainingDomainItem = {
  slug: string;
  color: string;
  nameEn: string;
  nameAr: string;
  accent: string;
  img: string;
  icon: string;
};

const DOMAIN_IMAGES: Record<string, { accent: string; img: string }> = {
  arts: {
    accent: "#c2b59b",
    img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=70",
  },
  lifestyle: {
    accent: "#03c3cd",
    img: "https://images.unsplash.com/photo-1743093278216-adfa4740356b?w=600&q=70",
  },
  "management-leadership": {
    accent: "#fe732d",
    img: "https://images.unsplash.com/photo-1597734187998-e1931acfe2ed?w=600&q=70",
  },
  economy: {
    accent: "#2bb673",
    img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=70",
  },
  tech: {
    accent: "#3b91ce",
    img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=70",
  },
  "media-communication": {
    accent: "#f95061",
    img: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&q=70",
  },
  "education-psychology": {
    accent: "#f4b91d",
    img: "https://images.unsplash.com/photo-1597065750970-694c472ee2d2?w=600&q=70",
  },
  entertainment: {
    accent: "#8787de",
    img: "https://images.unsplash.com/photo-1542653700088-680c3095396c?w=600&q=70",
  },
};

function TrainingDomainsRenderer({
  block,
  locale,
  categories = [],
}: {
  block: TrainingDomainsBlock;
  locale: "ar" | "en";
  categories: Category[];
}) {
  const items: TrainingDomainItem[] = categories.map((cat) => ({
    slug: cat.slug,
    color: cat.color,
    nameEn: cat.nameEn,
    nameAr: cat.nameAr,
    accent: DOMAIN_IMAGES[cat.slug]?.accent ?? "#a3cddb",
    img:
      DOMAIN_IMAGES[cat.slug]?.img ??
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=70",
    icon: `/icons/kayan_profile_${cat.slug === "management-leadership" ? "Management & Leadership" : cat.slug === "media-communication" ? "Media & Communication" : cat.slug === "education-psychology" ? "Education & Psychology" : cat.slug.charAt(0).toUpperCase() + cat.slug.slice(1)}.svg`,
  }));

  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <div className="mb-12">
          {block.eyebrow && (
            <span className="section-kicker">{block.eyebrow}</span>
          )}
          <h2
            className="font-black tracking-tight text-on-surface"
            style={{ fontSize: "clamp(1.8rem,3.5vw,3rem)" }}
          >
            {block.heading}
          </h2>
        </div>
        <div className="grid grid-cols-2 border border-outline-variant/20 md:grid-cols-4">
          {items.map((domain, index) => (
            <Link
              className="group relative min-h-[300px] md:min-h-[360px] overflow-hidden border-b border-e border-outline-variant/20"
              href={`/${locale}/services`}
              key={domain.slug}
            >
              <Image
                alt={locale === "ar" ? domain.nameAr : domain.nameEn}
                className="absolute inset-0 object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                src={domain.img}
              />
              <div
                className="absolute inset-0 opacity-0 transition-all duration-500 group-hover:opacity-35"
                style={{ background: domain.accent }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(13,15,15,0.96)_0%,rgba(13,15,15,0.55)_60%,rgba(13,15,15,0.15)_100%)]" />
              <div className="relative z-10 flex h-full flex-col justify-between p-5">
                <div className="flex justify-end opacity-50 transition-opacity duration-500 group-hover:opacity-100">
                  <Image alt="" height={52} src={domain.icon} width={52} />
                </div>
                <div>
                  <span
                    className="mb-1 block font-mono text-[10px] tracking-widest"
                    style={{ color: domain.accent }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-bold text-[18px] text-on-surface">
                    {locale === "ar" ? domain.nameAr : domain.nameEn}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBannerRenderer({
  block,
  locale,
}: {
  block: CtaBannerBlock;
  locale: "ar" | "en";
}) {
  return (
    <section className="relative overflow-hidden bg-surface-dim py-20 md:py-28">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right,rgba(40,180,115,0.035) 0,rgba(40,180,115,0.035) 1px,transparent 1px,transparent 100px)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-[1440px] px-6 md:px-10">
        <div className="relative border border-outline-variant/25 p-10 md:p-14">
          <div className="absolute start-0 top-0 h-px w-20 bg-secondary" />
          <div className="absolute bottom-0 end-0 h-px w-20 bg-secondary/30" />
          <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
            <div className="max-w-[36rem]">
              {block.eyebrow && (
                <span className="mb-5 block font-body text-[10px] font-bold uppercase text-secondary">
                  {block.eyebrow}
                </span>
              )}
              <h2
                className="mb-4 font-black leading-[1.18] text-on-surface"
                style={{ fontSize: "clamp(1.6rem,3.2vw,2.75rem)" }}
              >
                {block.heading}
              </h2>
              {block.body && (
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  {block.body}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
              {block.buttonText && block.buttonUrl && (
                <Link
                  className="inline-flex items-center gap-3 bg-secondary px-8 py-4 font-body text-xs font-bold uppercase tracking-widest text-surface-dim transition-colors hover:bg-primary"
                  href={block.buttonUrl}
                >
                  {block.buttonText}
                </Link>
              )}
              {block.linkText && block.linkUrl && (
                <Link
                  className="font-body text-[11px] uppercase tracking-widest text-on-surface-variant transition-colors hover:text-secondary"
                  href={block.linkUrl}
                >
                  {block.linkText}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RichTextRenderer({ block }: { block: RichTextBlock }) {
  return (
    <section className="mx-auto max-w-[920px] px-6 py-12 md:px-10 md:py-16">
      <article
        className="prose prose-neutral max-w-none prose-invert [&_a]:text-primary hover:[&_a]:text-secondary [&_h2]:border-b [&_h2]:border-outline-variant/20 [&_h2]:pb-2"
        dangerouslySetInnerHTML={{ __html: block.html }}
      />
    </section>
  );
}

async function HeroBlockRenderer({
  block,
  locale,
}: {
  block: HeroBlock;
  locale: "ar" | "en";
}) {
  let featuredEvents: FeaturedEventCard[] = [];
  if (block.showFeaturedEvent) {
    const events = await getLocalizedEvents(locale, 10);
    const featured = events.filter((e) => e.isFeatured);
    const source = featured.length > 0 ? featured : events.slice(0, 1);
    featuredEvents = source.map((ev) => ({
      slug: ev.slug,
      title: ev.title,
      location: ev.location,
      startDate: ev.startDate.toISOString(),
      coverImage: ev.coverImage,
    }));
  }
  return (
    <HeroSlider block={block} featuredEvents={featuredEvents} locale={locale} />
  );
}

async function AccreditationBarRenderer({
  block,
  locale,
}: {
  block: AccreditationBarBlock;
  locale: "ar" | "en";
}) {
  const clients = (block.clients ?? []).filter(
    (client) => (client.name ?? "").trim() || (client.logo ?? "").trim(),
  );
  const useMarquee = clients.length >= 6;
  const useGrid = clients.length >= 3 && clients.length <= 5;
  const marqueeClients = useMarquee ? [...clients, ...clients] : [];

  const logoClassName =
    "h-10 w-auto max-w-[9rem] object-contain grayscale brightness-0 invert opacity-80 transition-opacity duration-300 hover:opacity-100";

  return (
    <section className="border-y border-outline-variant/20 bg-surface py-16 md:py-20">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-6 md:px-10 lg:flex-row lg:items-center lg:gap-16">
        <div className="shrink-0">
          {block.eyebrow && (
            <span className="mb-5 block text-[11px] font-semibold uppercase text-secondary">
              {block.eyebrow}
            </span>
          )}
          <div className="accred-highlight">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-secondary/40 bg-secondary/15 text-secondary">
              <svg
                fill="none"
                height="28"
                viewBox="0 0 28 28"
                width="28"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14 2L17.5 8.5L25 9.5L19.5 15L21 22.5L14 19L7 22.5L8.5 15L3 9.5L10.5 8.5L14 2Z"
                  fill="rgba(40,180,115,0.15)"
                  stroke="#28b473"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
                <path
                  d="M10 14L13 17L18 11"
                  stroke="#28b473"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </div>
            <div>
              {block.badgeLabel && (
                <span className="accred-highlight-label">
                  {block.badgeLabel}
                </span>
              )}
              {block.badgeTitle && (
                <div className="accred-highlight-title">{block.badgeTitle}</div>
              )}
              {block.badgeSub && (
                <div className="accred-highlight-sub">{block.badgeSub}</div>
              )}
            </div>
          </div>
        </div>
        <div className="hidden w-px self-stretch bg-outline-variant/25 lg:block" />
        <div className="min-w-0 flex-1">
          {block.clientsHeading && (
            <span className="mb-5 block text-[11px] font-semibold uppercase tracking-[0.3em] text-on-surface-variant">
              {block.clientsHeading}
            </span>
          )}
          {clients.length === 0 ? null : useMarquee ? (
            <div className="accreditation-logo-marquee" dir={locale === "ar" ? "rtl" : "ltr"}>
              <div className="accreditation-logo-track">
                {marqueeClients.map((client, index) => (
                  <div
                    aria-hidden={index >= clients.length}
                    className="inline-flex items-center gap-3"
                    key={`${client.id}-${index}`}
                  >
                    {client.logo ? (
                      <Image
                        alt={client.name || "Organization logo"}
                        className={logoClassName}
                        height={40}
                        src={client.logo}
                        width={160}
                      />
                    ) : null}
                    {client.name ? (
                      <span className="font-display text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant/70">
                        {client.name}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : useGrid ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {clients.map((client) => (
                <div className="flex items-center gap-3 rounded-md border border-outline-variant/20 px-3 py-2" key={client.id}>
                  {client.logo ? (
                    <Image
                      alt={client.name || "Organization logo"}
                      className={logoClassName}
                      height={40}
                      src={client.logo}
                      width={160}
                    />
                  ) : null}
                  {client.name ? (
                    <span className="font-display text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant/70">
                      {client.name}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-5">
              {clients.map((client) => (
                <div className="inline-flex items-center gap-3" key={client.id}>
                  {client.logo ? (
                    <Image
                      alt={client.name || "Organization logo"}
                      className={logoClassName}
                      height={40}
                      src={client.logo}
                      width={160}
                    />
                  ) : null}
                  {client.name ? (
                    <span className="font-display text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant/70">
                      {client.name}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

async function HomeEventsCarouselRenderer({
  block,
  locale,
}: {
  block: HomeEventsCarouselBlock;
  locale: "ar" | "en";
}) {
  const events = await getLocalizedEvents(locale, block.limit ?? 5);

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  return (
    <section className="bg-surface-container-lowest py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            {block.eyebrow && (
              <span className="mb-3 block text-[11px] font-semibold uppercase text-secondary">
                {block.eyebrow}
              </span>
            )}
            <h2
              className="font-semibold leading-tight"
              style={{ fontSize: "clamp(2rem,4vw,3.2rem)" }}
            >
              {block.heading}
            </h2>
          </div>
          <Link
            className="hidden text-xs uppercase tracking-widest text-secondary transition-colors hover:text-primary sm:inline-flex"
            href={`/${locale}/events`}
          >
            {locale === "ar" ? "كل الفعاليات" : "All Events"}
          </Link>
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            {locale === "ar" ? "لا توجد فعاليات." : "No events."}
          </p>
        ) : (
          <HomeEventsCarouselRail
            items={events.map((event) => ({
              coverImage: event.coverImage,
              dateLabel: formatDate(event.startDate),
              slug: event.slug,
              tag: event.isFeatured
                ? locale === "ar"
                  ? "مميّز"
                  : "Featured"
                : locale === "ar"
                  ? "تدريب"
                  : "Training",
              title: event.title,
            }))}
            locale={locale}
          />
        )}
      </div>
    </section>
  );
}

async function HomePostsGridRenderer({
  block,
  locale,
}: {
  block: HomePostsGridBlock;
  locale: "ar" | "en";
}) {
  const posts = await getLocalizedPosts(locale, block.limit ?? 3);
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);

  return (
    <section className="bg-surface py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            {block.eyebrow && (
              <span className="mb-3 block text-[11px] font-semibold uppercase text-secondary">
                {block.eyebrow}
              </span>
            )}
            <h2
              className="font-semibold leading-tight"
              style={{ fontSize: "clamp(2rem,4vw,3.2rem)" }}
            >
              {block.heading}
            </h2>
          </div>
          <Link
            className="text-xs uppercase tracking-widest text-secondary transition-colors hover:text-primary"
            href={`/${locale}/posts`}
          >
            {locale === "ar" ? "كل المقالات" : "All Posts"}
          </Link>
        </div>
        {posts.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            {locale === "ar" ? "لا توجد مقالات." : "No posts."}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {posts.map((post) => (
              <Link
                className="group relative block min-h-[420px] overflow-hidden ghost-border transition-all duration-300 hover:-translate-y-1 hover:border-secondary/40"
                href={`/${locale}/posts/${post.slug}`}
                key={post.slug}
              >
                {post.image ? (
                  <Image
                    alt={post.title}
                    className="object-cover grayscale transition-[filter] duration-500 group-hover:grayscale-0"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    src={post.image}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(145deg,#151818_0%,#1b2a25_60%,#0f1212_100%)]" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(13,15,15,0.97)_0%,rgba(13,15,15,0.58)_56%,rgba(13,15,15,0.12)_100%)]" />
                <div className="relative z-10 flex h-full flex-col justify-end p-5">
                  <span className="badge-teal mb-3 w-fit font-body">
                    {locale === "ar" ? "معرفة" : "Knowledge"}
                  </span>
                  <h3 className="mb-3 line-clamp-3 text-xl font-semibold leading-snug transition-colors group-hover:text-secondary">
                    {post.title}
                  </h3>
                  <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-on-surface-variant">
                    {post.excerpt || (locale === "ar" ? "..." : "...")}
                  </p>
                  <div className="text-xs text-on-surface-variant">
                    {formatDate(post.publishedAt)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CtaBlockRenderer({ block }: { block: CtaBlock }) {
  return (
    <section className="bg-surface-container py-16">
      <div className="mx-auto max-w-[1440px] px-6 text-center md:px-10">
        <h2 className="mb-4 text-3xl font-black">{block.heading}</h2>
        {block.text && (
          <p className="mb-8 text-sm text-on-surface-variant">{block.text}</p>
        )}
        {block.buttonText && block.buttonUrl && (
          <Link
            className="inline-flex items-center gap-3 bg-secondary px-8 py-4 text-xs font-bold uppercase tracking-widest text-surface-dim transition-colors hover:bg-primary"
            href={block.buttonUrl}
          >
            {block.buttonText}
          </Link>
        )}
      </div>
    </section>
  );
}

export function BlockRenderer({
  blocks,
  locale,
  categories = [],
}: BlockRendererProps) {
  return (
    <>
      {blocks.map((block) => {
        switch (block.type) {
          case "page_hero":
            return <PageHeroRenderer block={block} key={block.id} />;
          case "about_intro":
            return (
              <AboutIntroRenderer
                block={block}
                key={block.id}
                locale={locale}
              />
            );
          case "mission_vision":
            return <MissionVisionRenderer block={block} key={block.id} />;
          case "process_steps":
            return <ProcessStepsRenderer block={block} key={block.id} />;
          case "values_list":
            return <ValuesListRenderer block={block} key={block.id} />;
          case "accreditation":
            return <AccreditationRenderer block={block} key={block.id} />;
          case "service_cards":
            return <ServiceCardsRenderer block={block} key={block.id} />;
          case "training_domains":
            return (
              <TrainingDomainsRenderer
                block={block}
                categories={categories}
                key={block.id}
                locale={locale}
              />
            );
          case "cta_banner":
            return (
              <CtaBannerRenderer block={block} key={block.id} locale={locale} />
            );
          case "richtext":
            return <RichTextRenderer block={block} key={block.id} />;
          case "hero":
            return (
              <HeroBlockRenderer block={block} key={block.id} locale={locale} />
            );
          case "accreditation_bar":
            return (
              <AccreditationBarRenderer
                block={block}
                key={block.id}
                locale={locale}
              />
            );
          case "home_events_carousel":
            return (
              <HomeEventsCarouselRenderer
                block={block}
                key={block.id}
                locale={locale}
              />
            );
          case "home_posts_grid":
            return (
              <HomePostsGridRenderer
                block={block}
                key={block.id}
                locale={locale}
              />
            );
          case "cta":
            return <CtaBlockRenderer block={block} key={block.id} />;
          case "listing_config":
            return null;
          default:
            return null;
        }
      })}
    </>
  );
}
