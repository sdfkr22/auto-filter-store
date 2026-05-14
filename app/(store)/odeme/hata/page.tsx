import type { Metadata } from "next";
import Link from "next/link";
import StoreHeaderShell from "@/components/StoreHeaderShell";

export const metadata: Metadata = { title: "Ödeme Başarısız" };

type SearchParams = Promise<{ reason?: string }>;

export default async function OdemeHataPage({ searchParams }: { searchParams: SearchParams }) {
  const { reason } = await searchParams;

  return (
    <div style={{ minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" }}>
      <StoreHeaderShell />
      <main style={{ maxWidth: 600, margin: "0 auto", padding: "60px 24px 80px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12, color: "#e05252" }}>✕</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Ödeme tamamlanamadı</h1>
        <p style={{ fontSize: 14, color: "#aaa", marginBottom: 8 }}>
          Ödeme işleminiz başarısız oldu. Stoklarınız serbest bırakıldı, herhangi bir tutar tahsil edilmedi.
        </p>
        {reason && (
          <div style={{ background: "#2a1414", border: "1px solid #5a2020", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#e05252", marginTop: 16, marginBottom: 24, display: "inline-block" }}>
            {reason}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "center" }}>
          <Link href="/sepet" style={{ background: "#FFED00", color: "#0a0a0a", borderRadius: 8, padding: "11px 22px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            Sepete Dön
          </Link>
          <Link href="/odeme" style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#aaa", borderRadius: 8, padding: "11px 22px", fontSize: 14, textDecoration: "none" }}>
            Tekrar Dene
          </Link>
        </div>
      </main>
    </div>
  );
}
