import { redirect } from "next/navigation";

export default async function DashboardEventsNewRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/programs/new`);
}
