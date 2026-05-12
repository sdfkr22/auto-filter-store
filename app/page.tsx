import type { Metadata } from "next";
import FilterWidget from "@/components/FilterWidget";
import StoreHeaderShell from "@/components/StoreHeaderShell";

export const metadata: Metadata = {
  title: "auto-filter | MANN-FILTER & FILTRON Filtre Mağazası",
};

const s = {
  wrap: { minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column" as const } as const,
  main: { maxWidth: 1000, width: "100%", margin: "0 auto", padding: "60px 24px 80px", flex: 1 } as const,
  hero: { textAlign: "center" as const, marginBottom: 48 },
  h1: { fontSize: 34, fontWeight: 700, marginBottom: 10, lineHeight: 1.2 } as const,
  brandRow: { display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap" as const, gap: 8, marginTop: 6 } as const,
  ampersand: { color: "#666", fontWeight: 500 } as const,
  mannBadge: { display: "inline-block", background: "#00A758", color: "#FFED00", padding: "0 3px", borderRadius: 3, fontWeight: 800, letterSpacing: 0.3, lineHeight: 1.1 } as const,
  filtronBadge: { display: "inline-block", background: "#ffffff", color: "#000000", padding: "0 3px", borderRadius: 3, fontWeight: 800, letterSpacing: 0.3, lineHeight: 1.1 } as const,
  sub: { fontSize: 13, color: "#666", lineHeight: 1.5, margin: "10px auto 0", whiteSpace: "nowrap" as const } as const,
  footer: { padding: "14px 28px", textAlign: "center" as const, fontSize: 12, color: "#444", backgroundImage: "linear-gradient(90deg, #00A758, #FFED00)", backgroundSize: "100% 0.5px", backgroundPosition: "top", backgroundRepeat: "no-repeat" },
};

export default async function HomePage() {
  return (
    <div style={s.wrap}>
      <StoreHeaderShell />

      <main style={s.main}>
        <div style={s.hero}>
          <h1 style={s.h1}>
            Aracınıza Uyumlu
            <div style={s.brandRow}>
              <span style={s.mannBadge}>MANN-FILTER</span>
              <span style={s.ampersand}>&</span>
              <span style={s.filtronBadge}>FILTRON</span>
            </div>
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
