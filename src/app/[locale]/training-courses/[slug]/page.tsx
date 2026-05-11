import {
  ArrowRight01Icon,
  Calendar03Icon,
  Clock01Icon,
  Location01Icon,
  TelephoneIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { FeaturedCountdown } from "@/components/events/featured-countdown";
import { ProgramGallery } from "@/components/events/program-gallery";
import { PhoneText } from "@/components/ui/phone-text";
import {
  getEventDetailBySlug,
  getLocalizedEvents,
} from "@/lib/content/queries";
import { isSupportedLocale } from "@/lib/i18n/config";
import { getServerSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const event = await getEventDetailBySlug(activeLocale, slug, { kind: "training_course" });
  if (!event) return {};
  return {
    title: event.seoTitle || event.title,
    description: event.seoDescription || undefined,
    openGraph: {
      title: event.seoTitle || event.title,
      images: event.coverImage ? [event.coverImage] : [],
    },
  };
}

function formatDate(date: Date, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-GB", {
    dateStyle: "long",
  }).format(date);
}

function formatTimeRange(startDate: Date, endDate: Date, locale: "ar" | "en") {
  const formatter = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-OM" : "en-GB",
    {
      hour: "numeric",
      minute: "2-digit",
    },
  );
  return `${formatter.format(startDate)} – ${formatter.format(endDate)}`;
}

function hasExplicitTime(startDate: Date, endDate: Date): boolean {
  const hasStartTime =
    startDate.getUTCHours() !== 0 ||
    startDate.getUTCMinutes() !== 0 ||
    startDate.getUTCSeconds() !== 0 ||
    startDate.getUTCMilliseconds() !== 0;
  const hasEndTime =
    endDate.getUTCHours() !== 0 ||
    endDate.getUTCMinutes() !== 0 ||
    endDate.getUTCSeconds() !== 0 ||
    endDate.getUTCMilliseconds() !== 0;
  return hasStartTime || hasEndTime;
}

function renderDescription(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object" && "html" in value) {
    const html = (value as { html: unknown }).html;
    if (typeof html === "string" && html.trim()) return html;
  }
  return fallback ? `<p>${fallback}</p>` : "";
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: typeof Calendar03Icon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <HugeiconsIcon
        className="shrink-0 text-secondary"
        icon={icon}
        size={18}
        strokeWidth={1.8}
      />
      <div>
        <div className="mb-0.5 text-[10px] uppercase tracking-widest text-on-surface-variant">
          {label}
        </div>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}

function RegisterCard({
  basePath,
  event,
  isPastProgram,
  locale,
  slug,
}: {
  basePath: "events" | "training-courses";
  event: NonNullable<Awaited<ReturnType<typeof getEventDetailBySlug>>>;
  isPastProgram: boolean;
  locale: "ar" | "en";
  slug: string;
}) {
  const contentNoun = locale === "ar" ? "الدورة" : "course";
  const capacity = event.capacity ?? 0;
  const taken = event.registrationsCount;
  const progress = capacity
    ? Math.min(100, Math.round((taken / capacity) * 100))
    : 0;
  const priceLabel = event.isFree
    ? locale === "ar"
      ? "مجاني"
      : "Free"
    : `${event.price} OMR`;

  const registrationHref =
    event.registrationType === "external" && event.externalRegistrationUrl
      ? event.externalRegistrationUrl
      : `/${locale}/${basePath}/${slug}/register`;

  return (
    <div className="bg-surface-container-highest ghost-border p-7">
      <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-primary">
        {locale === "ar" ? "سجّل الآن" : "Register Now"}
      </div>
      {!isPastProgram ? (
        <div className="mb-6 flex items-baseline gap-2">
          <span className="font-mono text-3xl font-semibold text-on-surface">
            {priceLabel}
          </span>
        </div>
      ) : null}
      {capacity ? (
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-on-surface-variant">
              {locale === "ar" ? "المقاعد المتبقية" : "Seats Remaining"}
            </span>
            <span className="font-semibold text-secondary">
              {Math.max(0, capacity - taken)} / {capacity}
            </span>
          </div>
          <div className="h-1 bg-surface-container-low">
            <div
              className="h-1 bg-secondary"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}
      {isPastProgram ? (
        <p className="rounded border border-outline-variant/30 bg-surface-container px-4 py-3 text-center text-xs text-on-surface-variant">
          {locale === "ar" ? "انتهى موعد هذا البرنامج." : "This program has already concluded."}
        </p>
      ) : (
        <>
          <Link
            className="mb-3 flex w-full items-center justify-center gap-2 bg-primary py-4 text-xs uppercase tracking-widest text-primary-foreground transition-colors hover:bg-secondary"
            href={registrationHref}
            rel={event.registrationType === "external" ? "noreferrer" : undefined}
            target={event.registrationType === "external" ? "_blank" : undefined}
          >
            {event.registrationType === "external"
              ? (locale === "ar" ? "التسجيل عبر الرابط الخارجي" : "Register Externally")
              : (locale === "ar" ? `التسجيل في ${contentNoun}` : `Register for ${contentNoun}`)}
          </Link>
          <p className="text-center text-[10px] text-on-surface-variant">
            {locale === "ar"
              ? "سيتم إرسال تأكيد التسجيل عبر البريد الإلكتروني."
              : "Registration confirmation is sent by email."}
          </p>
        </>
      )}
    </div>
  );
}

export default async function TrainingCourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const [event, session] = await Promise.all([
    getEventDetailBySlug(activeLocale, slug, { kind: "training_course" }),
    getServerSession(),
  ]);

  if (!event) notFound();
  const basePath: "training-courses" = "training-courses";
    const related = await getLocalizedEvents(activeLocale, 48, {
    kind: "training_course",
  });

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const showTime = hasExplicitTime(startDate, endDate);
  const isPastProgram = endDate.getTime() < Date.now();
  const showGallery =
    event.galleryMode === "always" ||
    (event.galleryMode === "after_passed" && isPastProgram);
  const descriptionHtml = renderDescription(
    event.description,
    event.excerpt ?? "",
  );
  const adminEdit =
    session?.user?.role === "admin" ? (
      <Link
        className="ghost-border inline-flex items-center px-4 py-2 text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary"
        href={`/${activeLocale}/dashboard/programs/${event.id}`}
      >
        {activeLocale === "ar" ? "تحرير الدورة" : "Edit Training Course"}
      </Link>
    ) : null;

  if (event.isFeatured) {
    return (
      <main>
        <section className="relative flex min-h-screen items-end overflow-hidden pt-16">
          <div className="absolute inset-0 z-0 overflow-hidden">
            <Image
              alt={event.title}
              className="object-cover grayscale"
              fill
              priority
              sizes="100vw"
              src={event.coverImage}
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(12,14,14,1)_0%,rgba(12,14,14,0.7)_50%,rgba(12,14,14,0.3)_100%)]" />
          </div>
          <div className="featured-hero-bg pointer-events-none absolute inset-0 z-0" />
          <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 pb-16 md:px-10 md:pb-24">
            <div className="stagger max-w-3xl">
              <div className="mb-6 flex items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-secondary">
                  {event.location ||
                    (activeLocale === "ar" ? "مسقط، عُمان" : "Muscat, Oman")}
                </span>
                {adminEdit}
              </div>
              <h1 className="text-glow mb-8 text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-tight tracking-tight text-on-surface">
                {event.title}
              </h1>
              <div className="mb-10">
                <p className="mb-4 text-xs uppercase tracking-widest text-on-surface-variant">
                  {activeLocale === "ar"
                    ? "تنطلق الدورة خلال"
                    : "Training starts in"}
                </p>
                <FeaturedCountdown
                  locale={activeLocale}
                  targetIso={startDate.toISOString()}
                />
              </div>
              <div className="flex flex-wrap gap-4">
                {!isPastProgram ? (
                  <Link
                    className="flex items-center gap-2 bg-secondary px-8 py-4 text-xs uppercase tracking-widest text-surface-dim transition-colors hover:bg-primary"
                    href={
                      event.registrationType === "external" && event.externalRegistrationUrl
                        ? event.externalRegistrationUrl
                        : `/${activeLocale}/${basePath}/${slug}/register`
                    }
                    rel={event.registrationType === "external" ? "noreferrer" : undefined}
                    target={event.registrationType === "external" ? "_blank" : undefined}
                  >
                    {event.registrationType === "external"
                      ? (activeLocale === "ar" ? "سجّل عبر الرابط الخارجي" : "Register via External Link")
                      : (activeLocale === "ar" ? "سجّل مكانك الآن" : "Reserve Your Seat Now")}
                    <HugeiconsIcon
                      className="rtl:rotate-180"
                      icon={ArrowRight01Icon}
                      size={16}
                      strokeWidth={1.8}
                    />
                  </Link>
                ) : null}
                <a
                  className="ghost-border flex items-center gap-2 px-8 py-4 text-xs uppercase tracking-widest text-on-surface-variant transition-colors hover:text-on-surface"
                  href="#details"
                >
                  {activeLocale === "ar" ? "تفاصيل الدورة" : "Course Details"}
                </a>
              </div>
            </div>
          </div>
        </section>

        <div className="border-y border-primary/20 bg-primary-container">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-6 px-6 py-6 md:grid-cols-4 md:px-10">
            {[
              [
                event.capacity ? `+${event.capacity}` : "+120",
                activeLocale === "ar" ? "مشارك متوقع" : "Expected Attendees",
              ],
              [
                event.trainers.length || 1,
                activeLocale === "ar" ? "متحدثاً خبيراً" : "Expert Speakers",
              ],
              [
                event.agenda.length || 1,
                activeLocale === "ar" ? "جلسات" : "Sessions",
              ],
              [1, activeLocale === "ar" ? "يوم" : "Full Day"],
            ].map(([value, label]) => (
              <div className="text-center" key={label}>
                <div className="mb-1 font-mono text-2xl font-semibold text-secondary">
                  {value}
                </div>
                <div className="text-[11px] uppercase tracking-widest text-on-surface-variant">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <section
          id="details"
          className="mx-auto grid max-w-[1440px] grid-cols-12 gap-10 px-6 py-16 md:px-10 md:py-24"
        >
          <div className="col-span-12 lg:col-span-7">
            <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
              {activeLocale === "ar" ? "عن الدورة" : "About the Course"}
            </span>
            <h2 className="mb-6 text-3xl font-semibold leading-tight md:text-4xl">
              {activeLocale === "ar"
                ? "لماذا هذه الدورة مختلفة؟"
                : "Why Is This Course Different?"}
            </h2>
            <div className="mb-10 flex flex-col gap-4 text-sm leading-relaxed text-on-surface-variant">
              <div
                className="prose prose-invert prose-img:rounded-[12px] prose-img:border prose-sm max-w-none prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </div>
            <AgendaAndTrainers event={event} locale={activeLocale} />
            {showGallery && event.gallery.length > 0 ? (
              <ProgramGallery items={event.gallery} locale={activeLocale} />
            ) : null}
          </div>
          <aside className="col-span-12 lg:col-span-5">
            <div className="sticky top-24 flex flex-col gap-4">
              <RegisterCard basePath={basePath} event={event} isPastProgram={isPastProgram} locale={activeLocale} slug={slug} />
              <EventMetaCard
                event={event}
                locale={activeLocale}
                showTime={showTime}
                startDate={startDate}
                endDate={endDate}
              />
            </div>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="pt-16">
      <div className="relative h-64 overflow-hidden md:h-96">
        <Image
          alt={event.title}
          className="object-cover object-[center_30%] grayscale"
          fill
          priority
          sizes="100vw"
          src={event.coverImage}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(18,20,20,0.3)_0%,rgba(18,20,20,0.95)_100%)]" />
        <div className="absolute bottom-6 start-6 flex items-center gap-3 md:start-10">
          <span className="badge-teal font-body">
            {activeLocale === "ar" ? "دورة تدريبية" : "Training Course"}
          </span>
          {adminEdit}
        </div>
      </div>
      <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-10 px-6 py-10 md:px-10 md:py-16">
        <article className="col-span-12 lg:col-span-8">
          <div className="mb-6 flex items-center gap-2 text-xs text-on-surface-variant">
            <Link className="hover:text-on-surface" href={`/${activeLocale}`}>
              {activeLocale === "ar" ? "الرئيسية" : "Home"}
            </Link>
            <span className="text-outline">/</span>
            <Link
              className="hover:text-on-surface"
              href={`/${activeLocale}/${basePath}`}
            >
              {basePath === "training-courses"
                ? activeLocale === "ar" ? "الدورات التدريبية" : "Training Courses"
                : activeLocale === "ar" ? "الفعاليات" : "Events"}
            </Link>
            <span className="text-outline">/</span>
            <span className="text-secondary">{event.title}</span>
          </div>
          <h1 className="mb-6 text-[clamp(1.75rem,4vw,3rem)] font-semibold leading-tight tracking-tight text-on-surface">
            {event.title}
          </h1>
          <div className="mb-10 flex flex-wrap items-center gap-5 border-b border-outline-variant/20 pb-8">
            <MetaInline
              icon={Calendar03Icon}
              value={formatDate(startDate, activeLocale)}
            />
            {showTime ? (
              <MetaInline
                icon={Clock01Icon}
                value={formatTimeRange(startDate, endDate, activeLocale)}
              />
            ) : null}
            {event.location ? (
              <MetaInline icon={Location01Icon} value={event.location} />
            ) : null}
            {event.capacity ? (
              <MetaInline
                icon={UserGroupIcon}
                value={`${Math.max(0, event.capacity - event.registrationsCount)} ${activeLocale === "ar" ? "مقعداً متاحاً" : "seats available"}`}
              />
            ) : null}
          </div>
          <div
            className="prose prose-invert prose-img:rounded-[12px] prose-img:border prose-sm max-w-none mb-10 text-sm prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
          <AgendaAndTrainers event={event} locale={activeLocale} />
          {showGallery && event.gallery.length > 0 ? (
            <ProgramGallery items={event.gallery} locale={activeLocale} />
          ) : null}
        </article>
        <aside className="col-span-12 lg:col-span-4">
          <div className="sticky top-24 flex flex-col gap-4">
            <RegisterCard basePath={basePath} event={event} isPastProgram={isPastProgram} locale={activeLocale} slug={slug} />
            <EventMetaCard
              event={event}
              locale={activeLocale}
              showTime={showTime}
              startDate={startDate}
              endDate={endDate}
            />
          </div>
        </aside>
      </div>
      <section className="mx-auto max-w-[1440px] px-6 pb-16 md:px-10">
        <h2 className="mb-6 border-b border-outline-variant/20 pb-3 text-xl font-semibold">
          {activeLocale === "ar" ? "دورات أخرى قد تهمك" : "Other Training Courses You May Like"}
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {related
            .filter((item) => item.slug !== slug)
            .slice(0, 4)
            .map((item) => (
              <Link
                className="group w-[260px] flex-none bg-surface-container-highest ghost-border transition-colors hover:border-secondary/30"
                href={`/${activeLocale}/${basePath}/${item.slug}`}
                key={item.slug}
              >
                <div className="relative h-32 overflow-hidden">
                  <Image
                    alt={item.title}
                    className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
                    fill
                    sizes="260px"
                    src={item.coverImage}
                  />
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-secondary">
                    {item.title}
                  </h3>
                  <p className="mt-2 font-mono text-xs text-on-surface-variant">
                    {formatDate(item.startDate, activeLocale)}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
}

function MetaInline({
  icon,
  value,
}: {
  icon: typeof Calendar03Icon;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-on-surface-variant">
      <HugeiconsIcon icon={icon} size={16} strokeWidth={1.8} />
      <span className="text-sm">{value}</span>
    </div>
  );
}

function EventMetaCard({
  event,
  locale,
  showTime,
  startDate,
  endDate,
}: {
  event: NonNullable<Awaited<ReturnType<typeof getEventDetailBySlug>>>;
  locale: "ar" | "en";
  showTime: boolean;
  startDate: Date;
  endDate: Date;
}) {
  return (
    <div className="flex flex-col gap-4 bg-surface-container-lowest p-6 ghost-border">
      <DetailItem
        icon={Calendar03Icon}
        label={locale === "ar" ? "التاريخ" : "Date"}
        value={formatDate(startDate, locale)}
      />
      {showTime ? (
        <DetailItem
          icon={Clock01Icon}
          label={locale === "ar" ? "الوقت" : "Time"}
          value={formatTimeRange(startDate, endDate, locale)}
        />
      ) : null}
      {event.location ? (
        <DetailItem
          icon={Location01Icon}
          label={locale === "ar" ? "المكان" : "Venue"}
          value={event.location}
        />
      ) : null}
      <DetailItem
        icon={TelephoneIcon}
        label={locale === "ar" ? "للاستفسار" : "Enquiries"}
        value={<PhoneText>+968 9538 3138</PhoneText>}
      />
    </div>
  );
}

function AgendaAndTrainers({
  event,
  locale,
}: {
  event: NonNullable<Awaited<ReturnType<typeof getEventDetailBySlug>>>;
  locale: "ar" | "en";
}) {
  return (
    <>
      {event.agenda.length ? (
        <div className="mb-10">
          <h2 className="mb-6 border-b border-outline-variant/20 pb-3 text-xl font-semibold">
            {locale === "ar" ? "جدول الأعمال" : "Agenda"}
          </h2>
          <div className="flex flex-col gap-1">
            {event.agenda.map((item, index) => (
              <div
                className={`flex gap-5 p-4 ${index % 2 ? "bg-surface-container-low" : "bg-surface-container-lowest"}`}
                key={`${item.day}-${item.time}-${item.title}`}
              >
                <span
                  className="w-20 shrink-0 pt-0.5 font-mono text-xs text-secondary"
                  dir="ltr"
                >
                  {item.time}
                </span>
                <div>
                  <div className="text-sm font-semibold">{item.title}</div>
                  {item.trainerName ? (
                    <div className="mt-1 text-xs text-on-surface-variant">
                      {item.trainerName}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {event.trainers.length ? (
        <div className="mb-10">
          <h2 className="mb-6 border-b border-outline-variant/20 pb-3 text-xl font-semibold">
            {locale === "ar" ? "المدربون" : "Trainers"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {event.trainers.map((trainer) => (
              <div
                className="flex items-center gap-5 bg-surface-container-lowest p-5 ghost-border"
                key={trainer.name}
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden">
                  <Image
                    alt={trainer.name}
                    className="object-cover grayscale"
                    fill
                    sizes="64px"
                    src={trainer.image}
                  />
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold">{trainer.name}</h3>
                  <p className="text-xs text-on-surface-variant">
                    {trainer.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {event.categories.length ? (
        <div>
          <h2 className="mb-4 border-b border-outline-variant/20 pb-3 text-xl font-semibold">
            {locale === "ar" ? "مجالات التدريب" : "Training Areas"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {event.categories.map((category) => (
              <span className="badge-teal font-body" key={category.label} style={{ background: `${category.color}2a`, borderColor: `${category.color}66`, color: category.color }}>
                {category.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}


