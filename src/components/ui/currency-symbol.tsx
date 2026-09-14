import Image from "next/image";

export function CurrencySymbol({
  currency,
  className,
}: {
  currency: string;
  className?: string;
}) {
  if (currency === "OMR") {
    return (
      <Image
        src="/currency/omr-symbol.svg"
        alt="OMR"
        width={16}
        height={16}
        className={className ?? "inline-block h-[0.9em] w-[0.9em] align-middle"}
      />
    );
  }
  if (currency === "USD") {
    return <span className={className}>$</span>;
  }
  return <span className={className}>{currency}</span>;
}
