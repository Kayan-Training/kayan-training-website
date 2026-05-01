/**
 * Seed script for required startup data.
 *
 * Seeds:
 * - category taxonomy + translations from SVG assets
 * - baseline users for dashboard testing
 * - sample media assets
 * - sample events and rich-text posts with localized content
 *
 * All writes are idempotent to support repeated local/dev execution.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({
    connectionString: process.env.DATABASE_URL ?? "postgres://invalid:invalid@localhost:5432/invalid",
  }),
});

type CategorySeed = {
  slug: string;
  iconFile: string;
  color: string;
  arName: string;
  enName: string;
  arDescription: string;
  enDescription: string;
};

const categorySeeds: CategorySeed[] = [
  {
    slug: "arts",
    iconFile: "kayan_profile_Arts.svg",
    color: "oklch(0.8 0.09 183)",
    arName: "الفنون",
    enName: "Arts",
    arDescription: "برامج ومبادرات الفنون الإبداعية.",
    enDescription: "Programs and initiatives for creative arts.",
  },
  {
    slug: "education-psychology",
    iconFile: "kayan_profile_Education & Psychology.svg",
    color: "oklch(0.78 0.08 212)",
    arName: "التعليم وعلم النفس",
    enName: "Education & Psychology",
    arDescription: "حلول تعليمية وتطبيقات سلوكية وعلمية.",
    enDescription: "Educational solutions and applied behavioral sciences.",
  },
  {
    slug: "tech",
    iconFile: "kayan_profile_Tech.svg",
    color: "oklch(0.74 0.14 240)",
    arName: "التقنية",
    enName: "Tech",
    arDescription: "برامج التقنية والتحول الرقمي.",
    enDescription: "Technology and digital transformation programs.",
  },
  {
    slug: "media-communication",
    iconFile: "kayan_profile_Media & Communication.svg",
    color: "oklch(0.77 0.12 330)",
    arName: "الإعلام والاتصال",
    enName: "Media & Communication",
    arDescription: "مهارات الإعلام وبناء الرسائل المؤثرة.",
    enDescription: "Media capabilities and high-impact communication.",
  },
  {
    slug: "entertainment",
    iconFile: "kayan_profile_Entertainment.svg",
    color: "oklch(0.82 0.12 45)",
    arName: "الترفيه",
    enName: "Entertainment",
    arDescription: "مبادرات وتجارب قطاع الترفيه.",
    enDescription: "Initiatives and experiences for the entertainment sector.",
  },
  {
    slug: "management-leadership",
    iconFile: "kayan_profile_Management & Leadership.svg",
    color: "oklch(0.73 0.11 150)",
    arName: "الإدارة والقيادة",
    enName: "Management & Leadership",
    arDescription: "تطوير قيادي وممارسات إدارية متقدمة.",
    enDescription: "Leadership development and advanced management practice.",
  },
  {
    slug: "lifestyle",
    iconFile: "kayan_profile_Lifestyle.svg",
    color: "oklch(0.8 0.09 95)",
    arName: "نمط الحياة",
    enName: "Lifestyle",
    arDescription: "برامج الرفاه وجودة الحياة.",
    enDescription: "Wellbeing and lifestyle quality programs.",
  },
  {
    slug: "economy",
    iconFile: "kayan_profile_Economy.svg",
    color: "oklch(0.76 0.1 55)",
    arName: "الاقتصاد",
    enName: "Economy",
    arDescription: "محتوى اقتصادي واتجاهات سوقية.",
    enDescription: "Economic content and market-facing insights.",
  },
];

async function readIcon(iconFile: string) {
  const iconPath = path.join(process.cwd(), "assets", iconFile);
  return readFile(iconPath, "utf8");
}

async function upsertCategory(seed: CategorySeed) {
  const iconSvg = await readIcon(seed.iconFile);

  const category = await prisma.category.upsert({
    where: { slug: seed.slug },
    update: {
      icon: iconSvg,
      color: seed.color,
    },
    create: {
      slug: seed.slug,
      icon: iconSvg,
      color: seed.color,
    },
  });

  await prisma.categoryTranslation.upsert({
    where: {
      categoryId_locale: {
        categoryId: category.id,
        locale: "ar",
      },
    },
    update: {
      name: seed.arName,
      description: seed.arDescription,
    },
    create: {
      categoryId: category.id,
      locale: "ar",
      name: seed.arName,
      description: seed.arDescription,
    },
  });

  await prisma.categoryTranslation.upsert({
    where: {
      categoryId_locale: {
        categoryId: category.id,
        locale: "en",
      },
    },
    update: {
      name: seed.enName,
      description: seed.enDescription,
    },
    create: {
      categoryId: category.id,
      locale: "en",
      name: seed.enName,
      description: seed.enDescription,
    },
  });
}

async function main() {
  const adminPasswordHash = await hashPassword("Admin@123456");
  const editorPasswordHash = await hashPassword("Editor@123456");
  const learnerPasswordHash = await hashPassword("Learner@123456");

  for (const seed of categorySeeds) {
    await upsertCategory(seed);
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin@kayan.local" },
    update: { name: "Kayan Admin", role: "admin", preferredLocale: "en", password: adminPasswordHash },
    create: {
      name: "Kayan Admin",
      email: "admin@kayan.local",
      role: "admin",
      preferredLocale: "en",
      emailVerified: true,
      password: adminPasswordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: "editor@kayan.local" },
    update: { name: "Kayan Editor", role: "admin", preferredLocale: "ar", password: editorPasswordHash },
    create: {
      name: "Kayan Editor",
      email: "editor@kayan.local",
      role: "admin",
      preferredLocale: "ar",
      emailVerified: true,
      password: editorPasswordHash,
    },
  });

  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: admin.id,
      },
    },
    update: {
      userId: admin.id,
      password: adminPasswordHash,
    },
    create: {
      userId: admin.id,
      providerId: "credential",
      accountId: admin.id,
      password: adminPasswordHash,
    },
  });

  const editor = await prisma.user.findUniqueOrThrow({
    where: { email: "editor@kayan.local" },
    select: { id: true },
  });

  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: editor.id,
      },
    },
    update: {
      userId: editor.id,
      password: editorPasswordHash,
    },
    create: {
      userId: editor.id,
      providerId: "credential",
      accountId: editor.id,
      password: editorPasswordHash,
    },
  });

  const learner = await prisma.user.findUniqueOrThrow({
    where: { email: "learner@kayan.local" },
    select: { id: true },
  });

  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: learner.id,
      },
    },
    update: {
      userId: learner.id,
      password: learnerPasswordHash,
    },
    create: {
      userId: learner.id,
      providerId: "credential",
      accountId: learner.id,
      password: learnerPasswordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: "learner@kayan.local" },
    update: { name: "Demo Learner", role: "user", preferredLocale: "en", password: learnerPasswordHash },
    create: {
      name: "Demo Learner",
      email: "learner@kayan.local",
      role: "user",
      preferredLocale: "en",
      emailVerified: true,
      password: learnerPasswordHash,
    },
  });

  const mediaRecords = await Promise.all(
    [
      {
        filename: "hero-event-1.jpg",
        originalName: "hero-event-1.jpg",
        url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1400&q=80",
      },
      {
        filename: "hero-event-2.jpg",
        originalName: "hero-event-2.jpg",
        url: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=1400&q=80",
      },
      {
        filename: "post-ai.jpg",
        originalName: "post-ai.jpg",
        url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1400&q=80",
      },
    ].map(async (asset) => {
      const existing = await prisma.media.findFirst({
        where: { filename: asset.filename },
      });

      if (existing) {
        return prisma.media.update({
          where: { id: existing.id },
          data: {
            originalName: asset.originalName,
            url: asset.url,
            mimeType: "image/jpeg",
            size: 420_000,
            uploadedById: admin.id,
            width: 1400,
            height: 900,
          },
        });
      }

      return prisma.media.create({
        data: {
          ...asset,
          mimeType: "image/jpeg",
          size: 420_000,
          uploadedById: admin.id,
          width: 1400,
          height: 900,
        },
      });
    }),
  );

  const trainerSeeds = [
    {
      email: "sara.harthi@kayan.local",
      nameAr: "د. سارة الحارثي",
      nameEn: "Dr. Sara Al-Harthi",
      specializationAr: "القيادة التنفيذية",
      specializationEn: "Executive Leadership",
    },
    {
      email: "khaled.balushi@kayan.local",
      nameAr: "خالد البلوشي",
      nameEn: "Khaled Al-Balushi",
      specializationAr: "الاستراتيجية والتحول",
      specializationEn: "Strategy & Transformation",
    },
    {
      email: "layan.qasimi@kayan.local",
      nameAr: "ليان القاسمي",
      nameEn: "Layan Al-Qasimi",
      specializationAr: "الإعلام الرقمي",
      specializationEn: "Digital Media",
    },
    {
      email: "omar.riyami@kayan.local",
      nameAr: "عمر الريامي",
      nameEn: "Omar Al-Riyami",
      specializationAr: "إدارة المشاريع",
      specializationEn: "Project Management",
    },
  ];

  const trainersByEmail = new Map<string, string>();
  for (const trainerSeed of trainerSeeds) {
    const existingTrainer = await prisma.trainer.findFirst({
      where: { email: trainerSeed.email },
      select: { id: true },
    });
    const trainer = existingTrainer
      ? await prisma.trainer.update({
          where: { id: existingTrainer.id },
          data: {
            name: trainerSeed.nameEn,
            specialization: trainerSeed.specializationEn,
          },
        })
      : await prisma.trainer.create({
          data: {
            email: trainerSeed.email,
            name: trainerSeed.nameEn,
            specialization: trainerSeed.specializationEn,
          },
        });

    await prisma.trainerTranslation.upsert({
      where: { trainerId_locale: { trainerId: trainer.id, locale: "en" } },
      update: {
        name: trainerSeed.nameEn,
        title: trainerSeed.specializationEn,
      },
      create: {
        trainerId: trainer.id,
        locale: "en",
        name: trainerSeed.nameEn,
        title: trainerSeed.specializationEn,
      },
    });

    await prisma.trainerTranslation.upsert({
      where: { trainerId_locale: { trainerId: trainer.id, locale: "ar" } },
      update: {
        name: trainerSeed.nameAr,
        title: trainerSeed.specializationAr,
      },
      create: {
        trainerId: trainer.id,
        locale: "ar",
        name: trainerSeed.nameAr,
        title: trainerSeed.specializationAr,
      },
    });

    trainersByEmail.set(trainerSeed.email, trainer.id);
  }

  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const categoryIdBySlug = new Map(categories.map((category) => [category.slug, category.id]));

  const eventSeeds = [
    {
      slug: "ai-productivity-sprint-2026",
      status: "published",
      type: "online",
      language: "both",
      location: null,
      meetingLink: "https://zoom.us/j/ai-productivity-sprint-2026",
      meetingPlatform: "zoom",
      registrationsOpen: true,
      isCertified: true,
      isFeatured: true,
      isFree: true,
      price: 0,
      paymentMethods: "both",
      capacity: 160,
      registrationDeadline: "2026-05-18T20:00:00.000Z",
      startDate: "2026-05-21T13:00:00.000Z",
      endDate: "2026-05-21T17:00:00.000Z",
      mapUrl: null,
      showMapEmbed: false,
      trainers: ["khaled.balushi@kayan.local"],
      categories: ["tech", "management-leadership"],
      titleEn: "AI Productivity Sprint 2026",
      titleAr: "سباق إنتاجية الذكاء الاصطناعي 2026",
      shortEn: "Build practical AI workflows for planning, writing, and reporting in a live guided sprint.",
      shortAr: "ابنِ سير عمل ذكاء اصطناعي للتخطيط والكتابة وإعداد التقارير ضمن سباق عملي مباشر.",
    },
    {
      slug: "leadership-bootcamp-june-2026",
      status: "published",
      type: "onsite",
      language: "both",
      location: "Muscat, Oman - Kayan Main Hall",
      meetingLink: null,
      meetingPlatform: null,
      registrationsOpen: true,
      isCertified: true,
      isFeatured: true,
      isFree: false,
      price: 2400,
      paymentMethods: "both",
      capacity: 48,
      registrationDeadline: "2026-06-12T20:00:00.000Z",
      startDate: "2026-06-16T09:00:00.000Z",
      endDate: "2026-06-18T16:00:00.000Z",
      mapUrl: "https://maps.google.com/?q=Muscat+Oman",
      showMapEmbed: true,
      trainers: ["sara.harthi@kayan.local", "khaled.balushi@kayan.local"],
      categories: ["management-leadership", "economy"],
      titleEn: "Leadership Bootcamp - June 2026",
      titleAr: "معسكر القيادة - يونيو 2026",
      shortEn: "A 3-day immersion to strengthen executive presence, decision quality, and team alignment.",
      shortAr: "برنامج غامر لثلاثة أيام يعزز الحضور القيادي وجودة القرار ومواءمة الفرق.",
    },
    {
      slug: "strategic-communication-lab-2026",
      status: "published",
      type: "hybrid",
      language: "both",
      location: "Muscat Business Park",
      meetingLink: "https://meet.google.com/strategic-communication-lab-2026",
      meetingPlatform: "meet",
      registrationsOpen: true,
      isCertified: false,
      isFeatured: false,
      isFree: false,
      price: 420,
      paymentMethods: "card",
      capacity: 90,
      registrationDeadline: "2026-07-03T18:00:00.000Z",
      startDate: "2026-07-07T10:00:00.000Z",
      endDate: "2026-07-07T16:00:00.000Z",
      mapUrl: "https://maps.google.com/?q=Muscat+Business+Park",
      showMapEmbed: true,
      trainers: ["layan.qasimi@kayan.local"],
      categories: ["media-communication", "management-leadership"],
      titleEn: "Strategic Communication Lab 2026",
      titleAr: "مختبر الاتصال الاستراتيجي 2026",
      shortEn: "Design clear message architecture for leadership updates, press statements, and stakeholder trust.",
      shortAr: "صمّم هيكل رسائل واضح للتحديثات القيادية والبيانات الإعلامية وبناء الثقة.",
    },
    {
      slug: "creative-thinking-intensive-july-2026",
      status: "published",
      type: "onsite",
      language: "both",
      location: "Nizwa Cultural Center",
      meetingLink: null,
      meetingPlatform: null,
      registrationsOpen: true,
      isCertified: false,
      isFeatured: false,
      isFree: false,
      price: 300,
      paymentMethods: "both",
      capacity: 70,
      registrationDeadline: "2026-07-20T17:00:00.000Z",
      startDate: "2026-07-24T10:00:00.000Z",
      endDate: "2026-07-24T17:00:00.000Z",
      mapUrl: "https://maps.google.com/?q=Nizwa+Cultural+Center",
      showMapEmbed: true,
      trainers: ["layan.qasimi@kayan.local", "sara.harthi@kayan.local"],
      categories: ["arts", "lifestyle"],
      titleEn: "Creative Thinking Intensive - July 2026",
      titleAr: "برنامج التفكير الإبداعي المكثف - يوليو 2026",
      shortEn: "Use proven ideation techniques to move from vague ideas to testable concepts in one day.",
      shortAr: "استخدم تقنيات ابتكار مثبتة للانتقال من أفكار عامة إلى مفاهيم قابلة للاختبار خلال يوم.",
    },
    {
      slug: "digital-media-monetization-2026",
      status: "published",
      type: "online",
      language: "both",
      location: null,
      meetingLink: "https://teams.microsoft.com/l/digital-media-monetization-2026",
      meetingPlatform: "teams",
      registrationsOpen: true,
      isCertified: false,
      isFeatured: false,
      isFree: false,
      price: 210,
      paymentMethods: "card",
      capacity: 220,
      registrationDeadline: "2026-08-19T18:00:00.000Z",
      startDate: "2026-08-23T15:00:00.000Z",
      endDate: "2026-08-23T18:00:00.000Z",
      mapUrl: null,
      showMapEmbed: false,
      trainers: ["layan.qasimi@kayan.local"],
      categories: ["media-communication", "economy"],
      titleEn: "Digital Media Monetization 2026",
      titleAr: "تحقيق الدخل من الإعلام الرقمي 2026",
      shortEn: "Plan diversified revenue streams for creators using subscriptions, sponsorships, and digital products.",
      shortAr: "خطط لمصادر دخل متنوعة لصنّاع المحتوى عبر الاشتراكات والرعايات والمنتجات الرقمية.",
    },
    {
      slug: "project-governance-masterclass-2026",
      status: "published",
      type: "onsite",
      language: "both",
      location: "Sohar Innovation Hub",
      meetingLink: null,
      meetingPlatform: null,
      registrationsOpen: true,
      isCertified: true,
      isFeatured: true,
      isFree: false,
      price: 950,
      paymentMethods: "bank",
      capacity: 36,
      registrationDeadline: "2026-09-01T18:00:00.000Z",
      startDate: "2026-09-05T09:00:00.000Z",
      endDate: "2026-09-06T15:00:00.000Z",
      mapUrl: "https://maps.google.com/?q=Sohar+Innovation+Hub",
      showMapEmbed: true,
      trainers: ["omar.riyami@kayan.local"],
      categories: ["management-leadership", "economy"],
      titleEn: "Project Governance Masterclass 2026",
      titleAr: "ماستر كلاس حوكمة المشاريع 2026",
      shortEn: "Set governance cadence, decision rights, and risk controls for complex delivery portfolios.",
      shortAr: "ضع إيقاع الحوكمة وصلاحيات القرار وضوابط المخاطر لمحافظ مشاريع معقدة.",
    },
    {
      slug: "tech-leadership-for-managers-sep-2026",
      status: "published",
      type: "hybrid",
      language: "en",
      location: "Duqm Innovation Campus",
      meetingLink: "https://zoom.us/j/tech-leadership-managers-sep-2026",
      meetingPlatform: "zoom",
      registrationsOpen: true,
      isCertified: true,
      isFeatured: false,
      isFree: false,
      price: 1250,
      paymentMethods: "bank",
      capacity: 40,
      registrationDeadline: "2026-09-10T18:00:00.000Z",
      startDate: "2026-09-14T09:00:00.000Z",
      endDate: "2026-09-16T15:00:00.000Z",
      mapUrl: "https://maps.google.com/?q=Duqm+Innovation+Campus",
      showMapEmbed: true,
      trainers: ["khaled.balushi@kayan.local", "omar.riyami@kayan.local"],
      categories: ["tech", "management-leadership"],
      titleEn: "Tech Leadership for Managers - Sep 2026",
      titleAr: "القيادة التقنية للمديرين - سبتمبر 2026",
      shortEn: "Lead technical teams with better prioritization, delivery rhythm, and cross-functional collaboration.",
      shortAr: "قد فرق التقنية عبر تحسين ترتيب الأولويات وإيقاع التنفيذ والتعاون بين الإدارات.",
    },
    {
      slug: "education-psychology-foundations-2026",
      status: "published",
      type: "hybrid",
      language: "both",
      location: "Salalah Learning Center",
      meetingLink: "https://zoom.us/j/education-psychology-foundations-2026",
      meetingPlatform: "zoom",
      registrationsOpen: true,
      isCertified: true,
      isFeatured: true,
      isFree: false,
      price: 680,
      paymentMethods: "both",
      capacity: 85,
      registrationDeadline: "2026-10-04T18:00:00.000Z",
      startDate: "2026-10-08T09:30:00.000Z",
      endDate: "2026-10-09T15:30:00.000Z",
      mapUrl: "https://maps.google.com/?q=Salalah+Learning+Center",
      showMapEmbed: true,
      trainers: ["sara.harthi@kayan.local"],
      categories: ["education-psychology", "management-leadership"],
      titleEn: "Education Psychology Foundations 2026",
      titleAr: "أساسيات علم نفس التعليم 2026",
      shortEn: "Apply behavioral science to improve retention, motivation, and learning transfer in cohorts.",
      shortAr: "طبّق علم النفس السلوكي لتحسين الاستيعاب والدافعية ونقل أثر التعلم للواقع.",
    },
    {
      slug: "executive-economy-briefing-oct-2026",
      status: "published",
      type: "hybrid",
      language: "both",
      location: "Muscat Convention District",
      meetingLink: "https://teams.microsoft.com/l/executive-economy-briefing-oct-2026",
      meetingPlatform: "teams",
      registrationsOpen: true,
      isCertified: false,
      isFeatured: false,
      isFree: false,
      price: 520,
      paymentMethods: "card",
      capacity: 140,
      registrationDeadline: "2026-10-20T18:00:00.000Z",
      startDate: "2026-10-24T11:00:00.000Z",
      endDate: "2026-10-24T15:00:00.000Z",
      mapUrl: "https://maps.google.com/?q=Muscat+Convention+District",
      showMapEmbed: true,
      trainers: ["khaled.balushi@kayan.local"],
      categories: ["economy", "management-leadership"],
      titleEn: "Executive Economy Briefing - Oct 2026",
      titleAr: "إحاطة الاقتصاد التنفيذي - أكتوبر 2026",
      shortEn: "Track macroeconomic shifts and convert them into operating and budget decisions for 2027.",
      shortAr: "تابع التحولات الاقتصادية الكلية وحوّلها إلى قرارات تشغيلية ومالية لعام 2027.",
    },
    {
      slug: "lifestyle-wellbeing-frameworks-2026",
      status: "published",
      type: "online",
      language: "ar",
      location: null,
      meetingLink: "https://meet.google.com/lifestyle-wellbeing-frameworks-2026",
      meetingPlatform: "meet",
      registrationsOpen: true,
      isCertified: false,
      isFeatured: false,
      isFree: true,
      price: 0,
      paymentMethods: "both",
      capacity: 180,
      registrationDeadline: "2026-11-03T18:00:00.000Z",
      startDate: "2026-11-07T17:00:00.000Z",
      endDate: "2026-11-07T19:30:00.000Z",
      mapUrl: null,
      showMapEmbed: false,
      trainers: ["sara.harthi@kayan.local"],
      categories: ["lifestyle", "education-psychology"],
      titleEn: "Lifestyle Wellbeing Frameworks 2026",
      titleAr: "أطر الرفاه ونمط الحياة 2026",
      shortEn: "Build a realistic wellbeing system covering energy, focus, sleep, and sustainable routines.",
      shortAr: "ابنِ نظام رفاه واقعي يغطي الطاقة والتركيز والنوم والعادات المستدامة.",
    },
    {
      slug: "entertainment-experience-design-studio",
      status: "published",
      type: "onsite",
      language: "both",
      location: "Muscat Creative District",
      meetingLink: null,
      meetingPlatform: null,
      registrationsOpen: true,
      isCertified: true,
      isFeatured: false,
      isFree: false,
      price: 780,
      paymentMethods: "both",
      capacity: 55,
      registrationDeadline: "2026-11-18T18:00:00.000Z",
      startDate: "2026-11-22T10:00:00.000Z",
      endDate: "2026-11-23T16:00:00.000Z",
      mapUrl: "https://maps.google.com/?q=Muscat+Creative+District",
      showMapEmbed: true,
      trainers: ["layan.qasimi@kayan.local", "omar.riyami@kayan.local"],
      categories: ["entertainment", "arts"],
      titleEn: "Entertainment Experience Design Studio",
      titleAr: "استوديو تصميم تجارب الترفيه",
      shortEn: "Design audience journeys for events that blend storytelling, flow, and measurable engagement.",
      shortAr: "صمّم رحلات الجمهور لفعاليات تمزج السرد والانسيابية ومؤشرات التفاعل القابلة للقياس.",
    },
    {
      slug: "annual-strategy-retreat-dec-2026",
      status: "draft",
      type: "hybrid",
      language: "both",
      location: "Jebel Akhdar Retreat Center",
      meetingLink: "https://teams.microsoft.com/l/annual-strategy-retreat-dec-2026",
      meetingPlatform: "teams",
      registrationsOpen: true,
      isCertified: true,
      isFeatured: false,
      isFree: false,
      price: 1600,
      paymentMethods: "both",
      capacity: 42,
      registrationDeadline: "2026-12-01T18:00:00.000Z",
      startDate: "2026-12-05T09:00:00.000Z",
      endDate: "2026-12-07T14:30:00.000Z",
      mapUrl: "https://maps.google.com/?q=Jebel+Akhdar+Retreat+Center",
      showMapEmbed: true,
      trainers: ["sara.harthi@kayan.local", "khaled.balushi@kayan.local", "omar.riyami@kayan.local"],
      categories: ["management-leadership", "economy", "lifestyle"],
      titleEn: "Annual Strategy Retreat - Dec 2026",
      titleAr: "ملتقى الاستراتيجية السنوي - ديسمبر 2026",
      shortEn: "Close the year with strategic planning, execution priorities, and leadership commitments for 2027.",
      shortAr: "اختتم العام بتخطيط استراتيجي وأولويات تنفيذية والتزامات قيادية واضحة لعام 2027.",
    },
  ] as const;

  function buildEventHtml({
    title,
    short,
    imageUrl,
    locale,
  }: {
    title: string;
    short: string;
    imageUrl: string;
    locale: "en" | "ar";
  }) {
    if (locale === "ar") {
      return `
        <h2>${title}</h2>
        <p>${short}</p>
        <p><strong>تم تصميم هذا البرنامج</strong> لتمكين المشاركين من تطبيق المفاهيم مباشرة في بيئات العمل الواقعية.</p>
        <img src="${imageUrl}" alt="${title}" />
        <h3>ماذا ستتعلم</h3>
        <ul>
          <li>أطر عملية قابلة للتنفيذ خلال 30 يومًا</li>
          <li>أدوات لاتخاذ القرار وإدارة الأولويات</li>
          <li>نماذج عمل للتواصل الفعال وقياس الأثر</li>
        </ul>
        <h3>خطة التطبيق بعد البرنامج</h3>
        <ol>
          <li>تحديد هدف تنفيذي واضح لكل مشارك</li>
          <li>بناء خطة تنفيذ قصيرة مع مؤشرات قياس</li>
          <li>مراجعة النتائج مع الفريق خلال أسبوعين</li>
        </ol>
        <blockquote>يركز المحتوى على التطبيق العملي وليس الجانب النظري فقط.</blockquote>
        <p>للاطلاع على تفاصيل إضافية، راجع <a href="https://kayan.om">صفحة كيان الرسمية</a>.</p>
      `.trim();
    }

    return `
      <h2>${title}</h2>
      <p>${short}</p>
      <p><strong>This program is structured</strong> for direct workplace application, not just conceptual learning.</p>
      <img src="${imageUrl}" alt="${title}" />
      <h3>What you will learn</h3>
      <ul>
        <li>Execution-ready frameworks for the next 30 days</li>
        <li>Decision tools for prioritization and stakeholder alignment</li>
        <li>Communication patterns and impact measurement workflows</li>
      </ul>
      <h3>Implementation Roadmap</h3>
      <ol>
        <li>Define one priority business outcome</li>
        <li>Translate it into a two-week execution plan</li>
        <li>Review outcomes with stakeholders and iterate</li>
      </ol>
      <blockquote>Every module includes practical exercises and implementation templates.</blockquote>
      <p>For additional context, see the <a href="https://kayan.om">official Kayan website</a>.</p>
    `.trim();
  }

  for (const [index, seed] of eventSeeds.entries()) {
    const eventImageUrl = mediaRecords[index % mediaRecords.length].url;
    const event = await prisma.event.upsert({
      where: { slug: seed.slug },
      update: {
        bankTransferDetails: {
          map: {
            showEmbed: seed.showMapEmbed,
            url: seed.mapUrl,
          },
        },
        capacity: seed.capacity,
        coverImage: eventImageUrl,
        endDate: new Date(seed.endDate),
        featuredImageId: mediaRecords[index % mediaRecords.length].id,
        isCertified: seed.isCertified,
        isFeatured: seed.isFeatured,
        isFree: seed.isFree,
        language: seed.language,
        location: seed.location,
        meetingLink: seed.meetingLink,
        meetingPlatform: seed.meetingPlatform,
        paymentMethods: seed.paymentMethods,
        price: seed.price,
        registrationDeadline: new Date(seed.registrationDeadline),
        registrationsOpen: seed.registrationsOpen,
        startDate: new Date(seed.startDate),
        status: seed.status,
        type: seed.type,
      },
      create: {
        bankTransferDetails: {
          map: {
            showEmbed: seed.showMapEmbed,
            url: seed.mapUrl,
          },
        },
        capacity: seed.capacity,
        coverImage: eventImageUrl,
        endDate: new Date(seed.endDate),
        featuredImageId: mediaRecords[index % mediaRecords.length].id,
        isCertified: seed.isCertified,
        isFeatured: seed.isFeatured,
        isFree: seed.isFree,
        language: seed.language,
        location: seed.location,
        meetingLink: seed.meetingLink,
        meetingPlatform: seed.meetingPlatform,
        paymentMethods: seed.paymentMethods,
        price: seed.price,
        registrationDeadline: new Date(seed.registrationDeadline),
        registrationsOpen: seed.registrationsOpen,
        slug: seed.slug,
        startDate: new Date(seed.startDate),
        status: seed.status,
        type: seed.type,
      },
    });

    await prisma.eventTranslation.upsert({
      where: { eventId_locale: { eventId: event.id, locale: "en" } },
      update: {
        title: seed.titleEn,
        shortDescription: seed.shortEn,
        seoTitle: seed.titleEn,
        seoDescription: seed.shortEn,
        description: {
          html: buildEventHtml({
            title: seed.titleEn,
            short: seed.shortEn,
            imageUrl: eventImageUrl,
            locale: "en",
          }),
          type: "html",
        },
      },
      create: {
        eventId: event.id,
        locale: "en",
        title: seed.titleEn,
        shortDescription: seed.shortEn,
        seoTitle: seed.titleEn,
        seoDescription: seed.shortEn,
        description: {
          html: buildEventHtml({
            title: seed.titleEn,
            short: seed.shortEn,
            imageUrl: eventImageUrl,
            locale: "en",
          }),
          type: "html",
        },
      },
    });

    await prisma.eventTranslation.upsert({
      where: { eventId_locale: { eventId: event.id, locale: "ar" } },
      update: {
        title: seed.titleAr,
        shortDescription: seed.shortAr,
        seoTitle: seed.titleAr,
        seoDescription: seed.shortAr,
        description: {
          html: buildEventHtml({
            title: seed.titleAr,
            short: seed.shortAr,
            imageUrl: eventImageUrl,
            locale: "ar",
          }),
          type: "html",
        },
      },
      create: {
        eventId: event.id,
        locale: "ar",
        title: seed.titleAr,
        shortDescription: seed.shortAr,
        seoTitle: seed.titleAr,
        seoDescription: seed.shortAr,
        description: {
          html: buildEventHtml({
            title: seed.titleAr,
            short: seed.shortAr,
            imageUrl: eventImageUrl,
            locale: "ar",
          }),
          type: "html",
        },
      },
    });

    await prisma.eventCategory.deleteMany({ where: { eventId: event.id } });
    if (seed.categories.length) {
      await prisma.eventCategory.createMany({
        data: seed.categories
          .map((slug) => categoryIdBySlug.get(slug))
          .filter((categoryId): categoryId is string => Boolean(categoryId))
          .map((categoryId) => ({ categoryId, eventId: event.id })),
        skipDuplicates: true,
      });
    }

    await prisma.eventTrainer.deleteMany({ where: { eventId: event.id } });
    await prisma.eventTrainer.createMany({
      data: seed.trainers
        .map((email, trainerIndex) => ({ trainerId: trainersByEmail.get(email), trainerIndex }))
        .filter((item): item is { trainerId: string; trainerIndex: number } => Boolean(item.trainerId))
        .map((item) => ({
          eventId: event.id,
          sortOrder: item.trainerIndex,
          trainerId: item.trainerId,
        })),
      skipDuplicates: true,
    });

    await prisma.agendaSession.deleteMany({ where: { eventId: event.id } });
    await prisma.agendaSession.createMany({
      data: [
        {
          day: 1,
          eventId: event.id,
          order: 0,
          time: "09:00",
          title: "Opening & Context",
          type: "talk",
        },
        {
          day: 1,
          eventId: event.id,
          order: 1,
          time: "11:00",
          title: "Applied Workshop",
          type: "workshop",
        },
        {
          day: 1,
          eventId: event.id,
          order: 2,
          time: "13:00",
          title: "Networking Break",
          type: "break",
        },
      ],
    });

    await prisma.registrationFormField.deleteMany({ where: { eventId: event.id } });
    await prisma.registrationFormField.createMany({
      data: [
        { eventId: event.id, order: 0, required: true, type: "text" },
        { eventId: event.id, order: 1, required: true, type: "email" },
        {
          eventId: event.id,
          order: 2,
          required: false,
          type: "select",
          options: { choices: { en: ["Junior", "Mid", "Senior"], ar: ["مبتدئ", "متوسط", "متقدم"] } },
        },
      ],
    });

    const formFields = await prisma.registrationFormField.findMany({
      where: { eventId: event.id },
      orderBy: { order: "asc" },
    });
    for (const [fieldIndex, field] of formFields.entries()) {
      await prisma.registrationFormFieldTranslation.upsert({
        where: { fieldId_locale: { fieldId: field.id, locale: "en" } },
        update: {
          label: fieldIndex === 0 ? "Job Title" : fieldIndex === 1 ? "Work Email" : "Seniority Level",
          placeholder: fieldIndex === 0 ? "Your job title" : fieldIndex === 1 ? "name@company.com" : "Select level",
        },
        create: {
          fieldId: field.id,
          locale: "en",
          label: fieldIndex === 0 ? "Job Title" : fieldIndex === 1 ? "Work Email" : "Seniority Level",
          placeholder: fieldIndex === 0 ? "Your job title" : fieldIndex === 1 ? "name@company.com" : "Select level",
        },
      });
      await prisma.registrationFormFieldTranslation.upsert({
        where: { fieldId_locale: { fieldId: field.id, locale: "ar" } },
        update: {
          label: fieldIndex === 0 ? "المسمى الوظيفي" : fieldIndex === 1 ? "البريد الوظيفي" : "المستوى الوظيفي",
          placeholder: fieldIndex === 0 ? "المسمى الوظيفي" : fieldIndex === 1 ? "name@company.com" : "اختر المستوى",
        },
        create: {
          fieldId: field.id,
          locale: "ar",
          label: fieldIndex === 0 ? "المسمى الوظيفي" : fieldIndex === 1 ? "البريد الوظيفي" : "المستوى الوظيفي",
          placeholder: fieldIndex === 0 ? "المسمى الوظيفي" : fieldIndex === 1 ? "name@company.com" : "اختر المستوى",
        },
      });
    }
  }

  const post = await prisma.post.upsert({
    where: { slug: "future-of-ai-learning-paths" },
    update: {
      status: "published",
      type: "article",
      featuredImageId: mediaRecords[2].id,
      authorId: admin.id,
      publishedAt: new Date("2026-04-20T10:00:00.000Z"),
    },
    create: {
      slug: "future-of-ai-learning-paths",
      status: "published",
      type: "article",
      featuredImageId: mediaRecords[2].id,
      authorId: admin.id,
      publishedAt: new Date("2026-04-20T10:00:00.000Z"),
    },
  });

  await prisma.postTranslation.upsert({
    where: { postId_locale: { postId: post.id, locale: "en" } },
    update: {
      title: "The Future of AI Learning Paths",
      excerpt: "How training teams can design adaptive journeys with measurable outcomes.",
      content: {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "From content libraries to adaptive paths" }] },
          { type: "paragraph", content: [{ type: "text", text: "Modern training programs require dynamic sequencing based on learner signals and role goals." }] },
          { type: "image", attrs: { src: mediaRecords[2].url, alt: "AI learning workflow" } },
          { type: "paragraph", content: [{ type: "text", text: "Use event data, completion rates, and competency checkpoints to personalize progression." }] },
        ],
      },
    },
    create: {
      postId: post.id,
      locale: "en",
      title: "The Future of AI Learning Paths",
      excerpt: "How training teams can design adaptive journeys with measurable outcomes.",
      content: {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "From content libraries to adaptive paths" }] },
          { type: "paragraph", content: [{ type: "text", text: "Modern training programs require dynamic sequencing based on learner signals and role goals." }] },
          { type: "image", attrs: { src: mediaRecords[2].url, alt: "AI learning workflow" } },
          { type: "paragraph", content: [{ type: "text", text: "Use event data, completion rates, and competency checkpoints to personalize progression." }] },
        ],
      },
    },
  });

  await prisma.postTranslation.upsert({
    where: { postId_locale: { postId: post.id, locale: "ar" } },
    update: {
      title: "مستقبل مسارات التعلم المدعومة بالذكاء الاصطناعي",
      excerpt: "كيف تصمم فرق التدريب رحلات تعلم تكيفية بمخرجات قابلة للقياس.",
      content: {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "من مكتبات المحتوى إلى المسارات التكيفية" }] },
          { type: "paragraph", content: [{ type: "text", text: "تتطلب برامج التدريب الحديثة تسلسلاً ديناميكياً بناءً على إشارات المتعلم وأهداف الدور." }] },
          { type: "image", attrs: { src: mediaRecords[2].url, alt: "سير عمل التعلم بالذكاء الاصطناعي" } },
          { type: "paragraph", content: [{ type: "text", text: "استخدم بيانات التفاعل ونسب الإنجاز ونقاط الكفاءة لتخصيص التقدم التعليمي." }] },
        ],
      },
    },
    create: {
      postId: post.id,
      locale: "ar",
      title: "مستقبل مسارات التعلم المدعومة بالذكاء الاصطناعي",
      excerpt: "كيف تصمم فرق التدريب رحلات تعلم تكيفية بمخرجات قابلة للقياس.",
      content: {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "من مكتبات المحتوى إلى المسارات التكيفية" }] },
          { type: "paragraph", content: [{ type: "text", text: "تتطلب برامج التدريب الحديثة تسلسلاً ديناميكياً بناءً على إشارات المتعلم وأهداف الدور." }] },
          { type: "image", attrs: { src: mediaRecords[2].url, alt: "سير عمل التعلم بالذكاء الاصطناعي" } },
          { type: "paragraph", content: [{ type: "text", text: "استخدم بيانات التفاعل ونسب الإنجاز ونقاط الكفاءة لتخصيص التقدم التعليمي." }] },
        ],
      },
    },
  });

  await prisma.setting.upsert({
    where: { key: "seo.default" },
    update: {
      value: {
        title: "Kayan Training & Consulting",
        description: "Training events, knowledge content, and consulting services.",
      },
    },
    create: {
      key: "seo.default",
      value: {
        title: "Kayan Training & Consulting",
        description: "Training events, knowledge content, and consulting services.",
      },
    },
  });

  console.log(`Seeded categories (${categorySeeds.length}), users, media, events, posts, and settings.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
