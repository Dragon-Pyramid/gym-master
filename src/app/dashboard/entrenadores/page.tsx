import { redirect } from "next/navigation";

export default function EntrenadoresLegacyRedirectPage() {
  redirect("/dashboard/empleados");
}
