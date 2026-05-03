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
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";

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

  await seedSystemPages();
  await seedMenus();

  console.log(`Seeded categories (${categorySeeds.length}), users, media, events, posts, settings, system pages, and menus.`);
}

async function seedMenus() {
  for (const location of ["header", "footer"]) {
    await prisma.menu.upsert({
      where: { location },
      update: {},
      create: { location },
    });
  }

  const headerMenu = await prisma.menu.findUnique({ where: { location: "header" } });
  if (!headerMenu) return;

  const existingItems = await prisma.menuItem.count({ where: { menuId: headerMenu.id } });
  if (existingItems > 0) return;

  const pages = await prisma.page.findMany({
    include: { translations: { where: { locale: "en" }, take: 1 } },
  });
  const pageMap = Object.fromEntries(pages.map((p) => [p.slug, { id: p.id, title: p.translations[0]?.title ?? p.slug }]));

  const navItems: Array<{ slugEn: string; labelEn: string; labelAr: string }> = [
    { slugEn: "home", labelEn: "Home", labelAr: "الرئيسية" },
    { slugEn: "about", labelEn: "About", labelAr: "عن كيان" },
    { slugEn: "services", labelEn: "Services", labelAr: "الخدمات" },
    { slugEn: "events", labelEn: "Events", labelAr: "الفعاليات" },
    { slugEn: "posts", labelEn: "Articles", labelAr: "المقالات" },
  ];

  for (let i = 0; i < navItems.length; i++) {
    const nav = navItems[i];
    const page = pageMap[nav.slugEn];
    const item = await prisma.menuItem.create({
      data: {
        menuId: headerMenu.id,
        order: i,
        type: "page",
        targetId: page?.id ?? null,
        url: `/en/${nav.slugEn}`,
      },
    });
    await prisma.menuItemTranslation.createMany({
      data: [
        { menuItemId: item.id, locale: "en", label: nav.labelEn },
        { menuItemId: item.id, locale: "ar", label: nav.labelAr },
      ],
    });
  }
}

async function upsertPage(
  slug: string,
  titleEn: string,
  titleAr: string,
  seoTitleEn: string,
  seoTitleAr: string,
  seoDescriptionEn: string,
  seoDescriptionAr: string,
  blocksEn: unknown[],
  blocksAr: unknown[],
) {
  const page = await prisma.page.upsert({
    where: { slug },
    update: { status: "published" },
    create: { slug, status: "published" },
  });

  await prisma.pageTranslation.upsert({
    where: { pageId_locale: { pageId: page.id, locale: "en" } },
    update: { title: titleEn, seoTitle: seoTitleEn || null, seoDescription: seoDescriptionEn || null, blocks: blocksEn as never },
    create: { pageId: page.id, locale: "en", title: titleEn, seoTitle: seoTitleEn || null, seoDescription: seoDescriptionEn || null, blocks: blocksEn as never },
  });

  await prisma.pageTranslation.upsert({
    where: { pageId_locale: { pageId: page.id, locale: "ar" } },
    update: { title: titleAr, seoTitle: seoTitleAr || null, seoDescription: seoDescriptionAr || null, blocks: blocksAr as never },
    create: { pageId: page.id, locale: "ar", title: titleAr, seoTitle: seoTitleAr || null, seoDescription: seoDescriptionAr || null, blocks: blocksAr as never },
  });
}

function id() {
  return Math.random().toString(36).slice(2, 10);
}

async function seedSystemPages() {
  // ── About ──────────────────────────────────────────────────────────────────
  await upsertPage(
    "about",
    "About Kayan",
    "عن كيان",
    "About Kayan — Training & Consulting",
    "عن كيان — للتدريب والاستشارات",
    "We operate as an execution partner that turns development into a sustainable performance system.",
    "نعمل كشريك تنفيذي يضمن أن يتحول التطوير إلى نظام أداء مستدام داخل المؤسسة.",
    // EN blocks
    [
      { id: id(), type: "page_hero", eyebrow: "Trust & Method", heading: "About Kayan", subheading: "We operate as an execution partner that turns development from a training activity into a sustainable performance system.", image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1400&q=60" },
      { id: id(), type: "about_intro", body: "<p>Kayan was established to deliver focused development tracks that help institutions improve performance, strengthen team readiness, and accelerate transformation outcomes.</p><p>We do not provide training content in isolation. We design learning experiences tied to clear performance indicators so each program creates measurable operational impact.</p><p>Through applied training, public knowledge evenings, and execution consulting, we help organizations convert daily challenges into sustainable growth opportunities.</p>", metricsHeading: "Our Metrics", metrics: [{ label: "Years of Experience", value: "+9" }, { label: "Programs Delivered", value: "+200" }, { label: "Partner Institutions", value: "+40" }], ctaText: "Explore Services", ctaUrl: "/en/services" },
      { id: id(), type: "mission_vision", items: [{ title: "Our Mission", body: "Enable institutions to convert learning into stable operational practice that improves outcomes and supports sustainability." }, { title: "Our Vision", body: "To become the regional reference for connecting capability development with measurable institutional outcomes." }, { title: "Delivery Method", body: "Need diagnosis, solution design, guided execution, and impact measurement with continuous iteration." }] },
      { id: id(), type: "process_steps", heading: "How We Create Impact", body: "We start from real institutional KPIs, then design training and consulting interventions directly tied to day-to-day operations.", steps: [{ title: "Diagnosis", desc: "Identify performance and capability gaps." }, { title: "Design", desc: "Build a clear learning + execution path." }, { title: "Application", desc: "Activate tools inside the workplace." }, { title: "Measurement", desc: "Review outcomes and continuously improve." }] },
      { id: id(), type: "values_list", eyebrow: "What Drives Us", heading: "Values & Principles", items: [{ title: "Quality & Efficiency", desc: "Every program is engineered to measurable standards — not theoretical content disconnected from practice." }, { title: "Professionalism & Impact", desc: "We deliver learning experiences with measurable operational impact, not a fleeting positive impression." }, { title: "Credibility & Commitment", desc: "Long-term partnerships built on full transparency and actual delivery against what was agreed." }, { title: "Leadership & Innovation", desc: "We track labour market shifts and integrate modern tools with purpose — not trend-chasing." }, { title: "Time Discipline", desc: "We respect our clients' time as much as participants'. Schedule discipline is not a detail — it is a performance indicator." }, { title: "Social Responsibility", desc: "Our role goes beyond training — we help build the talent driving Oman's economic diversification and knowledge society." }] },
      { id: id(), type: "accreditation", accredHeading: "QABA Approved Provider", accredBody: "Kayan Training & Consulting holds QABA approval as a Qualified Approved Course Provider, ensuring clients receive internationally-recognized training content, assessment standards, and certifications.", badgeLabel: "QABA", badgeTitle: "Qualified Approved Course Provider", badgeSub: "International recognition — global content & assessment standards", partnersHeading: "Who Trusts Us", partnersBody: "We're trusted by public and private sector institutions across the Sultanate of Oman, from oil & gas companies to government bodies and educational institutions.", partners: [{ name: "OQ" }, { name: "OXY OMAN" }, { name: "Government Entities" }, { name: "Multiple Sectors" }] },
      { id: id(), type: "cta_banner", eyebrow: "Your Development Partner", heading: "Looking for a Custom Training Track for Your Institution?", body: "We design development tracks built on an actual diagnosis of your team's needs — no off-the-shelf solutions.", buttonText: "training@kayan.om", buttonUrl: "mailto:training@kayan.om", linkText: "Browse All Events →", linkUrl: "/en/events" },
    ],
    // AR blocks
    [
      { id: id(), type: "page_hero", eyebrow: "الثقة والمنهج", heading: "عن كيان", subheading: "نعمل كشريك تنفيذي يضمن أن يتحول التطوير من نشاط تدريبي إلى نظام أداء مستدام داخل المؤسسة.", image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1400&q=60" },
      { id: id(), type: "about_intro", body: "<p>تأسست كيان للتدريب والاستشارات لتقديم مسارات تطوير دقيقة تساعد الجهات الحكومية والشركات على تحسين الأداء، ورفع جاهزية الفرق، وتسريع نتائج التحول.</p><p>نحن لا نقدّم محتوى تدريبيًا فقط؛ بل نصمم تجارب تعلم مرتبطة بمؤشرات أداء واضحة، بحيث يتحول كل برنامج إلى أثر تشغيلي ملموس.</p><p>من خلال مزيج من التدريب التطبيقي، الأمسيات المعرفية، والاستشارات التنفيذية، نعمل مع عملائنا على تحويل التحديات اليومية إلى فرص نمو مستدام.</p>", metricsHeading: "أرقامنا", metrics: [{ label: "سنوات الخبرة", value: "+9" }, { label: "برامج منفذة", value: "+200" }, { label: "جهات شريكة", value: "+40" }], ctaText: "استكشف خدماتنا", ctaUrl: "/ar/services" },
      { id: id(), type: "mission_vision", items: [{ title: "رسالتنا", body: "تمكين المؤسسات من تحويل التعلم إلى ممارسة تشغيلية مستقرة تُحسن النتائج وتدعم الاستدامة." }, { title: "رؤيتنا", body: "أن تكون كيان المرجع الأول إقليميًا في الربط بين بناء القدرات والنتائج المؤسسية الملموسة." }, { title: "منهجية العمل", body: "تشخيص الاحتياج، تصميم الحل، التنفيذ الموجّه، ثم قياس الأثر وتحديث المسار." }] },
      { id: id(), type: "process_steps", heading: "كيف نخلق الأثر؟", body: "نبدأ من مؤشرات الأداء الفعلية في المؤسسة، ثم نصمم تدخلات تدريبية واستشارية مرتبطة مباشرة بسياق العمل.", steps: [{ title: "التشخيص", desc: "تحديد فجوات الأداء والمهارات." }, { title: "التصميم", desc: "بناء مسار تعلم وتنفيذ واضح." }, { title: "التطبيق", desc: "تفعيل الأدوات داخل بيئة العمل." }, { title: "القياس", desc: "مراجعة النتائج وتحسين مستمر." }] },
      { id: id(), type: "values_list", eyebrow: "ما يميّزنا", heading: "قيمنا ومبادئنا", items: [{ title: "الجودة والكفاءة", desc: "نُصمم كل برنامج وفق معايير صارمة تضمن نتائج قابلة للقياس — لا محتوى نظرياً بمعزل عن الواقع." }, { title: "الاحترافية والتأثير", desc: "نُقدّم تجارب تعلم تُحدث أثرًا تشغيليًا ملموسًا، لا انطباعًا إيجابيًا مؤقتًا يتبخر خارج القاعة." }, { title: "المصداقية والالتزام", desc: "نبني علاقات طويلة الأمد مبنية على الشفافية الكاملة والتسليم الفعلي وفق ما اتُّفق عليه." }, { title: "الريادة والابتكار", desc: "نواكب تحولات سوق العمل ونُدرج أدوات التعلم الحديثة في كل مسار — بمنهجية لا بمجاراة الاتجاه." }, { title: "الانضباط في الزمن", desc: "نحترم وقت عملائنا كما نحترم وقت المتدربين. الالتزام بالجدول ليس تفصيلاً — هو مؤشر أداء." }, { title: "المسؤولية المجتمعية", desc: "ندرك أن دورنا يتجاوز التدريب — نحن نُسهم في بناء كوادر تقود تنويع اقتصاد عُمان وتُرسّخ مجتمع المعرفة." }] },
      { id: id(), type: "accreditation", accredHeading: "معتمدون من QABA", accredBody: "حصلت كيان للتدريب والاستشارات على اعتماد QABA كمزوّد معتمد للدورات التدريبية، مما يضمن لعملائنا جودة المحتوى التدريبي ومعايير التقييم والاعتراف الدولي بالشهادات.", badgeLabel: "QABA", badgeTitle: "مزوّد دورات تدريبية معتمد", badgeSub: "اعتراف دولي — معايير محتوى وتقييم دولية", partnersHeading: "من عملائنا", partnersBody: "نفخر بثقة مؤسسات من القطاعين الحكومي والخاص في سلطنة عُمان، من شركات النفط والغاز إلى الجهات الحكومية والمؤسسات التعليمية.", partners: [{ name: "OQ" }, { name: "OXY OMAN" }, { name: "جهات حكومية" }, { name: "قطاع خاص متعدد" }] },
      { id: id(), type: "cta_banner", eyebrow: "شريكك في التطوير", heading: "هل تبحث عن مسار تدريبي مخصص لمؤسستك؟", body: "نُصمم مسارات تطوير مبنية على تشخيص فعلي لاحتياجات فريقك — لا حلولاً جاهزة.", buttonText: "training@kayan.om", buttonUrl: "mailto:training@kayan.om", linkText: "استعراض كل الفعاليات →", linkUrl: "/ar/events" },
    ],
  );

  // ── Services ───────────────────────────────────────────────────────────────
  await upsertPage(
    "services",
    "Our Services",
    "خدماتنا",
    "Services — Kayan Training & Consulting",
    "خدماتنا — كيان للتدريب والاستشارات",
    "Each service is tied to a specific operating problem, a clear KPI, and a practical implementation path.",
    "كل خدمة لدينا مرتبطة بمشكلة تشغيلية محددة، ومؤشر قياس واضح، ومسار تطبيق عملي.",
    // EN blocks
    [
      { id: id(), type: "page_hero", eyebrow: "Outcome-Led Offers", heading: "Our Solutions", subheading: "Each service is tied to a specific operating problem, a clear KPI, and a practical implementation path.", image: "https://images.unsplash.com/photo-1597734187998-e1931acfe2ed?w=1400&q=60" },
      { id: id(), type: "service_cards", items: [{ badge: "Applied Training", title: "Training Programs", desc: "Need-based programs with execution tracks and post-training impact indicators.", image: "https://images.unsplash.com/photo-1756840210475-1e0f006d6169?w=1200&q=80" }, { badge: "Public Impact", title: "Public Evenings", desc: "Focused knowledge evenings that raise awareness and turn ideas into practical professional habits.", image: "https://images.unsplash.com/photo-1711889067043-579e7f118b6d?w=1200&q=80" }, { badge: "Institutional Improvement", title: "Execution Consulting", desc: "Deep diagnosis, execution roadmap, and operational accompaniment until outcomes are delivered.", image: "https://images.unsplash.com/photo-1756840210349-7bc0ae472ef8?w=1200&q=80" }] },
      { id: id(), type: "training_domains", eyebrow: "Specializations", heading: "Eight Training Domains" },
      { id: id(), type: "process_steps", heading: "What Each Track Includes", body: "Each organization receives a tailored mix of training, consulting, and execution support based on maturity stage.", steps: [{ title: "Diagnostic Sessions", desc: "Assess gaps and priorities." }, { title: "Program Design", desc: "Build tailored content per sector." }, { title: "Delivery & Follow-up", desc: "Applied training with operational tasks." }, { title: "Impact Measurement", desc: "Pre/post indicators and improvement reports." }] },
      { id: id(), type: "cta_banner", eyebrow: "Your Development Partner", heading: "Ready to design a custom development track?", body: "We start with a diagnosis of your team's actual performance gaps, not a catalog of pre-built courses.", buttonText: "training@kayan.om", buttonUrl: "mailto:training@kayan.om", linkText: "Browse All Events →", linkUrl: "/en/events" },
    ],
    // AR blocks
    [
      { id: id(), type: "page_hero", eyebrow: "عروض موجّهة بالنتائج", heading: "حلولنا", subheading: "كل خدمة لدينا مرتبطة بمشكلة تشغيلية محددة، ومؤشر قياس واضح، ومسار تطبيق عملي.", image: "https://images.unsplash.com/photo-1597734187998-e1931acfe2ed?w=1400&q=60" },
      { id: id(), type: "service_cards", items: [{ badge: "تدريب تطبيقي", title: "البرامج التدريبية", desc: "برامج مبنية على تحليل الاحتياج مع مسارات تنفيذ ومؤشرات متابعة لما بعد التدريب.", image: "https://images.unsplash.com/photo-1756840210475-1e0f006d6169?w=1200&q=80" }, { badge: "أثر مجتمعي", title: "الأمسيات الجماهيرية", desc: "أمسيات معرفية مركزة ترفع الوعي وتحوّل المفاهيم إلى ممارسات مهنية قابلة للتطبيق.", image: "https://images.unsplash.com/photo-1711889067043-579e7f118b6d?w=1200&q=80" }, { badge: "تحسين مؤسسي", title: "الاستشارات التنفيذية", desc: "تشخيص مؤسسي عميق، خارطة تنفيذ، ومرافقة تشغيلية حتى تحقق النتائج المستهدفة.", image: "https://images.unsplash.com/photo-1756840210349-7bc0ae472ef8?w=1200&q=80" }] },
      { id: id(), type: "training_domains", eyebrow: "التخصصات", heading: "مجالات التدريب الثمانية" },
      { id: id(), type: "process_steps", heading: "ماذا يشمل كل مسار؟", body: "نصمّم لكل جهة مزيجًا مناسبًا من التدريب والاستشارات والدعم التنفيذي وفق مستوى النضج المؤسسي.", steps: [{ title: "جلسات تشخيص", desc: "تقييم الفجوات والأولويات." }, { title: "تصميم المسار", desc: "بناء محتوى مخصص لكل قطاع." }, { title: "تنفيذ ومتابعة", desc: "تدريب تطبيقي مع مهام تشغيلية." }, { title: "قياس أثر", desc: "مؤشرات قبل/بعد وتقارير تحسين." }] },
      { id: id(), type: "cta_banner", eyebrow: "شريكك في التطوير", heading: "هل أنت مستعد لتصميم مسار تطوير مخصص؟", body: "نبدأ بتشخيص فجوات الأداء الفعلية لفريقك — لا من كتالوج برامج جاهزة.", buttonText: "training@kayan.om", buttonUrl: "mailto:training@kayan.om", linkText: "استعراض كل الفعاليات →", linkUrl: "/ar/events" },
    ],
  );

  // ── Privacy ────────────────────────────────────────────────────────────────
  await upsertPage(
    "privacy",
    "Privacy Policy",
    "سياسة الخصوصية",
    "Privacy Policy — Kayan",
    "سياسة الخصوصية — كيان",
    "How Kayan Training & Consulting collects and uses your personal data.",
    "كيف تجمع كيان للتدريب والاستشارات بياناتك الشخصية وتستخدمها.",
    // EN blocks
    [
      { id: id(), type: "page_hero", eyebrow: "", heading: "Privacy Policy", subheading: "Last updated: 2026", image: "" },
      {
        id: id(), type: "richtext", html: `
<h2>1. Information We Collect</h2>
<p>We collect only essential registration data: name, email address, and contact number, to confirm event registrations and communicate about training programs.</p>
<h2>2. How We Use Your Data</h2>
<p>Your data is used exclusively to confirm registration, send event reminders, and communicate about relevant training programs. It will not be used for marketing purposes outside the scope of our services.</p>
<h2>3. Data Sharing</h2>
<p>Your personal data will not be sold or shared with third parties, except approved service providers necessary to operate the website and manage forms.</p>
<h2>4. Your Rights</h2>
<p>You have the right at any time to request access to, correction of, or complete deletion of your stored data. Contact us via the official email.</p>
<h2>5. Contact</h2>
<p>For any privacy-related inquiries: <a href="mailto:training@kayan.om">training@kayan.om</a></p>
`.trim(),
      },
    ],
    // AR blocks
    [
      { id: id(), type: "page_hero", eyebrow: "", heading: "سياسة الخصوصية", subheading: "آخر تحديث: ٢٠٢٦", image: "" },
      {
        id: id(), type: "richtext", html: `
<h2>١. المعلومات التي نجمعها</h2>
<p>نقوم بجمع البيانات الأساسية للتسجيل فقط: الاسم، البريد الإلكتروني، ورقم التواصل، وذلك لتأكيد التسجيل في الفعاليات والتواصل بشأن البرامج التدريبية.</p>
<h2>٢. كيف نستخدم بياناتك</h2>
<p>تُستخدم بياناتك حصراً لتأكيد التسجيل، إرسال تذكيرات بالفعاليات، والتواصل معك بشأن البرامج التدريبية ذات الصلة. لن نستخدمها لأغراض تسويقية خارج إطار خدماتنا.</p>
<h2>٣. مشاركة البيانات</h2>
<p>لن يتم بيع بياناتك الشخصية أو مشاركتها مع أطراف خارجية، باستثناء مزودي الخدمة المعتمدين اللازمين لتشغيل الموقع وإدارة النماذج.</p>
<h2>٤. حقوقك</h2>
<p>يحق لك في أي وقت طلب الاطلاع على بياناتك المحفوظة، تعديلها، أو حذفها بالكامل. يمكنك التواصل معنا عبر البريد الإلكتروني الرسمي.</p>
<h2>٥. التواصل</h2>
<p>لأي استفسارات تتعلق بخصوصيتك: <a href="mailto:training@kayan.om">training@kayan.om</a></p>
`.trim(),
      },
    ],
  );

  // ── Terms ──────────────────────────────────────────────────────────────────
  await upsertPage(
    "terms",
    "Terms & Conditions",
    "الشروط والأحكام",
    "Terms & Conditions — Kayan",
    "الشروط والأحكام — كيان",
    "Terms governing the use of Kayan Training & Consulting services and website.",
    "الشروط المنظِّمة لاستخدام خدمات وموقع كيان للتدريب والاستشارات.",
    // EN blocks
    [
      { id: id(), type: "page_hero", eyebrow: "", heading: "Terms & Conditions", subheading: "Last updated: 2026", image: "" },
      {
        id: id(), type: "richtext", html: `
<h2>1. Acceptance of Terms</h2>
<p>By accessing this website or registering for any Kayan event or program, you agree to be bound by these terms and conditions.</p>
<h2>2. Registration & Payment</h2>
<p>Registration is confirmed upon receipt of payment. Kayan reserves the right to cancel or reschedule events due to unforeseen circumstances, with full refunds issued in such cases.</p>
<h2>3. Cancellation Policy</h2>
<p>Cancellations made more than 7 days before the event date are eligible for a full refund. Cancellations within 7 days may be subject to an administrative fee.</p>
<h2>4. Intellectual Property</h2>
<p>All training materials, content, and resources provided by Kayan are proprietary. Reproduction or redistribution without written permission is prohibited.</p>
<h2>5. Liability</h2>
<p>Kayan is not liable for indirect, incidental, or consequential damages arising from participation in any program or use of this website.</p>
<h2>6. Contact</h2>
<p>For questions about these terms: <a href="mailto:training@kayan.om">training@kayan.om</a></p>
`.trim(),
      },
    ],
    // AR blocks
    [
      { id: id(), type: "page_hero", eyebrow: "", heading: "الشروط والأحكام", subheading: "آخر تحديث: ٢٠٢٦", image: "" },
      {
        id: id(), type: "richtext", html: `
<h2>١. قبول الشروط</h2>
<p>بالوصول إلى هذا الموقع أو التسجيل في أي فعالية أو برنامج تدريبي من كيان، فإنك توافق على الالتزام بهذه الشروط والأحكام.</p>
<h2>٢. التسجيل والدفع</h2>
<p>يُؤكَّد التسجيل عند استلام الدفع. تحتفظ كيان بحق إلغاء الفعاليات أو إعادة جدولتها في حالات استثنائية، مع استرداد كامل المبلغ في هذه الحالات.</p>
<h2>٣. سياسة الإلغاء</h2>
<p>يحق استرداد المبلغ كاملاً عند الإلغاء قبل ٧ أيام من تاريخ الفعالية. قد يترتب على الإلغاء خلال ٧ أيام رسوم إدارية.</p>
<h2>٤. الملكية الفكرية</h2>
<p>جميع المواد التدريبية والمحتوى والموارد التي تقدمها كيان هي ملكية خاصة. يُحظر نسخها أو إعادة توزيعها دون إذن كتابي.</p>
<h2>٥. المسؤولية</h2>
<p>لا تتحمل كيان المسؤولية عن الأضرار غير المباشرة الناجمة عن المشاركة في أي برنامج أو استخدام هذا الموقع.</p>
<h2>٦. التواصل</h2>
<p>للاستفسار عن هذه الشروط: <a href="mailto:training@kayan.om">training@kayan.om</a></p>
`.trim(),
      },
    ],
  );

  // ── Events listing config ──────────────────────────────────────────────────
  await upsertPage(
    "events",
    "Events & Programs",
    "الفعاليات والبرامج",
    "Events & Programs — Kayan",
    "الفعاليات والبرامج — كيان",
    "Discover upcoming training programs and events from Kayan.",
    "اكتشف برامجنا التدريبية والفعاليات القادمة من كيان.",
    [{ id: id(), type: "listing_config", eyebrow: "Upcoming Events", heading: "Events & Programs", subheading: "Applied training, knowledge evenings, and execution consulting programs.", resultsPerPage: 12 }],
    [{ id: id(), type: "listing_config", eyebrow: "الفعاليات القادمة", heading: "الفعاليات والبرامج", subheading: "برامج تدريبية تطبيقية، وأمسيات معرفية، واستشارات تنفيذية.", resultsPerPage: 12 }],
  );

  // ── Posts listing config ───────────────────────────────────────────────────
  await upsertPage(
    "posts",
    "Articles & Insights",
    "المقالات والمعرفة",
    "Articles — Kayan",
    "المقالات — كيان",
    "Insights, articles, and knowledge resources from Kayan.",
    "مقالات وموارد معرفية من كيان للتدريب والاستشارات.",
    [{ id: id(), type: "listing_config", eyebrow: "Knowledge", heading: "Articles & Insights", subheading: "Practical insights on leadership, learning, and institutional development.", resultsPerPage: 12 }],
    [{ id: id(), type: "listing_config", eyebrow: "المعرفة", heading: "المقالات والمعرفة", subheading: "رؤى عملية حول القيادة والتعلم والتطوير المؤسسي.", resultsPerPage: 12 }],
  );

  // ── Knowledge listing config ───────────────────────────────────────────────
  await upsertPage(
    "knowledge",
    "Knowledge Hub",
    "مركز المعرفة",
    "Knowledge Hub — Kayan",
    "مركز المعرفة — كيان",
    "Resources, guides, and knowledge content from Kayan Training & Consulting.",
    "موارد وأدلة ومحتوى معرفي من كيان للتدريب والاستشارات.",
    [{ id: id(), type: "listing_config", eyebrow: "Resources", heading: "Knowledge Hub", subheading: "Curated resources for professional and institutional development.", resultsPerPage: 12 }],
    [{ id: id(), type: "listing_config", eyebrow: "الموارد", heading: "مركز المعرفة", subheading: "موارد منتقاة للتطوير المهني والمؤسسي.", resultsPerPage: 12 }],
  );

  // ── Home ──────────────────────────────────────────────────────────────────
  await upsertPage(
    "home",
    "Home",
    "الرئيسية",
    "Kayan Training & Consulting",
    "كيان للتدريب والاستشارات",
    "Applied training and execution consulting that turn knowledge into measurable results.",
    "برامج تدريب واستشارات تنفيذية تحوّل المعرفة إلى نتائج قابلة للقياس.",
    // EN blocks
    [
      {
        id: id(),
        type: "hero",
        fullViewport: true,
        overlayColor: "#0c0e0e",
        overlayOpacity: 75,
        grayscaleMedia: true,
        showFeaturedEvent: true,
        media: [
          { id: id(), url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1800&q=80", kind: "image" },
          { id: id(), url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1800&q=80", kind: "image" },
          { id: id(), url: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=1800&q=80", kind: "image" },
        ],
        slides: [
          {
            id: id(),
            heading: "We Build Teams and Accelerate Institutional Impact",
            subheading: "Applied training and execution consulting that turn knowledge into daily performance and measurable results.",
            ctas: [
              { id: id(), text: "Browse Events", url: "/en/events", style: "primary" },
              { id: id(), text: "About Us", url: "/en/about", style: "secondary" },
            ],
          },
          {
            id: id(),
            heading: "Need-Based Programs with Measurable Outcomes",
            subheading: "Each training track is tied to clear performance indicators — not just a content catalog.",
            ctas: [
              { id: id(), text: "Our Services", url: "/en/services", style: "primary" },
              { id: id(), text: "Browse Events", url: "/en/events", style: "secondary" },
            ],
          },
          {
            id: id(),
            heading: "Your Execution Partner from Diagnosis to Results",
            subheading: "We design, deliver, and measure development that creates real organizational change.",
            ctas: [
              { id: id(), text: "Get in Touch", url: "mailto:training@kayan.om", style: "primary" },
            ],
          },
        ],
      },
      {
        id: id(),
        type: "accreditation_bar",
        eyebrow: "Accredited by",
        badgeLabel: "QABA",
        badgeTitle: "Qualified Approved Course Provider",
        badgeSub: "International recognition — global content & assessment standards",
        clientsHeading: "Trusted by leading organizations",
        clients: ["OQ", "OXY OMAN", "Ministry of Education", "OPAL", "PDO", "Omantel", "National Bank of Oman", "Oman Air"],
      },
      {
        id: id(),
        type: "training_domains",
        eyebrow: "Specializations",
        heading: "Eight Training Domains",
      },
      {
        id: id(),
        type: "home_events_carousel",
        eyebrow: "Upcoming Events",
        heading: "Explore Our Programs",
        limit: 6,
      },
      {
        id: id(),
        type: "home_posts_grid",
        eyebrow: "Knowledge",
        heading: "Articles & Insights",
        limit: 6,
      },
      {
        id: id(),
        type: "cta_banner",
        eyebrow: "Your Development Partner",
        heading: "Looking for a Custom Training Track for Your Institution?",
        body: "We design development tracks built on an actual diagnosis of your team's needs — no off-the-shelf solutions.",
        buttonText: "training@kayan.om",
        buttonUrl: "mailto:training@kayan.om",
        linkText: "Browse All Events →",
        linkUrl: "/en/events",
      },
    ],
    // AR blocks
    [
      {
        id: id(),
        type: "hero",
        fullViewport: true,
        overlayColor: "#0c0e0e",
        overlayOpacity: 75,
        grayscaleMedia: true,
        showFeaturedEvent: true,
        media: [
          { id: id(), url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1800&q=80", kind: "image" },
          { id: id(), url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1800&q=80", kind: "image" },
          { id: id(), url: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=1800&q=80", kind: "image" },
        ],
        slides: [
          {
            id: id(),
            heading: "نطوّر الفرق ونُسرّع الأثر المؤسسي",
            subheading: "برامج تدريب واستشارات تنفيذية مصممة لتحويل المعرفة إلى أداء يومي واضح ونتائج قابلة للقياس.",
            ctas: [
              { id: id(), text: "استعراض الفعاليات", url: "/ar/events", style: "primary" },
              { id: id(), text: "تعرّف علينا", url: "/ar/about", style: "secondary" },
            ],
          },
          {
            id: id(),
            heading: "برامج مبنية على الاحتياج بنتائج قابلة للقياس",
            subheading: "كل مسار تدريبي لدينا مرتبط بمؤشرات أداء واضحة — لا مجرد فهرس محتوى.",
            ctas: [
              { id: id(), text: "خدماتنا", url: "/ar/services", style: "primary" },
              { id: id(), text: "استعراض الفعاليات", url: "/ar/events", style: "secondary" },
            ],
          },
          {
            id: id(),
            heading: "شريكك التنفيذي من التشخيص إلى النتائج",
            subheading: "نصمّم وننفّذ ونقيس التطوير الذي يُحدث تغييراً مؤسسياً حقيقياً.",
            ctas: [
              { id: id(), text: "تواصل معنا", url: "mailto:training@kayan.om", style: "primary" },
            ],
          },
        ],
      },
      {
        id: id(),
        type: "accreditation_bar",
        eyebrow: "معتمدون من",
        badgeLabel: "QABA",
        badgeTitle: "مزوّد دورات تدريبية معتمد",
        badgeSub: "اعتراف دولي — معايير محتوى وتقييم دولية",
        clientsHeading: "نفخر بثقة كبرى المؤسسات",
        clients: ["OQ", "OXY OMAN", "وزارة التربية", "OPAL", "PDO", "عُمانتل", "بنك عُمان الوطني", "طيران عُمان"],
      },
      {
        id: id(),
        type: "training_domains",
        eyebrow: "التخصصات",
        heading: "مجالات التدريب الثمانية",
      },
      {
        id: id(),
        type: "home_events_carousel",
        eyebrow: "الفعاليات القادمة",
        heading: "استكشف برامجنا",
        limit: 6,
      },
      {
        id: id(),
        type: "home_posts_grid",
        eyebrow: "المعرفة",
        heading: "المقالات والمعرفة",
        limit: 6,
      },
      {
        id: id(),
        type: "cta_banner",
        eyebrow: "شريكك في التطوير",
        heading: "هل تبحث عن مسار تدريبي مخصص لمؤسستك؟",
        body: "نُصمم مسارات تطوير مبنية على تشخيص فعلي لاحتياجات فريقك — لا حلولاً جاهزة.",
        buttonText: "training@kayan.om",
        buttonUrl: "mailto:training@kayan.om",
        linkText: "استعراض كل الفعاليات →",
        linkUrl: "/ar/events",
      },
    ],
  );
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
