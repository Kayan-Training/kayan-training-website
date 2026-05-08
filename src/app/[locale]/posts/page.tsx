import { redirect } from "next/navigation";

export default async function LegacyPostsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/blog`);
}
