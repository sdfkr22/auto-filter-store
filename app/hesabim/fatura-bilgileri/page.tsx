import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FaturaBilgileriForm from "./FaturaBilgileriForm";

export const metadata: Metadata = { title: "Fatura Bilgileri" };

const s = {
  wrap: { minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" } as const,
  header: { borderBottom: "1px solid #1a1a1a", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 } as const,
  back: { fontSize: 13, color: "#888", textDecoration: "none" } as const,
  sep: { color: "#333", fontSize: 13 } as const,
  pageTitle: { fontSize: 13, color: "#e5e5e5" } as const,
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
      <header style={s.header}>
        <Link href="/hesabim" style={s.back}>Hesabım</Link>
        <span style={s.sep}>/</span>
        <span style={s.pageTitle}>Fatura Bilgileri</span>
      </header>

      <main style={s.main}>
        <h1 style={s.h1}>Fatura Bilgileri</h1>
        <p style={s.sub}>Bu bilgiler sipariş faturalarında kullanılır.</p>
        <FaturaBilgileriForm profile={safeProfile} />
      </main>
    </div>
  );
}
