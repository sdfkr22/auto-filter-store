import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StoreHeaderShell from "@/components/StoreHeaderShell";
import AccountSubHeader from "@/components/AccountSubHeader";
import ProfilForm from "./ProfilForm";

export const metadata: Metadata = { title: "Profilim" };

const s = {
  wrap: { minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" } as const,
  main: { maxWidth: 520, margin: "0 auto", padding: "40px 24px" } as const,
  h1: { fontSize: 22, fontWeight: 600, marginBottom: 8 } as const,
  sub: { fontSize: 13, color: "#666", marginBottom: 32 } as const,
};

export default async function ProfilimPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  return (
    <div style={s.wrap}>
      <StoreHeaderShell />
      <AccountSubHeader trail={[{ href: "/hesabim", label: "Hesabım" }, { label: "Profilim" }]} />

      <main style={s.main}>
        <h1 style={s.h1}>Profilim</h1>
        <p style={s.sub}>Kişisel bilgilerini ve şifreni güncelle.</p>
        <ProfilForm
          email={user.email ?? ""}
          fullName={profile?.full_name ?? ""}
          phone={profile?.phone ?? ""}
        />
      </main>
    </div>
  );
}
