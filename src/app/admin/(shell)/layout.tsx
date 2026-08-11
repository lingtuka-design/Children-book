import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const session = await getSessionFromCookies(cookieStore);
  if (!session) redirect("/admin/login");

  return <AdminShell username={session.username}>{children}</AdminShell>;
}
