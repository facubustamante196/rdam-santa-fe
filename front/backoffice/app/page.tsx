import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  redirect(role === "SUPERVISOR" ? "/dashboard" : "/solicitudes");
}
