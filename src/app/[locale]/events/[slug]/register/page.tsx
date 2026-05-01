import { notFound } from "next/navigation";

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

  const session = await getServerSession();
  const nameParts = (session?.user?.name ?? "").trim().split(/\s+/).filter(Boolean);
  const defaultFirstName = nameParts[0] ?? "";
  const defaultLastName = nameParts.slice(1).join(" ");

  async function submitAction(formData: FormData) {
    "use server";

    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const phoneCountry = String(formData.get("phoneCountry") ?? "+968").trim();
    const paymentMethod = (String(formData.get("paymentMethod") ?? "card") as "bank" | "card" | "free");

    if (!firstName || !lastName || !email) {
      return;
    }

    await createRegistration({
      amount: eventData.price,
      eventId: eventData.id,
      locale: activeLocale,
      paymentMethod,
      registrantEmail: email,
      registrantName: `${firstName} ${lastName}`.trim(),
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
        firstName: defaultFirstName,
        lastName: defaultLastName,
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
