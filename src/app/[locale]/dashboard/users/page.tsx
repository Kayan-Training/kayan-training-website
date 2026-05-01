import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";

export default async function UsersDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">{activeLocale === "ar" ? "المستخدمون" : "Users"}</h1>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/20 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr className="border-t border-border/60" key={user.id}>
                <td className="px-4 py-3">{user.name ?? "-"}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{user.role}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Intl.DateTimeFormat(activeLocale === "ar" ? "ar-OM" : "en-GB", { dateStyle: "medium" }).format(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
