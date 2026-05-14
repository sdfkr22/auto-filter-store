import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StoreHeaderShell from "@/components/StoreHeaderShell";
import AccountSubHeader from "@/components/AccountSubHeader";
import FaturaBilgileriForm from "./FaturaBilgileriForm";

export const metadata: Metadata = { title: "Fatura Bilgileri" };

const s = {
  wrap: { minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" } as const,
  main: { maxWidth: 520, margin: "0 auto", padding: "40px 24px" } as const,
  h1: { fontSize: 22, fontWeight: 600, marginBottom: 8 } as const,
  sub: { fontSize: 13, color: "#666", marginBottom: 32 } as const,
};

export default async function FaturaBilgileriPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_corporate, tc_no, tax_no, tax_office")
    .eq("id", user.id)
    .single();

  const safeProfile = {
    is_corporate: profile?.is_corporate ?? false,
    tc_no: profile?.tc_no ?? null,
    tax_no: profile?.tax_no ?? null,
    tax_office: profile?.tax_office ?? null,
  };

  return (
    <div style={s.wrap}>
      <StoreHeaderShell />
      <AccountSubHeader trail={[{ href: "/hesabim", label: "Hesabım" }, { label: "Fatura Bilgileri" }]} />

      <main style={s.main}>
        <h1 style={s.h1}>Fatura Bilgileri</h1>
        <p style={s.sub}>Bu bilgiler sipariş faturalarında kullanılır.</p>
        <FaturaBilgileriForm profile={safeProfile} />
      </main>
    </div>
  );
}
