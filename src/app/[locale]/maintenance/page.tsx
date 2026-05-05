import { isSupportedLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const tapeChunks = Array.from({ length: 20 }, (_, i) => (
  <span className="flex" key={`tape-${i}`}>
    <span className="inline-flex h-8 items-center bg-[#1e1e1e] px-3 font-mono text-[11px] tracking-[-0.2em] text-[#28b473]">
      ❯❯❯❯❯
    </span>
    <span className="inline-flex h-8 items-center bg-[#28b473] px-4 text-[10px] font-semibold tracking-[0.16em] text-[#101010]">
      UNDER CONSTRUCTION
    </span>
  </span>
));

export const metadata = { title: "Coming Soon" };

export default async function MaintenancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const isAr = activeLocale === "ar";

  return (
    <main className="fixed inset-0 z-[100] min-h-screen overflow-hidden bg-[#161616] text-white" dir={isAr ? "rtl" : "ltr"}>
      <div className="pointer-events-none absolute -left-[78vw] top-0 z-[1] flex w-[250vw] -rotate-[18deg] flex-col gap-1">
        <div className="flex w-max animate-[maintenance_tape_20s_linear_infinite]">{tapeChunks}</div>
        <div className="flex w-max animate-[maintenance_tape_24s_linear_infinite_reverse]">{tapeChunks}</div>
      </div>
      <div className="pointer-events-none absolute -right-[78vw] bottom-0 z-[1] flex w-[250vw] -rotate-[18deg] flex-col gap-1">
        <div className="flex w-max animate-[maintenance_tape_20s_linear_infinite]">{tapeChunks}</div>
        <div className="flex w-max animate-[maintenance_tape_24s_linear_infinite_reverse]">{tapeChunks}</div>
      </div>

      <p className="absolute right-6 top-6 z-10 text-sm text-white/45">تفعيلٌ للملكات</p>

      <section className="relative z-[5] flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mb-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#28b473]">
            Kayan Training & Consulting
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-[clamp(1.1rem,2.2vw,1.7rem)] font-medium">
            {isAr ? "نستعـد لخـدمتكم بشـكل أفضل" : "We are preparing to serve you better"}
          </p>
          <h1 className="text-[clamp(1.7rem,3.6vw,2.8rem)] font-semibold">
            {isAr ? "الموقـع تحت الصيانـة" : "The site under maintenance"}
          </h1>
          <p className="text-sm text-white/55">
            {isAr ? "نعمل حالياً على التحسين وسنعود قريباً." : "We are currently improving the experience and will be back shortly."}
          </p>
        </div>

        <div className="mt-9 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {["#c2b59b", "#2bb673", "#f7c845", "#f26d7d", "#5cc2e8", "#f7941d", "#ec008c", "#8bc34a"].map((color, i) => (
            <div
              className={cn(
                "h-12 w-12 overflow-hidden rounded-sm border border-white/15 bg-[#1d1d1d]",
                "animate-[maintenance_icon_3.4s_ease-in-out_infinite]",
              )}
              key={color}
              style={{ animationDelay: `${1.4 + i * 0.12}s` }}
            >
              <svg className="h-full w-full" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <rect fill="#111111" height="40" width="40" x="0" y="0" />
                <circle cx="20" cy="20" fill={color} r="9.5" />
                <rect fill={color} height="4" opacity="0.7" rx="2" width="20" x="10" y="29" />
                <rect fill={color} height="4" opacity="0.45" rx="2" width="20" x="10" y="7" />
              </svg>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
