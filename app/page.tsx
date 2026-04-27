import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/hesabim/actions";
import FilterWidget from "@/components/FilterWidget";

export const metadata: Metadata = {
  title: "auto-filter | MANN-FILTER & FILTRON Filtre Mağazası",
};

const s = {
  wrap: { minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" } as const,
  header: { borderBottom: "1px solid #141414", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" } as const,
  logo: { fontSize: 20, fontWeight: 700, color: "#e5e5e5", textDecoration: "none" } as const,
  logoDot: { color: "#8fa4c0" } as const,
  nav: { display: "flex", alignItems: "center", gap: 8 } as const,
  navLink: { fontSize: 13, color: "#888", textDecoration: "none", padding: "6px 14px", borderRadius: 6 } as const,
  navLinkPrimary: { fontSize: 13, color: "#090909", textDecoration: "none", padding: "6px 16px", borderRadius: 6, background: "#8fa4c0", fontWeight: 600 } as const,
  greeting: { fontSize: 13, color: "#aaa", marginRight: 4 } as const,
  greetingName: { color: "#e5e5e5", fontWeight: 600 } as const,
  logoutBtn: { fontSize: 13, color: "#888", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit" } as const,
  main: { maxWidth: 820, margin: "0 auto", padding: "60px 24px 80px" } as const,
  hero: { textAlign: "center" as const, marginBottom: 48 },
  h1: { fontSize: 34, fontWeight: 700, marginBottom: 12, lineHeight: 1.2 } as const,
  h1Span: { color: "#8fa4c0" } as const,
  sub: { fontSize: 15, color: "#666", lineHeight: 1.6, maxWidth: 440, margin: "0 auto" } as const,
  footer: { borderTop: "1px solid #141414", padding: "24px 28px", textAlign: "center" as const, fontSize: 12, color: "#444" },
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    displayName =
      profile?.full_name ||
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      user.email ||
      null;
  }

  return (
    <div style={s.wrap}>
      <header style={s.header}>
        <Link href="/" style={s.logo}>
          auto<span style={s.logoDot}>-filter</span>
        </Link>
        <nav style={s.nav}>
          <Link href="/urunler" className="nav-link" style={s.navLink}>Ürünler</Link>
          {user ? (
            <>
              <span style={s.greeting}>
                Hoşgeldin <span style={s.greetingName}>{displayName}</span>
              </span>
              <Link href="/hesabim" style={s.navLinkPrimary}>Hesabım</Link>
              <form action={signOut}>
                <button type="submit" className="nav-link" style={s.logoutBtn}>Çıkış Yap</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/giris" className="nav-link" style={s.navLink}>Giriş Yap</Link>
              <Link href="/kayit" style={s.navLinkPrimary}>Kayıt Ol</Link>
            </>
          )}
        </nav>
      </header>

      <main style={s.main}>
        <div style={s.hero}>
          <h1 style={s.h1}>
            Aracınıza Uygun<br />
            <span style={s.h1Span}>MANN-FILTER & FILTRON</span>
          </h1>
          <p style={s.sub}>
            Marka, model ve motor bilgisiyle saniyeler içinde doğru filtreyi bulun.
          </p>
        </div>

        <FilterWidget />
      </main>

      <footer style={s.footer}>
        © {new Date().getFullYear()} auto-filter — MANN-FILTER & FILTRON yetkili satıcısı
      </footer>
    </div>
  );
}
