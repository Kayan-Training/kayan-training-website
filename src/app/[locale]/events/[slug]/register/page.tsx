import { notFound, redirect } from "next/navigation";

import { EventRegisterForm } from "@/components/events/event-register-form";
import { getEventDetailBySlug } from "@/lib/content/queries";
import { isSupportedLocale } from "@/lib/i18n/config";
import { createRegistration } from "@/lib/registrations/service";
import { getServerSession } from "@/lib/session";

export default async function EventRegisterPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const event = await getEventDetailBySlug(activeLocale, slug);
  if (!event) {
    notFound();
  }
  const eventData = event;
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

    await createRegistration({
      amount: eventData.price,
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
      slug={slug}
      submitAction={submitAction}
    />
  );
}
