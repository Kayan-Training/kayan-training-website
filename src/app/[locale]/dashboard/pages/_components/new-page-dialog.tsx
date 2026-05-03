"use client";

import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewPageDialog({
  createAction,
}: {
  createAction: (fd: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createAction(fd);
      setOpen(false);
    });
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        type="button"
        render={
          <Button className="inline-flex h-10 items-center bg-primary/80 text-xs font-semibold uppercase tracking-widest text-primary-container! transition-colors hover:bg-secondary cursor-pointer rounded-[4px] bg-linear-to-t from-black/10 from-20% via-black/5 via-40% to-transparent border-primary border">
            <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
            New Page
          </Button>
        }
      ></DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Custom Page</DialogTitle>
        </DialogHeader>

        <form className="mt-2 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="titleEn">Title (English)</Label>
              <Input
                className="h-10"
                id="titleEn"
                name="titleEn"
                placeholder="About Us"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="titleAr">Title (Arabic)</Label>
              <Input
                className="h-10 text-right"
                dir="rtl"
                id="titleAr"
                name="titleAr"
                placeholder="من نحن"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              className="h-10"
              id="slug"
              name="slug"
              pattern="[a-z0-9-]+"
              placeholder="e.g. about-us"
              required
              title="Lowercase letters, numbers, and hyphens only"
            />
            <p className="text-[11px] text-muted-foreground">
              URL path — lowercase, hyphens only. Accessible at
              /[locale]/[slug].
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border/50 pt-4">
            <Button
              onClick={() => setOpen(false)}
              size="lg"
              type="button"
              variant="outline"
              className={"h-10"}
            >
              Cancel
            </Button>
            <Button
              className="h-10 bg-primary px-5 text-xs font-medium uppercase tracking-widest text-primary-foreground hover:bg-secondary"
              disabled={isPending}
              size="lg"
              type="submit"
            >
              {isPending ? "Creating…" : "Create Page"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
