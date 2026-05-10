import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminUser = {
  id: string;
  email: string | null;
  role: "admin";
};

export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") return null;
  return { id: user.id, email: user.email ?? null, role: "admin" };
});

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) redirect("/giris?next=/admin");
  return admin;
}
