import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Hesabım" };

const s = {
  wrap: { minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" } as const,
  header: { borderBottom: "1px solid #1a1a1a", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" } as const,
  logo: { fontSize: 18, fontWeight: 700, color: "#e5e5e5", textDecoration: "none" } as const,
  logoDot: { color: "#8fa4c0" } as const,
  main: { maxWidth: 680, margin: "0 auto", padding: "40px 24px" } as const,
  greeting: { fontSize: 22, fontWeight: 600, marginBottom: 4 } as const,
  email: { fontSize: 13, color: "#666", marginBottom: 36 } as const,
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 } as const,
  card: { background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "20px", textDecoration: "none", color: "#e5e5e5", display: "block" } as const,
  cardIcon: { fontSize: 22, marginBottom: 10 } as const,
  cardTitle: { fontSize: 15, fontWeight: 600, marginBottom: 4 } as const,
  cardSub: { fontSize: 12, color: "#666" } as const,
  signOutBtn: { background: "transparent", border: "1px solid #333", borderRadius: 8, padding: "9px 20px", color: "#888", fontSize: 13, cursor: "pointer" } as const,
};

const navItems = [
  { href: "/hesabim/siparislerim", icon: "📦", title: "Siparişlerim", sub: "Sipariş geçmişini görüntüle" },
  { href: "/hesabim/adreslerim", icon: "📍", title: "Adreslerim", sub: "Teslimat adreslerini yönet" },
  { href: "/hesabim/profilim", icon: "👤", title: "Profilim", sub: "Ad, soyad, telefon güncelle" },
  { href: "/hesabim/fatura-bilgileri", icon: "🧾", title: "Fatura Bilgileri", sub: "TC / Vergi numarası" },
];

export default async function HesabimPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name || user.email?.split("@")[0] || "Kullanıcı";

  return (
    <div style={s.wrap}>
      <header style={s.header}>
        <Link href="/" style={s.logo}>auto<span style={s.logoDot}>-filter</span></Link>
        <form action={signOut}>
          <button style={s.signOutBtn} type="submit">Çıkış Yap</button>
        </form>
      </header>

      <main style={s.main}>
        <h1 style={s.greeting}>Merhaba, {displayName}</h1>
        <p style={s.email}>{user.email}</p>

        <div style={s.grid}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} style={s.card}>
              <div style={s.cardIcon}>{item.icon}</div>
              <div style={s.cardTitle}>{item.title}</div>
              <div style={s.cardSub}>{item.sub}</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
