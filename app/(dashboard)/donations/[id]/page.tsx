import { redirect } from "next/navigation";

export default async function DonationsLegacyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/ngo/donations/${id}`);
}
