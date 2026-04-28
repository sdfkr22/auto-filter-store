import type { Metadata } from "next";
import FilterWidget from "@/components/FilterWidget";
import StoreHeaderShell from "@/components/StoreHeaderShell";

export const metadata: Metadata = {
  title: "auto-filter | MANN-FILTER & FILTRON Filtre Mağazası",
};

const s = {
  wrap: { minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" } as const,
  main: { maxWidth: 820, margin: "0 auto", padding: "60px 24px 80px" } as const,
  hero: { textAlign: "center" as const, marginBottom: 48 },
  h1: { fontSize: 34, fontWeight: 700, marginBottom: 12, lineHeight: 1.2 } as const,
  h1Span: { color: "#8fa4c0" } as const,
  sub: { fontSize: 15, color: "#666", lineHeight: 1.6, maxWidth: 440, margin: "0 auto" } as const,
  footer: { borderTop: "1px solid #141414", padding: "24px 28px", textAlign: "center" as const, fontSize: 12, color: "#444" },
};

export default async function HomePage() {
  return (
    <div style={s.wrap}>
      <StoreHeaderShell />

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
