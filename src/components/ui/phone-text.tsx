import type { ReactNode } from "react";

export function PhoneText({ children }: { children: ReactNode }) {
  return (
    <bdi dir="ltr" className="inline-block text-left">
      {children}
    </bdi>
  );
}
