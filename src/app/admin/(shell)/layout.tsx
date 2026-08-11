import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let username = "admin";
  try {
    const cookieStore = await cookies();
    const session = await getSessionFromCookies(cookieStore);
    if (session) username = session.username;
  } catch {
    // Static export fallback
  }

  return <AdminShell username={username}>{children}</AdminShell>;
}
