"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

type ContactFormProps = {
  locale: "ar" | "en";
  content: {
    companyLabel: string;
    emailLabel: string;
    errorMessage: string;
    nameLabel: string;
    phoneLabel: string;
    queryLabel: string;
    submitLabel: string;
    submittingLabel: string;
    successMessage: string;
    successTitle: string;
  };
};

export function ContactForm({ locale, content }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [submittedName, setSubmittedName] = useState("");

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true);
    setStatus("idle");
    setMessage("");

    const name = String(formData.get("name") ?? "").trim();
    const payload = {
      name,
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      company: String(formData.get("company") ?? "").trim(),
      query: String(formData.get("query") ?? "").trim(),
      locale,
    };

    try {
      const res = await fetch("/api/contact", {
        body: JSON.stringify(payload),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      const data = (await res.json()) as { message?: string; success?: boolean };
      if (!res.ok || !data.success) {
        setStatus("error");
        setMessage(
          data.message ||
            content.errorMessage,
        );
        return;
      }

      setStatus("success");
      setSubmittedName(name);
      setMessage(content.successMessage);
      const form = document.getElementById("contact-form") as HTMLFormElement | null;
      form?.reset();
    } catch {
      setStatus("error");
      setMessage(content.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "success") {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 border border-primary/35 bg-surface-container-lowest px-6 py-10 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="relative grid place-items-center">
          <span className="absolute h-24 w-24 rounded-full bg-primary/20 blur-xl animate-pulse" />
          <CheckCircle2 className="relative h-20 w-20 text-primary" strokeWidth={1.6} />
        </div>
        <h3 className="text-2xl font-semibold text-on-surface">
          {content.successTitle}
        </h3>
        <p className="max-w-xl text-sm leading-relaxed text-on-surface-variant md:text-base">
          {message.replaceAll("{name}", submittedName || "")}
        </p>
      </div>
    );
  }

  const fieldCls =
    "h-11 w-full border border-zinc-300 bg-white px-3 text-sm text-black outline-none transition-colors " +
    "placeholder:text-zinc-500 focus:border-primary";
  const textareaCls =
    "min-h-36 w-full border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none transition-colors " +
    "placeholder:text-zinc-500 focus:border-primary";

  return (
    <form action={onSubmit} className="space-y-4" id="contact-form">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm text-on-surface-variant">
          <span>{content.nameLabel}</span>
          <input className={fieldCls} name="name" required type="text" />
        </label>
        <label className="space-y-1.5 text-sm text-on-surface-variant">
          <span>{content.emailLabel}</span>
          <input className={fieldCls} name="email" required type="email" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm text-on-surface-variant">
          <span>{content.phoneLabel}</span>
          <input className={fieldCls} name="phone" type="tel" />
        </label>
        <label className="space-y-1.5 text-sm text-on-surface-variant">
          <span>{content.companyLabel}</span>
          <input className={fieldCls} name="company" type="text" />
        </label>
      </div>
      <label className="space-y-1.5 text-sm text-on-surface-variant">
        <span>{content.queryLabel}</span>
        <textarea className={textareaCls} name="query" required />
      </label>
      <button className="h-11 bg-primary px-6 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting
          ? content.submittingLabel
          : content.submitLabel}
      </button>
      {status === "error" ? <p className="text-sm text-red-400">{message}</p> : null}
    </form>
  );
}
