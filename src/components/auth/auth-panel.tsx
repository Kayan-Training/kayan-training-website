"use client";

/**
 * Auth panel matching the reference login/register composition while keeping Better Auth actions.
 */
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { signIn, signOut, signUp, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";
const AUTH_REQUEST_TIMEOUT_MS = 15000;

type PasswordRule = {
  key: string;
  ok: boolean;
};

function getPasswordRules(password: string): PasswordRule[] {
  return [
    { key: "length", ok: password.length >= 8 },
    { key: "upper", ok: /[A-Z]/.test(password) },
    { key: "lower", ok: /[a-z]/.test(password) },
    { key: "number", ok: /\d/.test(password) },
    { key: "symbol", ok: /[^A-Za-z0-9]/.test(password) },
  ];
}

function isPasswordValid(password: string): boolean {
  return getPasswordRules(password).every((rule) => rule.ok);
}

const copy = {
  ar: {
    tabLogin: "تسجيل الدخول",
    tabRegister: "إنشاء حساب",
    welcome: "مرحباً بعودتك",
    welcomeSub: "أدخل بيانات حسابك للمتابعة",
    createTitle: "إنشاء حساب جديد",
    createSub: "انضم لمجتمع كيان وابدأ رحلة التطوير",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    forgot: "نسيت كلمة المرور؟",
    remember: "تذكّرني",
    fullName: "الاسم الكامل",
    preferredLanguage: "اللغة المفضلة",
    arabic: "العربية",
    english: "الإنجليزية",
    agree: "أوافق على شروط الاستخدام",
    login: "تسجيل الدخول",
    create: "إنشاء الحساب",
    loading: "يرجى الانتظار...",
    noAccount: "ليس لديك حساب؟",
    haveAccount: "لديك حساب بالفعل؟",
    createNow: "أنشئ حساباً الآن",
    loginNow: "تسجيل الدخول",
    backToSite: "العودة إلى الموقع",
    signedIn: "تم تسجيل الدخول",
    signOut: "تسجيل الخروج",
    signInError: "تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور.",
    signUpError: "تعذر إنشاء الحساب. يرجى المحاولة مرة أخرى.",
    passwordRulesTitle: "يجب أن تحتوي كلمة المرور على:",
    ruleLength: "8 أحرف على الأقل",
    ruleUpper: "حرف كبير واحد على الأقل",
    ruleLower: "حرف صغير واحد على الأقل",
    ruleNumber: "رقم واحد على الأقل",
    ruleSymbol: "رمز خاص واحد على الأقل",
    passwordWeak: "كلمة المرور لا تستوفي جميع المتطلبات.",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
  },
  en: {
    tabLogin: "Login",
    tabRegister: "Create Account",
    welcome: "Welcome Back",
    welcomeSub: "Enter your account details to continue",
    createTitle: "Create New Account",
    createSub: "Join the Kayan community and begin your development journey",
    email: "Email Address",
    password: "Password",
    confirmPassword: "Confirm Password",
    forgot: "Forgot password?",
    remember: "Remember me",
    fullName: "Full Name",
    preferredLanguage: "Preferred Language",
    arabic: "Arabic",
    english: "English",
    agree: "I agree to the Terms of Use",
    login: "Login",
    create: "Create Account",
    loading: "Please wait...",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    createNow: "Create one now",
    loginNow: "Log in",
    backToSite: "Back to Site",
    signedIn: "Signed in",
    signOut: "Sign out",
    signInError: "Sign in failed. Check your email and password.",
    signUpError: "Sign up failed. Please try again.",
    passwordRulesTitle: "Password must include:",
    ruleLength: "At least 8 characters",
    ruleUpper: "At least 1 uppercase letter",
    ruleLower: "At least 1 lowercase letter",
    ruleNumber: "At least 1 number",
    ruleSymbol: "At least 1 special character",
    passwordWeak: "Password does not meet all requirements.",
    passwordMismatch: "Passwords do not match.",
  },
} as const;

export function AuthPanel({ locale }: { locale: "ar" | "en" }) {
  const router = useRouter();
  const t = copy[locale];
  const inputClass =
    "input-underline w-full bg-white px-3 py-3 text-sm !text-black caret-black outline-none transition-colors placeholder:!text-zinc-600";
  const { data: session } = useSession();
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [preferredLocale, setPreferredLocale] = useState<"ar" | "en">(locale);
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("AUTH_REQUEST_TIMEOUT"));
      }, timeoutMs);

      promise
        .then((value) => {
          clearTimeout(timeout);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      const result = await withTimeout(
        signIn.email({
          email,
          password,
          rememberMe,
        }),
        AUTH_REQUEST_TIMEOUT_MS,
      );

      if (result.error) {
        console.error("[AuthPanel] Sign-in failed with API error", {
          message: result.error.message,
          code: (result.error as { code?: string })?.code,
          email,
          locale,
        });
        setMessage(result.error.message ?? t.signInError);
        return;
      }
      const role = (result.data?.user as { role?: string } | undefined)?.role;
      router.push(
        role === "admin" ? `/${locale}/dashboard` : `/${locale}/events`,
      );
    } catch (error) {
      const timedOut = error instanceof Error && error.message === "AUTH_REQUEST_TIMEOUT";
      console.error("[AuthPanel] Sign-in request threw", {
        timedOut,
        error,
        email,
        locale,
      });
      setMessage(
        timedOut
          ? locale === "ar"
            ? "انتهت مهلة تسجيل الدخول. يرجى المحاولة مرة أخرى."
            : "Login timed out. Please try again."
          : t.signInError,
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!agree) {
      setMessage(
        locale === "ar"
          ? "يرجى الموافقة على الشروط."
          : "Please agree to the terms.",
      );
      return;
    }
    if (!isPasswordValid(password)) {
      setMessage(t.passwordWeak);
      return;
    }
    if (password !== confirmPassword) {
      setMessage(t.passwordMismatch);
      return;
    }

    setIsLoading(true);
    setMessage("");
    try {
      const result = await withTimeout(
        signUp.email({
          name: fullName.trim(),
          email,
          password,
        }),
        AUTH_REQUEST_TIMEOUT_MS,
      );

      if (result.error) {
        console.error("[AuthPanel] Sign-up failed with API error", {
          message: result.error.message,
          code: (result.error as { code?: string })?.code,
          email,
          locale,
        });
        setMessage(result.error.message ?? t.signUpError);
        return;
      }

      router.push(`/${locale}/events`);
    } catch (error) {
      const timedOut = error instanceof Error && error.message === "AUTH_REQUEST_TIMEOUT";
      console.error("[AuthPanel] Sign-up request threw", {
        timedOut,
        error,
        email,
        locale,
      });
      setMessage(
        timedOut
          ? locale === "ar"
            ? "انتهت مهلة إنشاء الحساب. يرجى المحاولة مرة أخرى."
            : "Sign-up timed out. Please try again."
          : t.signUpError,
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (session?.user) {
    return (
      <section className="space-y-4">
        <div className="ghost-border glass-panel p-6">
          <h2 className="mb-2 text-xl font-semibold">{t.signedIn}</h2>
          <p className="mb-4 text-sm text-on-surface-variant">
            {session.user.email}
          </p>
          <button
            className="ghost-border px-4 py-2 text-xs"
            onClick={async () => {
              await signOut();
            }}
            type="button"
          >
            {t.signOut}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-8 flex gap-0 border-b border-[color:oklch(0.32_0.012_207/0.2)]">
        <button
          className={cn(
            "auth-tab pb-4 px-8 text-sm font-semibold transition-all duration-300 border-b-2 cursor-pointer",
            mode === "login"
              ? "active  border-primary text-primary"
              : "text-on-surface-variant border-transparent",
          )}
          onClick={() => setMode("login")}
          type="button"
        >
          {t.tabLogin}
        </button>
        <button
          className={cn(
            "auth-tab pb-4 px-8 text-sm font-semibold transition-all duration-300 border-b-2 cursor-pointer",
            mode === "register"
              ? "active  border-primary text-primary"
              : "text-on-surface-variant border-transparent",
          )}
          onClick={() => setMode("register")}
          type="button"
        >
          {t.tabRegister}
        </button>
      </div>

      {mode === "login" ? (
        <div className="auth-panel active">
          <h1 className="mb-2 font-arabic text-2xl font-black">{t.welcome}</h1>
          <p className="mb-8 text-sm text-on-surface-variant">{t.welcomeSub}</p>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-widest text-on-surface-variant">
                {t.email}
              </label>
              <input
                className={inputClass}
                dir="ltr"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[11px] uppercase tracking-widest text-on-surface-variant">
                  {t.password}
                </label>
                <Link
                  className="text-[11px] text-primary hover:text-secondary"
                  href={`/${locale}/auth/forgot-password`}
                >
                  {t.forgot}
                </Link>
              </div>
              <div className="relative">
                <input
                  className={`${inputClass} pe-10`}
                  dir="ltr"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  className="absolute end-0 top-1/2 -translate-y-1/2 text-outline"
                  onClick={() => setShowPassword((value) => !value)}
                  type="button"
                >
                  <HugeiconsIcon
                    icon={showPassword ? ViewOffIcon : ViewIcon}
                    strokeWidth={2}
                  />
                </button>
              </div>
            </div>
            <label className="flex items-center gap-3">
              <input
                checked={rememberMe}
                className="h-4 w-4 accent-secondary"
                onChange={(event) => setRememberMe(event.target.checked)}
                type="checkbox"
              />
              <span className="text-xs text-on-surface-variant">
                {t.remember}
              </span>
            </label>
            <button
              className="flex w-full items-center justify-center gap-2 bg-primary py-4 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-secondary cursor-pointer"
              disabled={isLoading}
              type="submit"
            >
              <span>{isLoading ? t.loading : t.login}</span>
              <HugeiconsIcon
                className="dir-arrow"
                icon={ArrowRight01Icon}
                strokeWidth={2}
              />
            </button>
            <p className="text-center text-xs text-on-surface-variant">
              {t.noAccount}{" "}
              <button
                className="text-primary hover:text-secondary"
                onClick={() => setMode("register")}
                type="button"
              >
                {t.createNow}
              </button>
            </p>
          </form>
        </div>
      ) : (
        <div className="auth-panel active">
          <h2 className="mb-2 font-arabic text-2xl font-black">
            {t.createTitle}
          </h2>
          <p className="mb-8 text-sm text-on-surface-variant">{t.createSub}</p>

          <form className="space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-widest text-on-surface-variant">
                {t.fullName}
              </label>
              <input
                className={inputClass}
                onChange={(event) => setFullName(event.target.value)}
                required
                value={fullName}
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-widest text-on-surface-variant">
                {t.email}
              </label>
              <input
                className={inputClass}
                dir="ltr"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-widest text-on-surface-variant">
                {t.password}
              </label>
              <div className="relative">
                <input
                  className={`${inputClass} pe-10`}
                  dir="ltr"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type={showRegisterPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  className="absolute end-0 top-1/2 -translate-y-1/2 text-outline"
                  onClick={() => setShowRegisterPassword((value) => !value)}
                  type="button"
                >
                  <HugeiconsIcon
                    icon={showRegisterPassword ? ViewOffIcon : ViewIcon}
                    strokeWidth={2}
                  />
                </button>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-[11px] text-on-surface-variant">
                  {t.passwordRulesTitle}
                </p>
                {(() => {
                  const rules = getPasswordRules(password);
                  return (
                    <ul className="space-y-1 text-[11px]">
                      <li
                        className={
                          rules[0]?.ok
                            ? "text-emerald-400"
                            : "text-on-surface-variant"
                        }
                      >
                        {t.ruleLength}
                      </li>
                      <li
                        className={
                          rules[1]?.ok
                            ? "text-emerald-400"
                            : "text-on-surface-variant"
                        }
                      >
                        {t.ruleUpper}
                      </li>
                      <li
                        className={
                          rules[2]?.ok
                            ? "text-emerald-400"
                            : "text-on-surface-variant"
                        }
                      >
                        {t.ruleLower}
                      </li>
                      <li
                        className={
                          rules[3]?.ok
                            ? "text-emerald-400"
                            : "text-on-surface-variant"
                        }
                      >
                        {t.ruleNumber}
                      </li>
                      <li
                        className={
                          rules[4]?.ok
                            ? "text-emerald-400"
                            : "text-on-surface-variant"
                        }
                      >
                        {t.ruleSymbol}
                      </li>
                    </ul>
                  );
                })()}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-widest text-on-surface-variant">
                {t.confirmPassword}
              </label>
              <div className="relative">
                <input
                  className={`${inputClass} pe-10`}
                  dir="ltr"
                  minLength={8}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                />
                <button
                  className="absolute end-0 top-1/2 -translate-y-1/2 text-outline"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  type="button"
                >
                  <HugeiconsIcon
                    icon={showConfirmPassword ? ViewOffIcon : ViewIcon}
                    strokeWidth={2}
                  />
                </button>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-widest text-on-surface-variant">
                {t.preferredLanguage}
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2">
                  <input
                    checked={preferredLocale === "ar"}
                    className="accent-secondary"
                    name="preferred-language"
                    onChange={() => setPreferredLocale("ar")}
                    type="radio"
                  />
                  <span className="text-sm">{t.arabic}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    checked={preferredLocale === "en"}
                    className="accent-secondary"
                    name="preferred-language"
                    onChange={() => setPreferredLocale("en")}
                    type="radio"
                  />
                  <span className="text-sm">{t.english}</span>
                </label>
              </div>
            </div>
            <label className="flex items-start gap-3">
              <input
                checked={agree}
                className="mt-0.5 accent-secondary"
                onChange={(event) => setAgree(event.target.checked)}
                required
                type="checkbox"
              />
              <span className="text-xs leading-relaxed text-on-surface-variant">
                {t.agree}
              </span>
            </label>
            <button
              className="flex w-full items-center justify-center gap-2 bg-primary py-4 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-secondary cursor-pointer"
              disabled={isLoading}
              type="submit"
            >
              <span>{isLoading ? t.loading : t.create}</span>
            </button>
            <p className="text-center text-xs text-on-surface-variant">
              {t.haveAccount}{" "}
              <button
                className="text-primary hover:text-secondary"
                onClick={() => setMode("login")}
                type="button"
              >
                {t.loginNow}
              </button>
            </p>
          </form>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          className="inline-flex items-center justify-center gap-2 text-xs text-on-surface-variant hover:text-on-surface"
          href={`/${locale}`}
        >
          <HugeiconsIcon
            className="dir-arrow"
            icon={ArrowLeft01Icon}
            strokeWidth={2}
          />
          <span>{t.backToSite}</span>
        </Link>
      </div>
    </section>
  );
}
