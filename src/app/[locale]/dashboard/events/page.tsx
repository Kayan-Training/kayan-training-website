import { redirect } from "next/navigation";

export const metadata = { title: "Programs" };

export default async function DashboardEventsRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/programs`);
}
