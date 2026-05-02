"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

export async function upsertSettings(
  entries: { key: string; value: string }[],
): Promise<{ error?: string }> {
  try {
    await Promise.all(
      entries.map((e) =>
        db.setting.upsert({
          where: { key: e.key },
          create: { key: e.key, value: e.value },
          update: { value: e.value },
        }),
      ),
    );
    revalidatePath("/dashboard/settings", "page");
    return {};
  } catch {
    return { error: "Failed to save settings." };
  }
}
