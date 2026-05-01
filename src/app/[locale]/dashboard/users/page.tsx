import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { UsersTable, type UserRow } from "./users-table";

export default async function UsersDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });

  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    banned: u.banned,
    createdAt: u.createdAt,
    locale: activeLocale,
  }));

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">Users</h1>
      </div>
      <UsersTable locale={activeLocale} users={rows} />
    </section>
  );
}
