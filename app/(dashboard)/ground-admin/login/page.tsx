import { redirect } from "next/navigation";

export default function GroundAdminLoginPage() {
  redirect("/admin/login?role=GROUND_ADMIN");
}
