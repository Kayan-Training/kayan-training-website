import Image from "next/image";
import { AnimatedCategoryIcons } from "@/components/shared/animated-category-icons";
import { getAnimatedCategoryIcons } from "@/lib/content/category-icons";
import { isSupportedLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Coming Soon",
  robots: { follow: false, index: false },
};

type TapeKind = "chevron" | "slash" | "warning";
type TapeDirection = "left" | "right";

function MaintenanceTapeLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
      {/* Top-left cluster */}
      <TapeStrip
        kind="chevron"
        direction="right"
        duration="18s"
        className="absolute -left-[28vw] top-[8vh] w-[115vw] -rotate-[15deg]"
      />

      <TapeStrip
        kind="warning"
        direction="left"
        duration="24s"
        className="absolute -left-[34vw] top-[18vh] w-[112vw] -rotate-[15deg]"
      />

      {/* Bottom-right cluster */}
      <TapeStrip
        kind="warning"
        direction="right"
        duration="26s"
        className="absolute -right-[34vw] bottom-[19vh] w-[112vw] -rotate-[15deg]"
      />

      <TapeStrip
        kind="slash"
        direction="left"
        duration="20s"
        className="absolute -right-[24vw] bottom-[8vh] w-[110vw] -rotate-[15deg]"
      />
    </div>
  );
}

function TapeStrip({
  kind,
  direction,
  duration,
  className,
}: {
  kind: TapeKind;
  direction: TapeDirection;
  duration: string;
  className?: string;
}) {
  return (
    <div className={cn("tape-strip", className)}>
      <div
        className={cn(
          "tape-runner",
          direction === "left" ? "tape-runner-left" : "tape-runner-right",
        )}
        style={{ animationDuration: duration }}
      >
        <TapePattern kind={kind} />
        <TapePattern kind={kind} />
      </div>
    </div>
  );
}

function TapePattern({ kind }: { kind: TapeKind }) {
  if (kind === "chevron") {
    return (
      <div className="tape-pattern tape-pattern-chevron" aria-hidden="true">
        {Array.from({ length: 26 }, (_, index) => (
          <span key={index} className="tape-chevron-mark" />
        ))}
      </div>
    );
  }

  if (kind === "slash") {
    return (
      <div className="tape-pattern tape-pattern-slash" aria-hidden="true">
        {Array.from({ length: 34 }, (_, index) => (
          <span key={index} className="tape-slash-mark" />
        ))}
      </div>
    );
  }

  return (
    <div className="tape-pattern tape-pattern-warning" aria-hidden="true">
      {Array.from({ length: 9 }, (_, index) => (
        <span key={index} className="tape-warning-unit">
          <span className="tape-warning-stripes" />
          <span className="tape-warning-text">UNDER CONSTRUCTION</span>
        </span>
      ))}
    </div>
  );
}

export default async function MaintenancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const isAr = activeLocale === "ar";
  const icons = await getAnimatedCategoryIcons(activeLocale);

  return (
    <main
      className="fixed inset-0 z-[100] min-h-screen overflow-hidden bg-[#161616] text-white"
      dir={isAr ? "rtl" : "ltr"}
    >
      <MaintenanceTapeLayer />

      <p className="absolute right-6 top-6 z-10 text-sm text-white/45">
        تفعيلٌ للملكات
      </p>

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mb-9">
          <Image
            src={"/brand/kayan-logo.svg"}
            width={240}
            height={240}
            style={{ height: "auto", width: "auto" }}
            alt="Kayan Training & Consulting"
          />
        </div>

        <div className="space-y-3">
          <p className="text-[clamp(1.1rem,2.2vw,1.7rem)] font-medium">
            {isAr
              ? "نستعـد لخـدمتكم بشـكل أفضل"
              : "We are preparing to serve you better"}
          </p>
          <h1 className="text-[clamp(1.7rem,3.6vw,2.8rem)] font-semibold">
            {isAr ? "الموقـع تحت الصيانـة" : "The site under maintenance"}
          </h1>
          <p className="text-sm text-white/55">
            {isAr
              ? "نعمل حالياً على التحسين وسنعود قريباً."
              : "We are currently improving the experience and will be back shortly."}
          </p>
        </div>

        <AnimatedCategoryIcons className="mt-9" icons={icons} />
      </section>
    </main>
  );
}

