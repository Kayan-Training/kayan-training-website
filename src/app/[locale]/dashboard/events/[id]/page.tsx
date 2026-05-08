import { redirect } from "next/navigation";

export default async function DashboardEventsEditRedirect({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  redirect(`/${locale}/dashboard/programs/${id}`);
}
