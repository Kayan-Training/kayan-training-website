import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

type ProgramKind = "event" | "training_course";

type SourceRow = {
  dateRange: string;
  nameAr: string;
  trainersRaw: string;
  categoryAr: string;
  longDescAr: string;
  longDescEn: string;
  nameEn: string;
};

const prisma = new PrismaClient({
  adapter: new PrismaNeon({
    connectionString:
      process.env.DATABASE_URL ??
      "postgres://invalid:invalid@localhost:5432/invalid",
  }),
});

const AR_MONTHS: Record<string, number> = {
  "يناير": 1,
  "فبراير": 2,
  "مارس": 3,
  "ابريل": 4,
  "أبريل": 4,
  "مايو": 5,
  "يونيو": 6,
  "يوليو": 7,
  "اغسطس": 8,
  "أغسطس": 8,
  "سبتمبر": 9,
  "اكتوبر": 10,
  "أكتوبر": 10,
  "نوفمبر": 11,
  "ديسمبر": 12,
};

const TRAINER_ENGLISH_MAP: Record<string, string> = {
  "ياسر الحزيمي": "Yasser Al-Hazaimi",
  "د.ثابت حجازي": "Dr. Thabet Hijazi",
  "د. سهل المهدي": "Dr. Sahl Al-Mahdi",
  "د.سهل المهدي": "Dr. Sahl Al-Mahdi",
  "د.أسامة الجامع": "Dr. Osama Al-Jame",
  "د. خالد غطاس": "Dr. Khaled Ghattas",
  "أ.د بشير الرشيدي": "Prof. Bashir Al-Rashidi",
  "أ.د حمود القشعان": "Prof. Hamoud Al-Qashaan",
  "د.مصطفى ابوسعد": "Dr. Mostafa Abusaad",
  "د. سيف الهادي": "Dr. Saif Al-Hadi",
};

const CATEGORY_AR_ALIASES: Record<string, string[]> = {
  "الادارة والقيادة": ["الإدارة و القيادة", "الإدارة والقيادة"],
  "الاقتصاد": ["الاقتصاد"],
  "التعليم وعلم النفس": ["النفسي التربوي"],
  "نمط الحياة": ["نمط حياة", "نمط الحياة"],
};

function normalizeArabic(value: string): string {
  return value
    .trim()
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/\s+/g, " ")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[أإآ]/g, "ا")
    .replace(/[ؤئ]/g, "ء");
}

function slugify(input: string): string {
  const latin = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (latin.length > 0) {
    return latin;
  }

  return `program-${createHash("sha1").update(input).digest("hex").slice(0, 10)}`;
}

function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractShortDescription(text: string, max = 160): string {
  const cleaned = cleanText(text);
  if (!cleaned) return "";
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

function seoTitle(name: string, kind: ProgramKind, locale: "ar" | "en"): string {
  if (locale === "ar") {
    return kind === "training_course" ? `${name} | دورة تدريبية | كيان` : `${name} | فعالية | كيان`;
  }
  return kind === "training_course" ? `${name} | Training Course | Kayan` : `${name} | Event | Kayan`;
}

function seoDescription(name: string, desc: string, kind: ProgramKind, locale: "ar" | "en"): string {
  const base = extractShortDescription(desc, 120);
  if (locale === "ar") {
    const suffix = kind === "training_course" ? "اكتشف تفاصيل الدورة التدريبية مع كيان." : "اكتشف تفاصيل الفعالية مع كيان.";
    return extractShortDescription(`${name} - ${base} ${suffix}`, 160);
  }

  const suffix = kind === "training_course" ? "Discover this training course with Kayan." : "Discover this event with Kayan.";
  return extractShortDescription(`${name} - ${base} ${suffix}`, 160);
}

function parseDMYNumeric(value: string): { day: number; month: number; year: number } {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) throw new Error(`Invalid numeric date format: ${value}`);
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  return { day, month, year };
}

function parseDateRange(raw: string): { startDate: Date; endDate: Date } {
  const value = cleanText(raw)
    .replace(/[–—]/g, "-")
    .replace(/\s*--\s*/g, " -- ");

  if (value.includes(" -- ")) {
    const [start, end] = value.split(" -- ").map((v) => v.trim());
    const startParts = parseDMYNumeric(start);
    const endParts = parseDMYNumeric(end);
    return {
      startDate: new Date(Date.UTC(startParts.year, startParts.month - 1, startParts.day, 8, 0, 0)),
      endDate: new Date(Date.UTC(endParts.year, endParts.month - 1, endParts.day, 17, 0, 0)),
    };
  }

  if (value.includes("/")) {
    const parts = parseDMYNumeric(value);
    const start = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 8, 0, 0));
    const end = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 17, 0, 0));
    return { startDate: start, endDate: end };
  }

  const arRange = value.match(/^(\d{1,2})\s*-\s*(\d{1,2})\s+([^\s]+)\s+(\d{4})$/);
  if (arRange) {
    const startDay = Number(arRange[1]);
    const endDay = Number(arRange[2]);
    const monthToken = arRange[3];
    const year = Number(arRange[4]);
    const month = AR_MONTHS[monthToken];
    if (!month) {
      throw new Error(`Unsupported Arabic month token: ${monthToken} in '${raw}'`);
    }

    return {
      startDate: new Date(Date.UTC(year, month - 1, startDay, 8, 0, 0)),
      endDate: new Date(Date.UTC(year, month - 1, endDay, 17, 0, 0)),
    };
  }

  throw new Error(`Unsupported date format: ${raw}`);
}

function splitTrainers(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split("-")
    .map((name) => cleanText(name))
    .filter(Boolean);
}

function trainerNameEn(nameAr: string): string {
  if (TRAINER_ENGLISH_MAP[nameAr]) return TRAINER_ENGLISH_MAP[nameAr];
  return `Trainer (${nameAr})`;
}

async function resolveCategoryIdByArabicName(): Promise<Map<string, string>> {
  const categories = await prisma.category.findMany({
    include: {
      translations: {
        where: { locale: "ar" },
        select: { name: true },
      },
    },
  });

  const map = new Map<string, string>();
  for (const category of categories) {
    const arName = category.translations[0]?.name;
    if (!arName) continue;
    map.set(normalizeArabic(arName), category.id);
  }

  for (const [target, aliases] of Object.entries(CATEGORY_AR_ALIASES)) {
    const canonicalId = map.get(normalizeArabic(target));
    if (!canonicalId) continue;
    for (const alias of aliases) {
      map.set(normalizeArabic(alias), canonicalId);
    }
  }

  return map;
}

function readRowsFromSheet(workbook: XLSX.WorkBook, sheetName: string): SourceRow[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Missing worksheet: ${sheetName}`);
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  return rawRows
    .map((row) => ({
      dateRange: cleanText(row["Date / Range"]),
      nameAr: cleanText(row["Name (AR)"]),
      trainersRaw: cleanText(row["المدرب / Trainers"]),
      categoryAr: cleanText(row["Categories"]),
      longDescAr: cleanText(row["Chatgpt (Long Desc AR)"]),
      longDescEn: cleanText(row["Chatgpt (Long Desc EN)"]),
      nameEn: cleanText(row["Name (EN)"]),
    }))
    .filter((row) => row.nameAr && row.nameEn && row.dateRange);
}

async function upsertTrainerByArabicName(nameAr: string): Promise<string> {
  const normalized = normalizeArabic(nameAr);

  const existing = await prisma.trainerTranslation.findFirst({
    where: {
      locale: "ar",
      name: nameAr,
    },
    select: { trainerId: true },
  });

  const nameEn = trainerNameEn(nameAr);
  const slug = slugify(normalized);
  const email = `imported.${slug}@kayan.local`;

  const trainerId =
    existing?.trainerId ??
    (
      await prisma.trainer.create({
        data: {
          email,
          name: nameEn,
          specialization: null,
        },
        select: { id: true },
      })
    ).id;

  await prisma.trainerTranslation.upsert({
    where: { trainerId_locale: { trainerId, locale: "ar" } },
    update: { name: nameAr },
    create: {
      trainerId,
      locale: "ar",
      name: nameAr,
    },
  });

  await prisma.trainerTranslation.upsert({
    where: { trainerId_locale: { trainerId, locale: "en" } },
    update: { name: nameEn },
    create: {
      trainerId,
      locale: "en",
      name: nameEn,
    },
  });

  return trainerId;
}

async function importSheetPrograms(
  sheetRows: SourceRow[],
  kind: ProgramKind,
  categoryIdByArabicName: Map<string, string>,
): Promise<void> {
  for (const row of sheetRows) {
    const { startDate, endDate } = parseDateRange(row.dateRange);

    const categoryId = categoryIdByArabicName.get(normalizeArabic(row.categoryAr));
    if (!categoryId) {
      throw new Error(`No matching category found for Arabic name: '${row.categoryAr}'`);
    }

    const trainerNamesAr = splitTrainers(row.trainersRaw);
    const trainerIds: string[] = [];
    for (const trainerNameAr of trainerNamesAr) {
      const trainerId = await upsertTrainerByArabicName(trainerNameAr);
      trainerIds.push(trainerId);
    }

    const slugBase = slugify(row.nameEn || row.nameAr);
    const slug = `${slugBase}-${startDate.getUTCFullYear()}`;

    const event = await prisma.event.upsert({
      where: { slug },
      update: {
        status: "published",
        eventKind: kind,
        type: "onsite",
        language: "both",
        location: null,
        startDate,
        endDate,
      },
      create: {
        slug,
        status: "published",
        eventKind: kind,
        type: "onsite",
        language: "both",
        location: null,
        startDate,
        endDate,
      },
      select: { id: true },
    });

    await prisma.eventTranslation.upsert({
      where: { eventId_locale: { eventId: event.id, locale: "ar" } },
      update: {
        title: row.nameAr,
        shortDescription: extractShortDescription(row.longDescAr),
        description: row.longDescAr ? ({ type: "html", html: `<p>${row.longDescAr}</p>` } as never) : undefined,
        seoTitle: seoTitle(row.nameAr, kind, "ar"),
        seoDescription: seoDescription(row.nameAr, row.longDescAr, kind, "ar"),
      },
      create: {
        eventId: event.id,
        locale: "ar",
        title: row.nameAr,
        shortDescription: extractShortDescription(row.longDescAr),
        description: row.longDescAr ? ({ type: "html", html: `<p>${row.longDescAr}</p>` } as never) : undefined,
        seoTitle: seoTitle(row.nameAr, kind, "ar"),
        seoDescription: seoDescription(row.nameAr, row.longDescAr, kind, "ar"),
      },
    });

    await prisma.eventTranslation.upsert({
      where: { eventId_locale: { eventId: event.id, locale: "en" } },
      update: {
        title: row.nameEn,
        shortDescription: extractShortDescription(row.longDescEn),
        description: row.longDescEn ? ({ type: "html", html: `<p>${row.longDescEn}</p>` } as never) : undefined,
        seoTitle: seoTitle(row.nameEn, kind, "en"),
        seoDescription: seoDescription(row.nameEn, row.longDescEn, kind, "en"),
      },
      create: {
        eventId: event.id,
        locale: "en",
        title: row.nameEn,
        shortDescription: extractShortDescription(row.longDescEn),
        description: row.longDescEn ? ({ type: "html", html: `<p>${row.longDescEn}</p>` } as never) : undefined,
        seoTitle: seoTitle(row.nameEn, kind, "en"),
        seoDescription: seoDescription(row.nameEn, row.longDescEn, kind, "en"),
      },
    });

    await prisma.eventCategory.upsert({
      where: {
        eventId_categoryId: {
          eventId: event.id,
          categoryId,
        },
      },
      update: {},
      create: {
        eventId: event.id,
        categoryId,
      },
    });

    await prisma.eventTrainer.deleteMany({
      where: { eventId: event.id },
    });

    for (const [index, trainerId] of trainerIds.entries()) {
      await prisma.eventTrainer.create({
        data: {
          eventId: event.id,
          trainerId,
          sortOrder: index,
        },
      });
    }
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Set it before running prisma:seed:excel.");
  }

  const workbookPath = path.join(process.cwd(), ".source", "Kayan.om Programs Data.xlsx");
  if (!fs.existsSync(workbookPath)) {
    throw new Error(`Workbook not found at: ${workbookPath}`);
  }

  const workbook = XLSX.readFile(workbookPath);
  const categoryIdByArabicName = await resolveCategoryIdByArabicName();

  const trainingRows = readRowsFromSheet(workbook, "Training_Courses");
  const eventRows = readRowsFromSheet(workbook, "Events");

  await importSheetPrograms(trainingRows, "training_course", categoryIdByArabicName);
  await importSheetPrograms(eventRows, "event", categoryIdByArabicName);

  console.log(`Imported ${trainingRows.length} training courses and ${eventRows.length} events from Excel.`);
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
