"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function OpenCreateRegistrationButton() {
  return (
    <Button
      className="h-10 shrink-0 gap-1.5"
      onClick={() => {
        window.dispatchEvent(new CustomEvent("dashboard:open-create-registration"));
      }}
      type="button"
    >
      <Plus className="size-4" />
      New Registration
    </Button>
  );
}

