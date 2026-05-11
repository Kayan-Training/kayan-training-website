import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({
    connectionString:
      process.env.DATABASE_URL ??
      "postgres://invalid:invalid@localhost:5432/invalid",
  }),
});

const EVENT_SLUG = "opex-2026";

const trainerSeeds = [
  {
    key: "joseph-f-paris-jr",
    nameEn: "Joseph F. Paris Jr.",
    titleEn: "Founder, XONITEK & Operational Excellence Society",
    bioEn:
      "40 years in international business and operations. Chairman of XONITEK Group of Companies (est. 1985), founder of the Operational Excellence Society, and author of 'State of Readiness'.",
  },
  {
    key: "niklas-modig",
    nameEn: "Niklas Modig",
    titleEn: "Founder & CEO, HUPS / OperationalExcellence.com",
    bioEn:
      "Author of 'This Is Lean – Resolving the Efficiency Paradox' (300,000+ copies, 18 languages), and former researcher/teacher at Stockholm School of Economics and the University of Tokyo.",
  },
  {
    key: "mustafa-al-balushi",
    nameEn: "Mustafa Al-Balushi",
    titleEn: "VP, People & Culture, OQ",
    bioEn:
      "Certified Lean Six Sigma Master Black Belt with transformation leadership at Vale, Port of Salalah, and OQ.",
  },
  {
    key: "yousuf-al-khamisi",
    nameEn: "Yousuf Al Khamisi",
    titleEn: "Director of Governance, University Medical City",
    bioEn:
      "Author of Lean Practitioners Guide for Oman Airports and Ministry of Health, and founder of BDQ (trained 3,000+ professionals).",
  },
  {
    key: "saleh-chehade",
    nameEn: "Dr. Saleh Chehadé, Dr.-Ing.",
    titleEn: "RWTH Aachen | Ex-CCO Juma Al Majid",
    bioEn:
      "Doctor of Engineering with faculty and executive experience across Germany, UAE, Lebanon, and Qatar.",
  },
  {
    key: "brad-schmidt",
    nameEn: "Brad Schmidt",
    titleEn: "President, Makoto Investments Ltd. | TPS Expert",
    bioEn:
      "25+ years consulting in Toyota Production System and Lean, founder of Japan Lean Experience (JLE).",
  },
  {
    key: "souraj-salah",
    nameEn: "Dr. Souraj Salah",
    titleEn: "Business Process Improvement Director | LSS Master Black Belt",
    bioEn:
      "PhD with 25+ years in logistics, contracting, services, retail, and manufacturing, and author of two Lean Six Sigma books.",
  },
  {
    key: "hadj-khelil",
    nameEn: "Hadj Khelil",
    titleEn: "Founder & CEO, BIGmama Technology | AI Innovator",
    bioEn:
      "Founder of ethical AI platform Hyko.ai, TEDx speaker, and Data Science/AI lecturer at Sciences Po Paris.",
  },
  {
    key: "andrey-andreev",
    nameEn: "Andrey Andreev",
    titleEn: "Senior OPEX Advisor | LSS Black Belt | Toyota-Trained",
    bioEn:
      "Senior OPEX advisor trained at Toyota plants in Japan with 20+ years leading large-scale CI and asset-reliability programs.",
  },
];

const keyTopics = [
  "Lean culture",
  "Kaizen",
  "Six Sigma",
  "AI & Digital Transformation",
  "Operational Excellence Strategy",
  "Process mining",
];

const whyAttend = [
  "Oman's only Operational Excellence forum",
  "World-class faculty from Japan, Europe, USA, and the Arab world",
  "Gemba walk experience with a live site visit to Port of Salalah",
  "Premium Arabic continuous-improvement sessions",
  "Networking with 250–400 senior decision-makers",
  "Actionable insights and practical tools for immediate deployment",
  "National alignment with Oman Vision 2040 and Tanfeedh",
  "Destination timing during Salalah Khareef season",
];

const rates = [
  "Super Early Bird (until 15 May 2026): OMR 250 / USD 650 (limited to first 30)",
  "Early Bird (15 May–15 June 2026): OMR 300 / USD 780 (+ Arabic Lean book gift)",
  "Standard Rate (15 July–15 Aug 2026): OMR 380 / USD 988",
  "International Delegates Standard Rate: OMR 600 / USD 990",
  "VIP Executive Package: USD 1,560 (front row + speaker dinner + VIP gala)",
  "Group Rate (5+ from same org): 20% off standard rate",
];

function buildDescriptionHtml() {
  const topicItems = keyTopics.map((x) => `<li>${x}</li>`).join("\n");
  const whyItems = whyAttend.map((x) => `<li>${x}</li>`).join("\n");
  const rateItems = rates.map((x) => `<li>${x}</li>`).join("\n");

  return `
<h2>Conference Theme</h2>
<p><strong>Where Excellence Blooms</strong></p>
<p>The Operational Excellence Conference 2026 highlights breakthrough organizational results through disciplined continuous improvement, lean thinking, and operational mastery.</p>
<p>Inspired by the Salalah Khareef season, the event theme reflects how organizations can bloom with the right tools, conditions, and leadership mindset.</p>

<h2>Core Focus Areas</h2>
<ul>
${topicItems}
</ul>

<h2>Why OPEX 2026</h2>
<ul>
${whyItems}
</ul>

<h2>International Faculty</h2>
<p>Speakers and panelists include experts from Japan, Germany, USA, France, Kazakhstan, and the Arab world, in addition to Omani and GCC panelists.</p>

<h2>Numbers That Matter</h2>
<ul>
  <li>250–400 year-1 target delegates</li>
  <li>81% strategic decision makers (target audience mix)</li>
  <li>2.1M+ GCC audience reach</li>
  <li>40,500+ total addressable professionals</li>
  <li>8+ countries represented</li>
  <li>4.7/5 target satisfaction score</li>
</ul>

<h2>Delegate Enrollment Fees</h2>
<ul>
${rateItems}
</ul>

<h2>Contact</h2>
<p>Email: <a href="mailto:rachid@kayan.om">rachid@kayan.om</a><br/>
Phone: <a href="tel:+96898015452">+968 98015452</a><br/>
Website: <a href="https://www.kayan.om" target="_blank" rel="noreferrer">www.kayan.om</a></p>
`.trim();
}

function buildDescriptionHtmlAr() {
  return `
<h2>موضوع المؤتمر</h2>
<p><strong>حيث تزدهر التميز</strong></p>
<p>يسلط مؤتمر التميز التشغيلي 2026 الضوء على تحقيق نتائج مؤسسية نوعية عبر التحسين المستمر المنضبط، والتفكير الرشيق، والإتقان التشغيلي.</p>
<p>مستوحى من موسم خريف صلالة، ليعكس كيف يمكن للمؤسسات أن تزدهر عندما تتوفر الأدوات المناسبة والبيئة المُمكّنة والعقلية القيادية الصحيحة.</p>

<h2>محاور التركيز الأساسية</h2>
<ul>
  <li>ثقافة Lean</li>
  <li>Kaizen</li>
  <li>Six Sigma</li>
  <li>الذكاء الاصطناعي والتحول الرقمي</li>
  <li>استراتيجية التميز التشغيلي</li>
  <li>تنقيب العمليات</li>
</ul>

<h2>لماذا OPEX 2026</h2>
<ul>
  <li>المنتدى الوحيد في عُمان المتخصص في التميز التشغيلي</li>
  <li>نخبة عالمية من اليابان وأوروبا والولايات المتحدة والعالم العربي</li>
  <li>تجربة Gemba وزيارة ميدانية مباشرة إلى ميناء صلالة</li>
  <li>جلسات عربية متميزة في التحسين المستمر</li>
  <li>شبكات علاقات مع 250–400 من صناع القرار</li>
  <li>أدوات عملية قابلة للتطبيق مباشرة</li>
  <li>مواءمة وطنية مع رؤية عُمان 2040 وبرامج تنفيـذ</li>
  <li>توقيت مميز خلال موسم خريف صلالة</li>
</ul>

<h2>المتحدثون الدوليون</h2>
<p>يشارك في المؤتمر خبراء ومتحدثون من اليابان وألمانيا والولايات المتحدة وفرنسا وكازاخستان والعالم العربي، إضافة إلى متحدثين من عُمان ودول الخليج.</p>

<h2>أرقام مهمة</h2>
<ul>
  <li>الهدف في السنة الأولى: 250–400 مشارك</li>
  <li>81% من الحضور المستهدف من صناع القرار الاستراتيجي</li>
  <li>2.1M+ مدى الوصول الخليجي</li>
  <li>40,500+ حجم السوق المستهدف من المختصين</li>
  <li>تمثيل من أكثر من 8 دول</li>
  <li>هدف رضا 4.7/5</li>
</ul>

<h2>رسوم التسجيل</h2>
<ul>
  <li>Super Early Bird (حتى 15 مايو 2026): 250 ريال عُماني / 650 دولار (للـ30 الأوائل)</li>
  <li>Early Bird (15 مايو–15 يونيو 2026): 300 ريال عُماني / 780 دولار (+ كتاب Lean عربي)</li>
  <li>السعر القياسي (15 يوليو–15 أغسطس 2026): 380 ريال عُماني / 988 دولار</li>
  <li>السعر القياسي للمشاركين الدوليين: 600 ريال عُماني / 990 دولار</li>
  <li>VIP Executive Package: 1,560 دولار (صف أمامي + عشاء المتحدثين + حفل VIP)</li>
  <li>سعر المجموعات (5+ من نفس الجهة): خصم 20% من السعر القياسي</li>
</ul>

<h2>التواصل</h2>
<p>البريد الإلكتروني: <a href="mailto:rachid@kayan.om">rachid@kayan.om</a><br/>
الهاتف: <a href="tel:+96898015452">+968 98015452</a><br/>
الموقع: <a href="https://www.kayan.om" target="_blank" rel="noreferrer">www.kayan.om</a></p>
`.trim();
}

async function upsertTrainer(seed: (typeof trainerSeeds)[number], sortOrder: number) {
  const trainer = await prisma.trainer.upsert({
    where: { id: `opex-2026-${seed.key}` },
    update: {
      name: seed.nameEn,
      specialization: seed.titleEn,
      sortOrder,
    },
    create: {
      id: `opex-2026-${seed.key}`,
      name: seed.nameEn,
      specialization: seed.titleEn,
      sortOrder,
    },
  });

  await prisma.trainerTranslation.upsert({
    where: { trainerId_locale: { trainerId: trainer.id, locale: "en" } },
    update: {
      name: seed.nameEn,
      title: seed.titleEn,
      bio: seed.bioEn,
    },
    create: {
      trainerId: trainer.id,
      locale: "en",
      name: seed.nameEn,
      title: seed.titleEn,
      bio: seed.bioEn,
    },
  });

  await prisma.trainerTranslation.upsert({
    where: { trainerId_locale: { trainerId: trainer.id, locale: "ar" } },
    update: {
      name: seed.nameEn,
      title: seed.titleEn,
      bio: seed.bioEn,
    },
    create: {
      trainerId: trainer.id,
      locale: "ar",
      name: seed.nameEn,
      title: seed.titleEn,
      bio: seed.bioEn,
    },
  });

  return trainer.id;
}

async function main() {
  const categoryIds = await prisma.category.findMany({
    where: {
      slug: { in: ["continuous-improvement", "management-leadership", "tech"] },
    },
    select: { id: true },
  });

  const trainerIds: string[] = [];
  for (let i = 0; i < trainerSeeds.length; i++) {
    trainerIds.push(await upsertTrainer(trainerSeeds[i], i));
  }

  const event = await prisma.event.upsert({
    where: { slug: EVENT_SLUG },
    update: {
      status: "published",
      eventKind: "event",
      type: "onsite",
      language: "both",
      location: "Millennium Hotel Salalah, Oman",
      coverImage: "/event-assets/opex-2026/opex-2026-logo.png",
      isFeatured: true,
      isCertified: false,
      registrationsOpen: true,
      registrationType: "external",
      externalRegistrationUrl: null,
      meetingLink: null,
      meetingPlatform: null,
      startDate: new Date("2026-08-16T00:00:00.000Z"),
      endDate: new Date("2026-08-17T23:59:59.000Z"),
      price: "380",
      isFree: false,
      paymentMethods: "both",
      capacity: 400,
      registrationDeadline: new Date("2026-08-15T23:59:59.000Z"),
      bankTransferDetails: {
        hero: {
          programLogo: "/event-assets/opex-2026/opex-2026-logo.png",
          collaboratorLogos: [
            "/event-assets/opex-2026/kayan-white-logo.png",
            "/event-assets/opex-2026/unique-creativity-logo.png",
          ],
          tags: {
            en: ["Lean", "Six Sigma", "Operational Excellence", "Continuous Improvement"],
            ar: ["Lean", "Six Sigma", "Operational Excellence", "Continuous Improvement"],
          },
        },
        gallery: {
          mode: "hidden",
          mediaIds: [],
        },
      },
      showMapEmbed: false,
      googleMapsLink: null,
    },
    create: {
      slug: EVENT_SLUG,
      status: "published",
      eventKind: "event",
      type: "onsite",
      language: "both",
      location: "Millennium Hotel Salalah, Oman",
      coverImage: "/event-assets/opex-2026/opex-2026-logo.png",
      isFeatured: true,
      isCertified: false,
      registrationsOpen: true,
      registrationType: "external",
      externalRegistrationUrl: null,
      startDate: new Date("2026-08-16T00:00:00.000Z"),
      endDate: new Date("2026-08-17T23:59:59.000Z"),
      price: "380",
      isFree: false,
      paymentMethods: "both",
      capacity: 400,
      registrationDeadline: new Date("2026-08-15T23:59:59.000Z"),
      bankTransferDetails: {
        hero: {
          programLogo: "/event-assets/opex-2026/opex-2026-logo.png",
          collaboratorLogos: [
            "/event-assets/opex-2026/kayan-white-logo.png",
            "/event-assets/opex-2026/unique-creativity-logo.png",
          ],
          tags: {
            en: ["Lean", "Six Sigma", "Operational Excellence", "Continuous Improvement"],
            ar: ["Lean", "Six Sigma", "Operational Excellence", "Continuous Improvement"],
          },
        },
        gallery: {
          mode: "hidden",
          mediaIds: [],
        },
      },
      translations: {
        create: [
          {
            locale: "en",
            title: "Operational Excellence Conference 2026 (OPEX 2026)",
            shortDescription:
              "Oman's first OpEx conference focused on Lean, Six Sigma, and continuous improvement, held in Salalah on 16–17 August 2026.",
            description: { html: buildDescriptionHtml(), type: "html" },
            seoTitle: "OPEX 2026 in Salalah | Operational Excellence Conference Oman",
            seoDescription:
              "Join OPEX 2026, Oman's first dedicated Operational Excellence conference in Salalah on 16–17 August 2026.",
          },
          {
            locale: "ar",
            title: "مؤتمر التميز التشغيلي 2026 (OPEX 2026)",
            shortDescription:
              "أول مؤتمر في عُمان متخصص في التميز التشغيلي وLean وSix Sigma، يُقام في صلالة بتاريخ 16–17 أغسطس 2026.",
            description: { html: buildDescriptionHtmlAr(), type: "html" },
            seoTitle: "OPEX 2026 صلالة | مؤتمر التميز التشغيلي في عُمان",
            seoDescription:
              "انضم إلى OPEX 2026، أول مؤتمر متخصص في التميز التشغيلي في عُمان، في صلالة يومي 16–17 أغسطس 2026.",
          },
        ],
      },
    },
    select: { id: true },
  });

  await prisma.eventTranslation.upsert({
    where: { eventId_locale: { eventId: event.id, locale: "en" } },
    update: {
      title: "Operational Excellence Conference 2026 (OPEX 2026)",
      shortDescription:
        "Oman's first OpEx conference focused on Lean, Six Sigma, and continuous improvement, held in Salalah on 16–17 August 2026.",
      description: { html: buildDescriptionHtml(), type: "html" },
      seoTitle: "OPEX 2026 in Salalah | Operational Excellence Conference Oman",
      seoDescription:
        "Join OPEX 2026, Oman's first dedicated Operational Excellence conference in Salalah on 16–17 August 2026.",
    },
    create: {
      eventId: event.id,
      locale: "en",
      title: "Operational Excellence Conference 2026 (OPEX 2026)",
      shortDescription:
        "Oman's first OpEx conference focused on Lean, Six Sigma, and continuous improvement, held in Salalah on 16–17 August 2026.",
      description: { html: buildDescriptionHtml(), type: "html" },
      seoTitle: "OPEX 2026 in Salalah | Operational Excellence Conference Oman",
      seoDescription:
        "Join OPEX 2026, Oman's first dedicated Operational Excellence conference in Salalah on 16–17 August 2026.",
    },
  });

  await prisma.eventTranslation.upsert({
    where: { eventId_locale: { eventId: event.id, locale: "ar" } },
    update: {
      title: "مؤتمر التميز التشغيلي 2026 (OPEX 2026)",
      shortDescription:
        "أول مؤتمر في عُمان متخصص في التميز التشغيلي وLean وSix Sigma، يُقام في صلالة بتاريخ 16–17 أغسطس 2026.",
      description: { html: buildDescriptionHtmlAr(), type: "html" },
      seoTitle: "OPEX 2026 صلالة | مؤتمر التميز التشغيلي في عُمان",
      seoDescription:
        "انضم إلى OPEX 2026، أول مؤتمر متخصص في التميز التشغيلي في عُمان، في صلالة يومي 16–17 أغسطس 2026.",
    },
    create: {
      eventId: event.id,
      locale: "ar",
      title: "مؤتمر التميز التشغيلي 2026 (OPEX 2026)",
      shortDescription:
        "أول مؤتمر في عُمان متخصص في التميز التشغيلي وLean وSix Sigma، يُقام في صلالة بتاريخ 16–17 أغسطس 2026.",
      description: { html: buildDescriptionHtmlAr(), type: "html" },
      seoTitle: "OPEX 2026 صلالة | مؤتمر التميز التشغيلي في عُمان",
      seoDescription:
        "انضم إلى OPEX 2026، أول مؤتمر متخصص في التميز التشغيلي في عُمان، في صلالة يومي 16–17 أغسطس 2026.",
    },
  });

  await prisma.eventTrainer.deleteMany({ where: { eventId: event.id } });
  await prisma.eventTrainer.createMany({
    data: trainerIds.map((trainerId, sortOrder) => ({
      eventId: event.id,
      trainerId,
      sortOrder,
    })),
  });

  await prisma.eventCategory.deleteMany({ where: { eventId: event.id } });
  if (categoryIds.length > 0) {
    await prisma.eventCategory.createMany({
      data: categoryIds.map((category) => ({ eventId: event.id, categoryId: category.id })),
    });
  }

  await prisma.agendaSession.deleteMany({ where: { eventId: event.id } });

  console.log("Seeded event:", EVENT_SLUG);
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
