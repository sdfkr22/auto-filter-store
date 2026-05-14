import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StoreHeaderShell from "@/components/StoreHeaderShell";
import AccountSubHeader from "@/components/AccountSubHeader";
import AdreslerView from "./AdreslerView";

export const metadata: Metadata = { title: "Adreslerim" };

const s = {
  wrap: { minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" } as const,
  main: { maxWidth: 760, margin: "0 auto", padding: "40px 24px" } as const,
  h1: { fontSize: 22, fontWeight: 600, marginBottom: 8 } as const,
  sub: { fontSize: 13, color: "#666", marginBottom: 32 } as const,
};

export default async function AdreslerimPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/giris");

  const { data: addresses } = await sb
    .from("addresses")
    .select("id, title, full_name, phone, full_address, city, district, zip, is_default")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("title");

  return (
    <div style={s.wrap}>
      <StoreHeaderShell />
      <AccountSubHeader trail={[{ href: "/hesabim", label: "Hesabım" }, { label: "Adreslerim" }]} />

      <main style={s.main}>
        <h1 style={s.h1}>Adreslerim</h1>
        <p style={s.sub}>Teslimat ve fatura adreslerini yönet. Varsayılan adres ödeme sayfasında otomatik seçilir.</p>
        <AdreslerView addresses={addresses ?? []} />
      </main>
    </div>
  );
}
