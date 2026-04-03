import { redirect } from "next/navigation";

export default async function DonationIDPage({ params }: { params: Promise<{ id: string }> }) {

  redirect("/admin/donations");
}
