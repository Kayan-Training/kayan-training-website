import Image from "next/image";
import { isSupportedLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export const metadata = { title: "Coming Soon" };

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

type IconDirection = "up" | "down" | "left" | "right";

function AnimatedIcon({
  src,
  alt,
  label,
  direction,
  duration,
  offset,
}: {
  src: string;
  alt: string;
  label: string;
  direction: IconDirection;
  duration?: string;
  offset?: string;
}) {
  const isVertical = direction === "up" || direction === "down";

  const animationClass = {
    up: "animate-icon-loop-up",
    down: "animate-icon-loop-down",
    left: "animate-icon-loop-left",
    right: "animate-icon-loop-right",
  }[direction];

  return (
    <div
      className="relative h-12 w-12 overflow-hidden"
      title={label}
      aria-label={alt}
    >
      <div
        className={cn(
          "absolute inset-0 will-change-transform motion-reduce:animate-none",
          isVertical ? "flex h-[200%] flex-col" : "flex h-full w-[200%]",
          animationClass,
        )}
        style={{
          animationDuration: duration ?? "5.5s",
          animationDelay: offset ?? "0s",
          animationIterationCount: "infinite",
          animationTimingFunction: "linear",
        }}
      >
        <div className="grid h-12 w-12 shrink-0 place-items-center">
          <Image src={src} width={48} height={48} alt={alt} />
        </div>

        <div
          className="grid h-12 w-12 shrink-0 place-items-center"
          aria-hidden="true"
        >
          <Image src={src} width={48} height={48} alt="" />
        </div>
      </div>
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

  const icons = [
    {
      src: "/icons/kayan_profile_Arts.svg",
      alt: "Kayan Arts Icon",
      label: "Arts",
      direction: "up",
      duration: "5.2s",
      offset: "-0.4s",
    },
    {
      src: "/icons/kayan_profile_Economy.svg",
      alt: "Kayan Economy Icon",
      label: "Economy",
      direction: "right",
      duration: "5.8s",
      offset: "-1.2s",
    },
    {
      src: "/icons/kayan_profile_Education & Psychology.svg",
      alt: "Kayan Education & Psychology Icon",
      label: "Education & Psychology",
      direction: "down",
      duration: "6.4s",
      offset: "-2.1s",
    },
    {
      src: "/icons/kayan_profile_Entertainment.svg",
      alt: "Kayan Entertainment Icon",
      label: "Entertainment",
      direction: "left",
      duration: "5.5s",
      offset: "-0.9s",
    },
    {
      src: "/icons/kayan_profile_Lifestyle.svg",
      alt: "Kayan Lifestyle Icon",
      label: "Lifestyle",
      direction: "up",
      duration: "6.1s",
      offset: "-3s",
    },
    {
      src: "/icons/kayan_profile_Management & Leadership.svg",
      alt: "Kayan Management & Leadership Icon",
      label: "Management & Leadership",
      direction: "right",
      duration: "5.9s",
      offset: "-1.8s",
    },
    {
      src: "/icons/kayan_profile_Media & Communication.svg",
      alt: "Kayan Media & Communication Icon",
      label: "Media & Communication",
      direction: "down",
      duration: "6.3s",
      offset: "-2.7s",
    },
    {
      src: "/icons/kayan_profile_Tech.svg",
      alt: "Kayan Tech Icon",
      label: "Tech",
      direction: "left",
      duration: "5.1s",
      offset: "-0.6s",
    },
  ] as const;

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

        <div className="mt-9 grid grid-cols-4 sm:grid-cols-8">
          {icons.map((icon) => (
            <AnimatedIcon
              key={icon.src}
              src={icon.src}
              alt={icon.alt}
              label={icon.label}
              direction={icon.direction}
              duration={icon.duration}
              offset={icon.offset}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
