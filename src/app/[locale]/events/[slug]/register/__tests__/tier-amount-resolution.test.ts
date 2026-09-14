import { describe, expect, it } from "vitest";
import { resolveTierAmount } from "@/lib/registrations/resolve-tier-amount";

describe("resolveTierAmount", () => {
  const tiers = [
    { id: "tier-early", price: 250 },
    { id: "tier-standard", price: 380 },
  ];

  it("returns the flat price when no tier id is submitted", () => {
    expect(resolveTierAmount(tiers, 380, "")).toBe(380);
  });

  it("returns the matching tier's price when a valid tier id is submitted", () => {
    expect(resolveTierAmount(tiers, 380, "tier-early")).toBe(250);
  });

  it("falls back to the flat price when the submitted tier id does not belong to this event's tiers", () => {
    expect(resolveTierAmount(tiers, 380, "tier-from-another-event")).toBe(380);
  });

  it("falls back to the flat price when there are no tiers at all", () => {
    expect(resolveTierAmount([], 380, "anything")).toBe(380);
  });
});
