import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { UsersTable, type UserRow } from "./users-table";

export const metadata = { title: "Users" };

export default async function UsersDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });
  const totalUsers = users.length;
  const admins = users.filter((u) => u.role === "admin").length;
  const learners = users.filter((u) => u.role === "user").length;
  const banned = users.filter((u) => Boolean(u.banned)).length;

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
    <section className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage access, roles, and account status from one place.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total
          </p>
          <p className="text-lg font-semibold">{totalUsers}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Admins
          </p>
          <p className="text-lg font-semibold">{admins}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Learners
          </p>
          <p className="text-lg font-semibold">{learners}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Banned
          </p>
          <p className="text-lg font-semibold">{banned}</p>
        </div>
      </div>
      <UsersTable locale={activeLocale} users={rows} />
    </section>
  );
}
