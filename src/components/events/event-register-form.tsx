"use client";

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building2, CalendarDays, ChevronDown, CreditCard, Landmark, MapPin, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type FormField = {
  id: string;
  label: string;
  options: string[];
  placeholder: string;
  required: boolean;
  type: string;
};

type EmailCheckState = "idle" | "checking" | "available" | "taken" | "error";

export function EventRegisterForm({
  event,
  eventFormFields,
  initialRegistrant,
  isLoggedIn,
  locale,
  slug,
  submitAction,
}: {
  event: {
    bankTransfer: {
      accountName?: string | null;
      bankName?: string | null;
      iban?: string | null;
      instructions?: string | null;
      swift?: string | null;
    };
    coverImage: string;
    excerpt: string;
    isFeatured: boolean;
    isFree: boolean;
    location: string;
    paymentMethods: "bank" | "both" | "card";
    price: string;
    startDate: Date;
    title: string;
  };
  eventFormFields: FormField[];
  initialRegistrant: {
    email: string;
    fullName: string;
    phone: string;
    phoneCountry: string;
  };
  isLoggedIn: boolean;
  locale: "ar" | "en";
  slug: string;
  submitAction: (formData: FormData) => void;
}) {
  const registerInputClass = "input-underline w-full bg-white px-3 py-2.5 text-sm !text-zinc-900 placeholder:text-zinc-500";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [registerForAnother, setRegisterForAnother] = useState(false);
  const [email, setEmail] = useState(initialRegistrant.email);
  const [emailCheckState, setEmailCheckState] = useState<EmailCheckState>("idle");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"bank" | "card" | "free">(
    event.isFree ? "free" : event.paymentMethods === "bank" ? "bank" : "card",
  );
  const ticketPaymentMethod: "bank" | "card" | "free" = event.isFree
    ? "free"
    : event.paymentMethods === "both"
      ? selectedPaymentMethod
      : event.paymentMethods === "bank"
        ? "bank"
        : "card";
  const ticketLabel = event.isFree
    ? locale === "ar"
      ? "تذكرة عامة - مجاني"
      : "General Ticket - Free"
    : `${locale === "ar" ? "تذكرة عامة" : "General Ticket"} - OMR ${event.price}`;
  const paymentLabel =
    ticketPaymentMethod === "free"
      ? (locale === "ar" ? "مجاني" : "Free")
      : ticketPaymentMethod === "bank"
        ? (locale === "ar" ? "تحويل بنكي" : "Bank Transfer")
        : (locale === "ar" ? "بطاقة" : "Card");

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(event.startDate)),
    [event.startDate, locale],
  );

  const indicatorClass = (n: number) =>
    `step-indicator flex h-8 w-8 items-center justify-center border text-xs font-mono transition-all ${
      step === n
        ? "border-primary bg-[rgba(23,67,78,1)] text-primary"
        : step > n
          ? "border-[rgba(40,180,115,0.5)] bg-[rgba(40,180,115,0.15)] text-secondary"
          : "border-outline-variant/30 text-on-surface-variant"
    }`;

  useEffect(() => {
    const value = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value || !emailRegex.test(value)) {
      setEmailCheckState("idle");
      return;
    }

    setEmailCheckState("checking");
    const timer = setTimeout(() => {
      fetch(`/api/events/${encodeURIComponent(slug)}/registration-email-check?email=${encodeURIComponent(value)}`)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Email check failed.");
          }
          return (await response.json()) as { exists: boolean };
        })
        .then((data) => {
          setEmailCheckState(data.exists ? "taken" : "available");
        })
        .catch(() => {
          setEmailCheckState("error");
        });
    }, 450);

    return () => clearTimeout(timer);
  }, [email, slug]);

  const isDuplicateEmail = emailCheckState === "taken";
  const isCheckingEmail = emailCheckState === "checking";

  return (
    <div className="max-w-[1200px] mx-auto grid grid-cols-12 gap-10 px-6 py-12 md:px-10 md:py-20">
      <div className="col-span-12 lg:col-span-7">
        <div className="mb-10">
          <Link
            className="mb-4 flex items-center gap-2 text-xs text-on-surface-variant hover:text-on-surface"
            href={`/${locale}/events/${slug}`}
          >
            <HugeiconsIcon className="rtl:rotate-180" icon={ArrowLeft01Icon} size={14} strokeWidth={1.8} />
            <span>{event.title}</span>
          </Link>
          <h1 className="text-4xl font-semibold tracking-tight">
            {locale === "ar" ? "التسجيل في الفعالية" : "Event Registration"}
          </h1>
        </div>

        <div className="mb-10 flex items-center gap-0">
          <div className={indicatorClass(1)}>1</div>
          <div className="h-px flex-1 bg-outline-variant/30" />
          <div className={indicatorClass(2)}>2</div>
          <div className="h-px flex-1 bg-outline-variant/30" />
          <div className={indicatorClass(3)}>3</div>
        </div>

        <form action={submitAction}>
          <input name="paymentMethod" type="hidden" value={ticketPaymentMethod} />

          {step === 1 ? (
            <section>
              <h2 className="mb-6 border-b border-outline-variant/20 pb-3 text-xl font-semibold">
                {locale === "ar" ? "المعلومات الشخصية" : "Personal Information"}
              </h2>
              <input name="registeringForAnother" type="hidden" value={registerForAnother ? "1" : "0"} />

              {isLoggedIn ? (
                <div className="mb-6 rounded border border-outline-variant/30 bg-surface-container-low p-4">
                  <label className="flex items-start gap-3">
                    <input
                      checked={registerForAnother}
                      className="mt-0.5 accent-secondary"
                      type="checkbox"
                      onChange={(e) => setRegisterForAnother(e.target.checked)}
                    />
                    <span className="text-xs text-on-surface-variant">
                      {locale === "ar"
                        ? "أنا أسجل لشخص آخر (سأدخل بيانات مشارك مختلف)"
                        : "I am registering someone else (I will enter a different participant)."}
                    </span>
                  </label>
                </div>
              ) : null}

              <div className="mb-6 grid grid-cols-1 gap-6">
                <div>
                  <label className="mb-2 block text-[11px] uppercase tracking-widest text-on-surface-variant">
                    {locale === "ar" ? "الاسم الكامل *" : "Full Name *"}
                  </label>
                  <input className={registerInputClass} defaultValue={initialRegistrant.fullName} name="fullName" required />
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-[11px] uppercase tracking-widest text-on-surface-variant">
                  {locale === "ar" ? "البريد الإلكتروني *" : "Email Address *"}
                </label>
                <input
                  className={registerInputClass}
                  dir="ltr"
                  value={email}
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                />
                <p className="mt-1.5 text-[10px] text-on-surface-variant">
                  {locale === "ar"
                    ? "سيُرسل تأكيد التسجيل على هذا البريد"
                    : "Registration confirmation will be sent to this email"}
                </p>
                {emailCheckState === "checking" ? (
                  <p className="mt-1 text-[11px] text-on-surface-variant">
                    {locale === "ar" ? "جارٍ التحقق من البريد..." : "Checking email..."}
                  </p>
                ) : null}
                {emailCheckState === "taken" ? (
                  <p className="mt-1 text-[11px] text-rose-400">
                    {locale === "ar"
                      ? "هذا البريد مسجّل بالفعل في نفس الفعالية."
                      : "This email is already registered for this event."}
                  </p>
                ) : null}
                {emailCheckState === "available" ? (
                  <p className="mt-1 text-[11px] text-emerald-400">
                    {locale === "ar" ? "يمكنك المتابعة بهذا البريد." : "This email can register for this event."}
                  </p>
                ) : null}
                {emailCheckState === "error" ? (
                  <p className="mt-1 text-[11px] text-amber-300">
                    {locale === "ar"
                      ? "تعذر التحقق حالياً. سنعيد التحقق عند الإرسال."
                      : "Could not verify right now. We will re-check on submit."}
                  </p>
                ) : null}
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-[11px] uppercase tracking-widest text-on-surface-variant">
                  {locale === "ar" ? "رقم الهاتف *" : "Phone Number *"}
                </label>
                <div className="flex gap-3">
                  <div className="relative w-24">
                    <select
                      className="h-10 w-full appearance-none border-b border-outline-variant/40 bg-white px-3 text-sm !text-zinc-900"
                      defaultValue={initialRegistrant.phoneCountry || "+968"}
                      name="phoneCountry"
                    >
                      <option value="+968">OM +968</option>
                      <option value="+971">AE +971</option>
                      <option value="+966">SA +966</option>
                      <option value="+974">QA +974</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute end-2 top-1/2 size-3.5 -translate-y-1/2 text-outline" />
                  </div>
                  <input
                    className="input-underline flex-1 bg-white px-3 py-2.5 text-sm !text-zinc-900 placeholder:text-zinc-500"
                    dir="ltr"
                    name="phone"
                    defaultValue={initialRegistrant.phone}
                    placeholder="9538 3138"
                    required
                  />
                </div>
              </div>

              {!!eventFormFields.length && (
                <div className="mb-8 grid grid-cols-1 gap-5">
                  {eventFormFields.map((field) =>
                    field.type === "select" ? (
                      <div key={field.id}>
                        <label className="mb-2 block text-[11px] uppercase tracking-widest text-on-surface-variant">
                          {field.label}
                          {field.required ? " *" : ""}
                        </label>
                        <select
                          className={registerInputClass}
                          defaultValue=""
                          name={`field-${field.id}`}
                          required={field.required}
                        >
                          <option disabled value="">
                            {field.placeholder || field.label}
                          </option>
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : field.type === "textarea" ? (
                      <div key={field.id}>
                        <label className="mb-2 block text-[11px] uppercase tracking-widest text-on-surface-variant">
                          {field.label}
                          {field.required ? " *" : ""}
                        </label>
                        <textarea
                          className="input-underline w-full resize-none bg-white px-3 py-2.5 text-sm !text-zinc-900 placeholder:text-zinc-500"
                          name={`field-${field.id}`}
                          placeholder={field.placeholder || field.label}
                          required={field.required}
                          rows={3}
                        />
                      </div>
                    ) : (
                      <div key={field.id}>
                        <label className="mb-2 block text-[11px] uppercase tracking-widest text-on-surface-variant">
                          {field.label}
                          {field.required ? " *" : ""}
                        </label>
                        <input
                          className={registerInputClass}
                          name={`field-${field.id}`}
                          placeholder={field.placeholder || field.label}
                          required={field.required}
                          type={field.type === "email" ? "email" : "text"}
                        />
                      </div>
                    ),
                  )}
                </div>
              )}

              <button
                className="inline-flex items-center gap-2 bg-primary px-7 py-4 text-xs uppercase tracking-widest text-primary-foreground hover:bg-primary-container hover:text-on-primary-container"
                disabled={isDuplicateEmail || isCheckingEmail}
                onClick={() => setStep(2)}
                type="button"
              >
                {locale === "ar" ? "التالي: طريقة الدفع" : "Next: Payment Method"}
                <HugeiconsIcon className="rtl:rotate-180" icon={ArrowRight01Icon} size={16} strokeWidth={1.8} />
              </button>
            </section>
          ) : null}

          {step === 2 ? (
            <section>
              <h2 className="mb-6 border-b border-outline-variant/20 pb-3 text-xl font-semibold">
                {locale === "ar" ? "طريقة الدفع" : "Payment Method"}
              </h2>
              <div className="mb-8 space-y-3">
                {event.isFree ? (
                  <div className="flex items-center justify-between border border-secondary/40 bg-surface-container p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-secondary/20">
                        <UserRound className="size-4 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{locale === "ar" ? "تذكرة عامة" : "General Ticket"}</p>
                        <p className="text-xs text-on-surface-variant">
                          {locale === "ar" ? "فعالية مجانية" : "Free event access"}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-lg text-secondary">
                      {locale === "ar" ? "مجاني" : "Free"}
                    </span>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(event.paymentMethods === "both" || event.paymentMethods === "card") ? (
                      <label className="flex cursor-pointer items-start gap-3 border border-outline-variant/30 bg-surface-container-low p-4 transition-colors has-[:checked]:border-secondary/50 has-[:checked]:bg-surface-container">
                        <input
                          checked={selectedPaymentMethod === "card"}
                          className="mt-1 accent-secondary"
                          name="paymentMethodVisual"
                          type="radio"
                          value="card"
                          onChange={() => setSelectedPaymentMethod("card")}
                        />
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <CreditCard className="size-4 text-secondary" />
                            <span className="text-sm font-semibold">{locale === "ar" ? "بطاقة" : "Card"}</span>
                          </div>
                          <p className="text-xs text-on-surface-variant">
                            {locale === "ar" ? "الدفع الفوري عبر البطاقة" : "Instant checkout with debit/credit card"}
                          </p>
                        </div>
                      </label>
                    ) : null}
                    {(event.paymentMethods === "both" || event.paymentMethods === "bank") ? (
                      <label className="flex cursor-pointer items-start gap-3 border border-outline-variant/30 bg-surface-container-low p-4 transition-colors has-[:checked]:border-secondary/50 has-[:checked]:bg-surface-container">
                        <input
                          checked={selectedPaymentMethod === "bank"}
                          className="mt-1 accent-secondary"
                          name="paymentMethodVisual"
                          type="radio"
                          value="bank"
                          onChange={() => setSelectedPaymentMethod("bank")}
                        />
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <Landmark className="size-4 text-secondary" />
                            <span className="text-sm font-semibold">{locale === "ar" ? "تحويل بنكي" : "Bank Transfer"}</span>
                          </div>
                          <p className="text-xs text-on-surface-variant">
                            {locale === "ar" ? "تحويل يدوي وفق تفاصيل البنك" : "Manual transfer using bank instructions"}
                          </p>
                        </div>
                      </label>
                    ) : null}
                  </div>
                )}
              </div>

              {!event.isFree && selectedPaymentMethod === "bank" ? (
                <div className="mb-6 space-y-3 border border-outline-variant/30 bg-surface-container-low p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Building2 className="size-4 text-secondary" />
                    <span>{locale === "ar" ? "تفاصيل التحويل البنكي" : "Bank Transfer Details"}</span>
                  </div>
                  {event.bankTransfer.bankName ? <p className="text-xs text-on-surface-variant"><span className="font-semibold text-on-surface">{locale === "ar" ? "البنك:" : "Bank:"}</span> {event.bankTransfer.bankName}</p> : null}
                  {event.bankTransfer.accountName ? <p className="text-xs text-on-surface-variant"><span className="font-semibold text-on-surface">{locale === "ar" ? "اسم الحساب:" : "Account Name:"}</span> {event.bankTransfer.accountName}</p> : null}
                  {event.bankTransfer.iban ? <p className="text-xs text-on-surface-variant"><span className="font-semibold text-on-surface">IBAN:</span> {event.bankTransfer.iban}</p> : null}
                  {event.bankTransfer.swift ? <p className="text-xs text-on-surface-variant"><span className="font-semibold text-on-surface">SWIFT:</span> {event.bankTransfer.swift}</p> : null}
                  {event.bankTransfer.instructions ? (
                    <p className="pt-1 text-xs leading-relaxed text-on-surface-variant">
                      {event.bankTransfer.instructions}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex gap-4">
                <button className="ghost-border px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant hover:text-on-surface" onClick={() => setStep(1)} type="button">
                  {locale === "ar" ? "السابق" : "Back"}
                </button>
                <button
                  className="inline-flex items-center gap-2 bg-primary px-7 py-4 text-xs uppercase tracking-widest text-primary-foreground hover:bg-primary-container hover:text-on-primary-container"
                  onClick={() => setStep(3)}
                  type="button"
                >
                  {locale === "ar" ? "التالي: المراجعة" : "Next: Review"}
                  <HugeiconsIcon className="rtl:rotate-180" icon={ArrowRight01Icon} size={16} strokeWidth={1.8} />
                </button>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section>
              <h2 className="mb-6 border-b border-outline-variant/20 pb-3 text-xl font-semibold">
                {locale === "ar" ? "مراجعة وتأكيد" : "Review & Confirm"}
              </h2>
              <div className="mb-6 space-y-4 bg-surface-container-lowest p-6">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">{locale === "ar" ? "الفعالية" : "Event"}</span>
                  <span className="font-semibold">{event.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">{locale === "ar" ? "التاريخ" : "Date"}</span>
                  <span className="font-mono">{formattedDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">{locale === "ar" ? "طريقة الدفع" : "Payment Method"}</span>
                  <span className="font-mono">{paymentLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">{locale === "ar" ? "التذكرة" : "Ticket"}</span>
                  <span className="font-mono">{ticketLabel}</span>
                </div>
              </div>
              <label className="mb-8 flex items-start gap-3">
                <input className="mt-0.5 accent-secondary" required type="checkbox" />
                <span className="text-xs leading-relaxed text-on-surface-variant">
                  {locale === "ar"
                    ? "أوافق على شروط الخدمة وسياسة الخصوصية."
                    : "I agree to the Terms of Service and Privacy Policy."}
                </span>
              </label>
              <div className="flex gap-4">
                <button className="ghost-border px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant hover:text-on-surface" onClick={() => setStep(2)} type="button">
                  {locale === "ar" ? "السابق" : "Back"}
                </button>
                <button
                  className="flex-1 bg-secondary py-4 text-xs uppercase tracking-widest text-surface-dim hover:bg-primary disabled:opacity-60"
                  disabled={isDuplicateEmail || isCheckingEmail}
                  type="submit"
                >
                  {locale === "ar" ? "تأكيد التسجيل" : "Confirm Registration"}
                </button>
              </div>
            </section>
          ) : null}
        </form>
      </div>

      <aside className="col-span-12 lg:col-span-5">
        <div className="sticky top-24">
          <div className="ghost-border overflow-hidden bg-surface-container-highest">
            <div className="h-40 overflow-hidden">
              <Image alt={event.title} className="h-full w-full object-cover grayscale" height={160} src={event.coverImage} width={600} />
            </div>
            <div className="p-6">
              {event.isFeatured ? (
                <span className="badge-teal mb-3 inline-block font-body">
                  {locale === "ar" ? "حدث مميّز" : "Featured Event"}
                </span>
              ) : null}
              <h3 className="mb-4 text-base font-semibold leading-snug">{event.title}</h3>
              <div className="space-y-2 text-sm text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-3.5" />
                  <span>{formattedDate}</span>
                </div>
                {event.location ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5" />
                    <span>{event.location}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          {!isLoggedIn ? (
            <p className="mt-6 text-center text-xs text-on-surface-variant">
              {locale === "ar" ? "هل لديك حساب؟" : "Have an account?"}{" "}
              <Link className="text-primary hover:text-secondary" href={`/${locale}/auth/login`}>
                {locale === "ar" ? "تسجيل الدخول" : "Log in"}
              </Link>{" "}
              {locale === "ar" ? "للتسجيل بسرعة أكبر." : "for faster registration."}
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
