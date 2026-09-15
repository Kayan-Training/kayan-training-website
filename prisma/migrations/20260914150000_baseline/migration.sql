-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "phoneNumber" TEXT,
    "password" TEXT,
    "preferredLocale" TEXT NOT NULL DEFAULT 'ar',
    "role" TEXT NOT NULL DEFAULT 'user',
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryTranslation" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaTranslation" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "altText" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "MediaTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "eventKind" TEXT NOT NULL DEFAULT 'event',
    "type" TEXT NOT NULL,
    "location" TEXT,
    "featuredImageId" TEXT,
    "coverImage" TEXT,
    "brochureUrl" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'both',
    "capacity" INTEGER,
    "registrationDeadline" TIMESTAMP(3),
    "meetingLink" TEXT,
    "meetingPlatform" TEXT,
    "registrationsOpen" BOOLEAN NOT NULL DEFAULT true,
    "registrationType" TEXT NOT NULL DEFAULT 'internal',
    "externalRegistrationUrl" TEXT,
    "isCertified" BOOLEAN NOT NULL DEFAULT false,
    "showMapEmbed" BOOLEAN NOT NULL DEFAULT false,
    "googleMapsLink" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethods" TEXT NOT NULL DEFAULT 'both',
    "bankTransferDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTranslation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" VARCHAR(160),
    "description" JSONB,
    "seoTitle" TEXT,
    "seoDescription" TEXT,

    CONSTRAINT "EventTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trainer" (
    "id" TEXT NOT NULL,
    "avatarId" TEXT,
    "email" TEXT,
    "name" TEXT,
    "specialization" TEXT,
    "imageUrl" TEXT,
    "links" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerTranslation" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,

    CONSTRAINT "TrainerTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTrainer" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "role" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventTrainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaSession" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "trainerId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AgendaSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventContactNumber" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "labelEn" TEXT,
    "labelAr" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventContactNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPriceTier" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'OMR',
    "secondaryDisplayPrice" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventPriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPriceTierTranslation" (
    "id" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "EventPriceTierTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventScheduleItem" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL,
    "speakerId" TEXT,

    CONSTRAINT "EventScheduleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventScheduleItemTranslation" (
    "id" TEXT NOT NULL,
    "scheduleItemId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "EventScheduleItemTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationFormField" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "options" JSONB,

    CONSTRAINT "RegistrationFormField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationFormFieldTranslation" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "placeholder" TEXT,

    CONSTRAINT "RegistrationFormFieldTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "formData" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "verifiedById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "verificationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reference" TEXT,
    "proofUrl" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "type" TEXT NOT NULL DEFAULT 'article',
    "featuredImageId" TEXT,
    "authorId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostTranslation" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" JSONB,
    "seoTitle" TEXT,
    "seoDescription" TEXT,

    CONSTRAINT "PostTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageTranslation" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "blocks" JSONB,
    "seoTitle" TEXT,
    "seoDescription" TEXT,

    CONSTRAINT "PageTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "parentId" TEXT,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "targetId" TEXT,
    "url" TEXT,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemTranslation" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "MenuItemTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventCategory" (
    "eventId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "EventCategory_pkey" PRIMARY KEY ("eventId","categoryId")
);

-- CreateTable
CREATE TABLE "PostCategory" (
    "postId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "PostCategory_pkey" PRIMARY KEY ("postId","categoryId")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_identifier_value_key" ON "Verification"("identifier", "value");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_categoryId_locale_key" ON "CategoryTranslation"("categoryId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "MediaTranslation_mediaId_locale_key" ON "MediaTranslation"("mediaId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "EventTranslation_eventId_locale_key" ON "EventTranslation"("eventId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerTranslation_trainerId_locale_key" ON "TrainerTranslation"("trainerId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "EventTrainer_eventId_trainerId_key" ON "EventTrainer"("eventId", "trainerId");

-- CreateIndex
CREATE INDEX "EventContactNumber_eventId_idx" ON "EventContactNumber"("eventId");

-- CreateIndex
CREATE INDEX "EventPriceTier_eventId_idx" ON "EventPriceTier"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventPriceTierTranslation_tierId_locale_key" ON "EventPriceTierTranslation"("tierId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "EventScheduleItemTranslation_scheduleItemId_locale_key" ON "EventScheduleItemTranslation"("scheduleItemId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationFormFieldTranslation_fieldId_locale_key" ON "RegistrationFormFieldTranslation"("fieldId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_registrationId_key" ON "Payment"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PostTranslation_postId_locale_key" ON "PostTranslation"("postId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PageTranslation_pageId_locale_key" ON "PageTranslation"("pageId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Menu_location_key" ON "Menu"("location");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemTranslation_menuItemId_locale_key" ON "MenuItemTranslation"("menuItemId", "locale");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryTranslation" ADD CONSTRAINT "CategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaTranslation" ADD CONSTRAINT "MediaTranslation_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTranslation" ADD CONSTRAINT "EventTranslation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trainer" ADD CONSTRAINT "Trainer_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerTranslation" ADD CONSTRAINT "TrainerTranslation_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTrainer" ADD CONSTRAINT "EventTrainer_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTrainer" ADD CONSTRAINT "EventTrainer_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaSession" ADD CONSTRAINT "AgendaSession_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaSession" ADD CONSTRAINT "AgendaSession_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventContactNumber" ADD CONSTRAINT "EventContactNumber_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPriceTier" ADD CONSTRAINT "EventPriceTier_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPriceTierTranslation" ADD CONSTRAINT "EventPriceTierTranslation_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "EventPriceTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventScheduleItem" ADD CONSTRAINT "EventScheduleItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventScheduleItem" ADD CONSTRAINT "EventScheduleItem_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "Trainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventScheduleItemTranslation" ADD CONSTRAINT "EventScheduleItemTranslation_scheduleItemId_fkey" FOREIGN KEY ("scheduleItemId") REFERENCES "EventScheduleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationFormField" ADD CONSTRAINT "RegistrationFormField_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationFormFieldTranslation" ADD CONSTRAINT "RegistrationFormFieldTranslation_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "RegistrationFormField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTranslation" ADD CONSTRAINT "PostTranslation_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageTranslation" ADD CONSTRAINT "PageTranslation_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemTranslation" ADD CONSTRAINT "MenuItemTranslation_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCategory" ADD CONSTRAINT "EventCategory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCategory" ADD CONSTRAINT "EventCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCategory" ADD CONSTRAINT "PostCategory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCategory" ADD CONSTRAINT "PostCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

