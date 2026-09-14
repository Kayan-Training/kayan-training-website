import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { EventRegisterForm } from "@/components/events/event-register-form";
import { getEventDetailBySlug } from "@/lib/content/queries";
import { isSupportedLocale } from "@/lib/i18n/config";
import { resolveTierAmount } from "@/lib/registrations/resolve-tier-amount";
import { createRegistration } from "@/lib/registrations/service";
import { getServerSession } from "@/lib/session";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
};

export default async function EventRegisterPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const event = await getEventDetailBySlug(activeLocale, slug, { kind: "training_course" });
  if (!event) {
    notFound();
  }
  const eventData = event;
  if (!eventData.registrationsOpen) {
    redirect(`/${activeLocale}/training-courses/${slug}`);
  }
  if (eventData.registrationType === "external" && eventData.externalRegistrationUrl) {
    redirect(eventData.externalRegistrationUrl);
  }

  const session = await getServerSession();
  const defaultFullName = (session?.user?.name ?? "").trim();

  async function submitAction(formData: FormData) {
    "use server";

    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const phoneCountry = String(formData.get("phoneCountry") ?? "+968").trim();
    const paymentMethod = (String(formData.get("paymentMethod") ?? "card") as "bank" | "card" | "free");

    if (!fullName || !email) {
      return;
    }

    const submittedTierId = String(formData.get("priceTierId") ?? "").trim();
    // If a tier id was submitted but doesn't match any tier belonging to THIS event
    // (tampered, stale, or copied from a different event), fall back to the flat event
    // price rather than trusting an unresolvable amount. `eventData` is server-fetched via
    // getEventDetailBySlug above and is not controllable by the submitted form data.
    const amount = String(
      resolveTierAmount(eventData.priceTiers, Number(eventData.price), submittedTierId),
    );

    await createRegistration({
      amount,
      eventId: eventData.id,
      locale: activeLocale,
      paymentMethod,
      registrantEmail: email,
      registrantName: fullName,
      userId: session?.user?.id,
      extraFormData: { phone, phoneCountry },
    });
  }

  return (
    <EventRegisterForm
      event={{
        bankTransfer: eventData.bankTransfer,
        coverImage: eventData.coverImage,
        excerpt: eventData.excerpt,
        isFeatured: eventData.isFeatured,
        isFree: eventData.isFree,
        location: eventData.location,
        paymentMethods: eventData.paymentMethods,
        price: eventData.price,
        startDate: new Date(eventData.startDate),
        title: eventData.title,
      }}
      eventFormFields={eventData.formFields}
      initialRegistrant={{
        email: session?.user?.email ?? "",
        fullName: defaultFullName,
        phone: "",
        phoneCountry: "+968",
      }}
      isLoggedIn={Boolean(session)}
      locale={activeLocale}
      priceTiers={eventData.priceTiers}
      slug={slug}
      submitAction={submitAction}
    />
  );
}
